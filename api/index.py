from fastapi import FastAPI, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import asyncio
import json
import time
from datetime import datetime, timedelta, timezone
from sse_starlette.sse import EventSourceResponse
from typing import List
import os

# Relative imports for Vercel
try:
    from .models import SessionLocal, Article, engine
    from .scraper import (
        scrape_bleepingcomputer, scrape_thehackernews, scrape_securityweek,
        scrape_darkreading, scrape_zerofox, scrape_infosecurity,
        scrape_cisa, scrape_cybernews, scrape_therecord,
        scrape_unit42, scrape_mandiant
    )
    from .summarizer import summarize_article
except ImportError:
    from models import SessionLocal, Article, engine
    from scraper import (
        scrape_bleepingcomputer, scrape_thehackernews, scrape_securityweek,
        scrape_darkreading, scrape_zerofox, scrape_infosecurity,
        scrape_cisa, scrape_cybernews, scrape_therecord,
        scrape_unit42, scrape_mandiant
    )
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

# Simple rate limiting for resource-intensive tasks
last_refresh_time = 0

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

        await publisher.publish(json.dumps({"status_update": "Scraping Dark Reading..."}))
        articles += await scrape_darkreading()

        await publisher.publish(json.dumps({"status_update": "Scraping ZeroFox..."}))
        articles += await scrape_zerofox()

        await publisher.publish(json.dumps({"status_update": "Scraping Infosecurity..."}))
        articles += await scrape_infosecurity()

        await publisher.publish(json.dumps({"status_update": "Scraping CISA..."}))
        articles += await scrape_cisa()

        await publisher.publish(json.dumps({"status_update": "Scraping Cybernews..."}))
        articles += await scrape_cybernews()

        await publisher.publish(json.dumps({"status_update": "Scraping The Record..."}))
        articles += await scrape_therecord()

        await publisher.publish(json.dumps({"status_update": "Scraping Unit 42..."}))
        articles += await scrape_unit42()

        await publisher.publish(json.dumps({"status_update": "Scraping Mandiant..."}))
        articles += await scrape_mandiant()

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
                # Ensure created_at matches published_at for accurate interleaving if needed
                new_art.created_at = art_data['published_at']
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

            # Parse CATEGORY, SEVERITY and SUMMARY
            category = "General"
            severity = "Medium"
            summary = raw_ai_output

            if "CATEGORY:" in raw_ai_output and "SUMMARY:" in raw_ai_output:
                try:
                    parts = raw_ai_output.split("SUMMARY:")
                    header_part = parts[0]
                    summary = parts[1].strip()

                    if "CATEGORY:" in header_part:
                        cat_line = [l for l in header_part.split('\n') if "CATEGORY:" in l][0]
                        category = cat_line.replace("CATEGORY:", "").strip()

                    if "SEVERITY:" in header_part:
                        sev_line = [l for l in header_part.split('\n') if "SEVERITY:" in l][0]
                        severity = sev_line.replace("SEVERITY:", "").strip()
                except: pass

            article.summary = summary
            article.category = category
            # We don't have a severity column in DB yet, but we'll include it in the JSON
            db.commit()

            # Push update to UI
            summary_json = {
                "id": article.id,
                "title": article.title,
                "url": article.url,
                "summary": article.summary,
                "source": article.source,
                "category": article.category,
                "severity": severity,
                "published_at": article.published_at.isoformat()
            }
            await publisher.publish(json.dumps(summary_json))

            # 12s delay between batch items to strictly respect 5 RPM Gemini limit
            if i < total - 1:
                await asyncio.sleep(12)

    except Exception as e:
        print(f"Error in batch summarize: {e}")
    finally:
        db.close()

@app.post("/api/summarize-single")
async def summarize_single(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    article_id = data.get("id")

    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        return {"error": "Article not found"}

    if article.summary:
        return {"status": "already summarized", "article": article}

    raw_ai_output = await summarize_article(article.content)

    # Parse CATEGORY, SEVERITY and SUMMARY
    category = "General"
    severity = "Medium"
    summary = raw_ai_output

    if "CATEGORY:" in raw_ai_output and "SUMMARY:" in raw_ai_output:
        try:
            parts = raw_ai_output.split("SUMMARY:")
            header_part = parts[0]
            summary = parts[1].strip()

            if "CATEGORY:" in header_part:
                cat_line = [l for l in header_part.split('\n') if "CATEGORY:" in l][0]
                category = cat_line.replace("CATEGORY:", "").strip()

            if "SEVERITY:" in header_part:
                sev_line = [l for l in header_part.split('\n') if "SEVERITY:" in l][0]
                severity = sev_line.replace("SEVERITY:", "").strip()
        except: pass

    article.summary = summary
    article.category = category
    db.commit()

    # Refresh object to get updated fields
    db.refresh(article)

    summary_json = {
        "id": article.id,
        "title": article.title,
        "url": article.url,
        "summary": article.summary,
        "source": article.source,
        "category": article.category,
        "severity": severity,
        "published_at": article.published_at.isoformat()
    }

    # Still publish to SSE for any other open tabs
    await publisher.publish(json.dumps(summary_json))

    return summary_json

@app.get("/api/news")
def get_news(db: Session = Depends(get_db)):
    # Filter for articles created since midnight UTC today
    today_midnight = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    articles = db.query(Article).filter(Article.created_at >= today_midnight).order_by(Article.created_at.desc()).all()

    if not articles:
        return []

    # Implement Round-Robin Interleaving by Source
    # Group articles by source
    by_source = {}
    for art in articles:
        if art.source not in by_source:
            by_source[art.source] = []
        by_source[art.source].append(art)

    # Round-robin interleaving
    source_names = sorted(by_source.keys()) # Consistent order
    interleaved = []
    max_len = max(len(v) for v in by_source.values())

    for i in range(max_len):
        for source in source_names:
            if i < len(by_source[source]):
                interleaved.append(by_source[source][i])

    return interleaved

@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(Article).order_by(Article.created_at.desc()).limit(100).all()

@app.post("/api/settings/clear")
def clear_history(db: Session = Depends(get_db)):
    db.query(Article).delete()
    db.commit()
    return {"status": "success"}

@app.get("/api/cron")
async def cron_trigger(background_tasks: BackgroundTasks):
    """Endpoint to be triggered by Vercel Cron"""
    background_tasks.add_task(fetch_and_summarize_logic)
    return {"status": "scraping started"}

@app.post("/api/refresh")
async def trigger_refresh(background_tasks: BackgroundTasks):
    global last_refresh_time
    now = time.time()

    # Prevent refreshes more than once every 5 minutes to save quota
    if now - last_refresh_time < 300:
        return {"status": "cooling down", "seconds_left": int(300 - (now - last_refresh_time))}

    last_refresh_time = now
    background_tasks.add_task(fetch_and_summarize_logic)
    return {"status": "refresh started"}

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
