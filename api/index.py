from fastapi import FastAPI, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import asyncio
import json
from datetime import datetime, timedelta, timezone
from sse_starlette.sse import EventSourceResponse
from typing import List
import os

# Relative imports for Vercel
try:
    from .models import SessionLocal, Article, engine
    from .scraper import scrape_bleepingcomputer, scrape_thehackernews, scrape_securityweek
    from .summarizer import summarize_article
except ImportError:
    from models import SessionLocal, Article, engine
    from scraper import scrape_bleepingcomputer, scrape_thehackernews, scrape_securityweek
    from summarizer import summarize_article

# Simple SSE Publisher
class Publisher:
    def __init__(self):
        self.subscribers: List[asyncio.Queue] = []

    async def subscribe(self):
        queue = asyncio.Queue()
        self.subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue):
        if queue in self.subscribers:
            self.subscribers.remove(queue)

    async def publish(self, msg: str):
        for queue in self.subscribers:
            await queue.put(msg)

publisher = Publisher()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def fetch_and_summarize_logic(limit_ai: int = 5):
    db = SessionLocal()
    try:
        await publisher.publish(json.dumps({"status_update": "Scraping BleepingComputer..."}))
        articles = await scrape_bleepingcomputer()

        await publisher.publish(json.dumps({"status_update": "Scraping TheHackerNews..."}))
        articles += await scrape_thehackernews()

        await publisher.publish(json.dumps({"status_update": "Scraping SecurityWeek..."}))
        articles += await scrape_securityweek()

        # Auto-delete articles older than 7 days
        try:
            old_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
            deleted_count = db.query(Article).filter(Article.created_at < old_cutoff).delete()
            db.commit()
        except Exception as e:
            print(f"Error during auto-delete: {e}")

        # Filter for new articles only
        new_count = 0
        for art_data in articles:
            existing = db.query(Article).filter(Article.url == art_data['url']).first()
            if not existing:
                new_art = Article(
                    title=art_data['title'],
                    url=art_data['url'],
                    content=art_data['content'],
                    summary=None, # No summary yet
                    source=art_data['source'],
                    category="General",
                    published_at=art_data['published_at']
                )
                db.add(new_art)
                new_count += 1

        db.commit()

        if new_count > 0:
            await publisher.publish(json.dumps({"status_update": f"Found {new_count} new articles. Starting AI..."}))
            await summarize_batch_logic(limit=limit_ai)
        else:
            await publisher.publish(json.dumps({"status_update": "No new articles found."}))

        await publisher.publish(json.dumps({"status_update": "Done!"}))
    except Exception as e:
        print(f"Error in fetch_and_summarize: {e}")
        await publisher.publish(json.dumps({"status_update": f"Error: {str(e)}"}))
    finally:
        db.close()

async def summarize_batch_logic(limit: int = 5):
    db = SessionLocal()
    try:
        # Get articles that don't have a summary yet
        pending = db.query(Article).filter(Article.summary == None).order_by(Article.created_at.desc()).limit(limit).all()

        if not pending:
            await publisher.publish(json.dumps({"status_update": "All articles are already summarized."}))
            return

        total = len(pending)
        for i, article in enumerate(pending):
            await publisher.publish(json.dumps({"status_update": f"AI Summarizing {i+1}/{total}..."}))
            raw_ai_output = await summarize_article(article.content)

            # Parse CATEGORY and SUMMARY
            category = "General"
            summary = raw_ai_output
            if "CATEGORY:" in raw_ai_output and "SUMMARY:" in raw_ai_output:
                try:
                    parts = raw_ai_output.split("SUMMARY:")
                    category = parts[0].replace("CATEGORY:", "").strip()
                    summary = parts[1].strip()
                except: pass

            article.summary = summary
            article.category = category
            db.commit()

            # Push update to UI
            summary_json = {
                "id": article.id,
                "title": article.title,
                "url": article.url,
                "summary": article.summary,
                "source": article.source,
                "category": article.category,
                "published_at": article.published_at.isoformat()
            }
            await publisher.publish(json.dumps(summary_json))

            # Small 2s delay between batch items for UI smoothness,
            # but we rely on the button for the big blocks
            if i < total - 1:
                await asyncio.sleep(2)

    except Exception as e:
        print(f"Error in batch summarize: {e}")
    finally:
        db.close()

@app.post("/api/summarize-more")
async def summarize_more():
    await summarize_batch_logic(limit=5)
    return {"status": "batch completed"}

@app.get("/api/news")
def get_news(db: Session = Depends(get_db)):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    return db.query(Article).filter(Article.created_at >= cutoff).order_by(Article.created_at.desc()).all()

@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(Article).order_by(Article.created_at.desc()).limit(100).all()

@app.post("/api/settings/clear")
def clear_history(db: Session = Depends(get_db)):
    db.query(Article).delete()
    db.commit()
    return {"status": "success"}

@app.get("/api/cron")
async def cron_trigger():
    """Endpoint to be triggered by Vercel Cron"""
    await fetch_and_summarize_logic()
    return {"status": "scraping completed"}

@app.post("/api/refresh")
async def trigger_refresh():
    await fetch_and_summarize_logic()
    return {"status": "refresh completed"}

@app.get("/api/health")
def health_check():
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")
    return {
        "status": "ok",
        "gemini_key_present": gemini_key is not None and len(gemini_key) > 0,
        "gemini_key_preview": f"{gemini_key[:5]}...{gemini_key[-4:]}" if gemini_key and len(gemini_key) > 10 else "N/A",
        "openai_key_present": openai_key is not None and len(openai_key) > 0,
        "vercel_env": os.environ.get("VERCEL", "false")
    }

@app.get("/api/stream")
async def message_stream(request: Request):
    async def event_generator():
        queue = await publisher.subscribe()
        try:
            while True:
                if await request.is_disconnected():
                    break
                data = await queue.get()
                yield {"data": data}
        finally:
            publisher.unsubscribe(queue)

    return EventSourceResponse(event_generator())
