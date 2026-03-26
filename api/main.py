import os
import sys
import json
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import FastAPI, Depends, BackgroundTasks, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sse_starlette.sse import EventSourceResponse

# Add current directory to path for relative imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import SessionLocal, Article, init_db, get_db
import scrapers
from summarizer import summarize_article

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple SSE Publisher
class Publisher:
    def __init__(self):
        self.subscribers: List[asyncio.Queue] = []

    async def subscribe(self) -> asyncio.Queue:
        queue = asyncio.Queue()
        self.subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue):
        if queue in self.subscribers:
            self.subscribers.remove(queue)

    async def publish(self, msg: dict):
        msg_str = json.dumps(msg)
        for queue in self.subscribers:
            await queue.put(msg_str)

publisher = Publisher()

# Initialize FastAPI app
app = FastAPI(title="Cyber News Aggregator API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Scheduler
scheduler = AsyncIOScheduler()

# Core Business Logic
async def fetch_intel_cycle():
    """Periodic task to collect news from all sources."""
    db = SessionLocal()
    try:
        await publisher.publish({"status_update": "Starting global intel collection..."})
        logger.info("Starting global intel collection...")

        # Get all articles from all sources
        scraped_data = await scrapers.scrape_all_sources()
        new_count = 0

        for art_data in scraped_data:
            existing = db.query(Article).filter(Article.url == art_data['url']).first()
            if not existing:
                new_art = Article(
                    title=art_data['title'],
                    url=art_data['url'],
                    content=art_data['content'],
                    summary=None,
                    source=art_data['source'],
                    category="General",
                    severity="Medium",
                    published_at=art_data['published_at']
                )
                db.add(new_art)
                db.flush() # Get ID

                # Immediate push to UI
                article_json = {
                    "id": new_art.id,
                    "title": new_art.title,
                    "url": new_art.url,
                    "summary": None,
                    "source": new_art.source,
                    "category": "General",
                    "severity": "Medium",
                    "published_at": new_art.published_at.isoformat()
                }
                await publisher.publish(article_json)
                new_count += 1

        db.commit()
        logger.info(f"Intel collection complete. {new_count} new articles.")
        await publisher.publish({"status_update": f"Intel collection complete. Found {new_count} new items."})

        # Auto-Cleanup: Older than 7 days
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        deleted = db.query(Article).filter(Article.created_at < cutoff).delete()
        db.commit()
        if deleted > 0:
            logger.info(f"Cleaned up {deleted} stale articles.")

    except Exception as e:
        logger.error(f"Error in fetch_intel_cycle: {e}")
        await publisher.publish({"status_update": f"Warning: Intel collection failed ({str(e)})"})
    finally:
        db.close()

async def summarization_cycle(limit: int = 5):
    """Periodic task to process unsummarized articles."""
    db = SessionLocal()
    try:
        pending = db.query(Article).filter(Article.summary == None).order_by(Article.created_at.desc()).limit(limit).all()
        if not pending:
            return

        for i, article in enumerate(pending):
            await publisher.publish({"status_update": f"AI Analyzing {i+1}/{len(pending)}: {article.title[:30]}..."})
            raw_output = await summarize_article(article.content)

            # Parse Category and Severity
            category, severity, summary = "General", "Medium", raw_output
            if "CATEGORY:" in raw_output and "SUMMARY:" in raw_output:
                try:
                    parts = raw_output.split("SUMMARY:")
                    summary = parts[1].strip()
                    header = parts[0]
                    if "CATEGORY:" in header:
                        category = [l for l in header.split('\n') if "CATEGORY:" in l][0].replace("CATEGORY:", "").strip()
                    if "SEVERITY:" in header:
                        severity = [l for l in header.split('\n') if "SEVERITY:" in l][0].replace("SEVERITY:", "").strip()
                except: pass

            article.category = category
            article.severity = severity
            article.summary = summary
            db.commit()

            # Push update to UI
            await publisher.publish({
                "id": article.id,
                "title": article.title,
                "url": article.url,
                "summary": article.summary,
                "source": article.source,
                "category": article.category,
                "severity": article.severity,
                "published_at": article.published_at.isoformat()
            })

            # Respect Rate Limits (60s / 5 RPM = 12s delay)
            if i < len(pending) - 1:
                await asyncio.sleep(12)

    except Exception as e:
        logger.error(f"Error in summarization_cycle: {e}")
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    init_db()
    # Schedule hourly scraping
    scheduler.add_job(fetch_intel_cycle, 'interval', hours=1)
    # Schedule periodic summarization
    scheduler.add_job(summarization_cycle, 'interval', minutes=30)
    scheduler.start()
    logger.info("Internal scheduler started: Scraper (1h), Summarizer (30m)")

# API Endpoints
@app.get("/api/health")
def health_check():
    gemini_key = os.getenv("GEMINI_API_KEY")
    return {
        "status": "ok",
        "gemini_active": gemini_key is not None and len(gemini_key) > 5,
        "local_db": os.path.exists("cyber_news.db")
    }

@app.get("/api/news")
def get_news(db: Session = Depends(get_db)):
    """Returns today's news, interleaved by source for variety."""
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    articles = db.query(Article).filter(Article.created_at >= today).order_by(Article.created_at.desc()).all()

    if not articles: return []

    # Round-Robin Interleaving
    by_source = {}
    for art in articles:
        if art.source not in by_source: by_source[art.source] = []
        by_source[art.source].append(art)

    source_names = sorted(by_source.keys())
    interleaved = []
    max_count = max(len(v) for v in by_source.values())

    for i in range(max_count):
        for s in source_names:
            if i < len(by_source[s]):
                interleaved.append(by_source[s][i])

    return interleaved

@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(Article).order_by(Article.created_at.desc()).limit(100).all()

@app.post("/api/refresh")
async def trigger_refresh(background_tasks: BackgroundTasks):
    background_tasks.add_task(fetch_intel_cycle)
    return {"status": "refresh started"}

@app.post("/api/summarize-batch")
async def trigger_summarize(background_tasks: BackgroundTasks):
    background_tasks.add_task(summarization_cycle)
    return {"status": "summarization started"}

@app.get("/api/stream")
async def message_stream(request: Request):
    async def event_generator():
        queue = await publisher.subscribe()
        try:
            while True:
                if await request.is_disconnected(): break
                data = await queue.get()
                yield {"data": data}
        finally:
            publisher.unsubscribe(queue)
    return EventSourceResponse(event_generator())

# Static Frontend Serving (MUST BE LAST)
dist_path = os.path.join(os.getcwd(), "dist")
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")
else:
    logger.warning("Dist folder not found. Frontend will not be served.")
