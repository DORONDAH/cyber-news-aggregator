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
    from .scraper import scrape_bleepingcomputer, scrape_thehackernews
    from .summarizer import summarize_article
except ImportError:
    from models import SessionLocal, Article, engine
    from scraper import scrape_bleepingcomputer, scrape_thehackernews
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

async def fetch_and_summarize_logic():
    db = SessionLocal()
    try:
        articles = await scrape_bleepingcomputer()
        articles += await scrape_thehackernews()

        for art_data in articles:
            existing = db.query(Article).filter(Article.url == art_data['url']).first()
            if not existing:
                summary = await summarize_article(art_data['content'])
                new_art = Article(
                    title=art_data['title'],
                    url=art_data['url'],
                    content=art_data['content'],
                    summary=summary,
                    source=art_data['source'],
                    published_at=art_data['published_at']
                )
                db.add(new_art)
                db.commit()
                db.refresh(new_art)

                summary_json = {
                    "id": new_art.id,
                    "title": new_art.title,
                    "url": new_art.url,
                    "summary": new_art.summary,
                    "source": new_art.source,
                    "published_at": new_art.published_at.isoformat()
                }
                await publisher.publish(json.dumps(summary_json))
    except Exception as e:
        print(f"Error in fetch_and_summarize: {e}")
    finally:
        db.close()

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
