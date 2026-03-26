import httpx
from bs4 import BeautifulSoup
from datetime import datetime, timezone
import logging
import feedparser
import time
from typing import List, Dict, Any

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Default timeout and headers for all scraping requests
TIMEOUT = 15.0
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def parse_rss_date(struct_time: Any) -> datetime:
    """Helper to parse RSS published_parsed into a timezone-aware datetime."""
    if not struct_time:
        return datetime.now(timezone.utc)
    return datetime.fromtimestamp(time.mktime(struct_time), tz=timezone.utc)

async def scrape_rss_feed(url: str, source_name: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Generic RSS feed scraper."""
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, headers=HEADERS, follow_redirects=True) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.error(f"Failed to fetch RSS for {source_name}: {response.status_code}")
                return []

            feed = feedparser.parse(response.text)
            articles = []

            for entry in feed.entries[:limit]:
                # Extract and clean content
                content = entry.get('summary', '')
                if not content and 'content' in entry:
                    content = entry.content[0].value

                soup = BeautifulSoup(content, 'html.parser')
                clean_content = soup.get_text(separator=' ').strip()

                articles.append({
                    'title': entry.get('title', 'No Title'),
                    'url': entry.get('link', ''),
                    'content': clean_content[:2000],  # Capped for AI context window
                    'source': source_name,
                    'published_at': parse_rss_date(entry.get('published_parsed'))
                })
            return articles
    except Exception as e:
        logger.error(f"Error scraping RSS {source_name}: {str(e)}")
        return []

# Source-specific scraping functions
async def scrape_bleepingcomputer(): return await scrape_rss_feed("https://www.bleepingcomputer.com/feed/", "BleepingComputer")
async def scrape_thehackernews(): return await scrape_rss_feed("https://thehackernews.com/feeds/posts/default", "TheHackerNews")
async def scrape_securityweek(): return await scrape_rss_feed("https://feeds.feedburner.com/securityweek", "SecurityWeek")
async def scrape_darkreading(): return await scrape_rss_feed("https://www.darkreading.com/rss.xml", "Dark Reading")
async def scrape_unit42(): return await scrape_rss_feed("https://unit42.paloaltonetworks.com/feed/", "Unit 42")
async def scrape_mandiant(): return await scrape_rss_feed("https://www.mandiant.com/resources/blog/rss.xml", "Mandiant")
async def scrape_zerofox(): return await scrape_rss_feed("https://www.zerofox.com/feed/", "ZeroFox")
async def scrape_infosecurity(): return await scrape_rss_feed("https://www.infosecurity-magazine.com/rss/news/", "Infosecurity Mag")
async def scrape_cybersecuritynews(): return await scrape_rss_feed("https://cybersecuritynews.com/feed/", "Cyber Security News")
async def scrape_infosecnews(): return await scrape_rss_feed("https://infosecnews.org/feed/", "InfoSec News")
async def scrape_cisa(): return await scrape_rss_feed("https://www.cisa.gov/cybersecurity-advisories.xml", "CISA")
async def scrape_cybernews(): return await scrape_rss_feed("https://cybernews.com/news/feed/", "Cybernews")
async def scrape_therecord(): return await scrape_rss_feed("https://therecord.media/feed/", "The Record")
async def scrape_sans_isc(): return await scrape_rss_feed("https://isc.sans.edu/rssfeed.xml", "SANS ISC")
async def scrape_krebs(): return await scrape_rss_feed("https://krebsonsecurity.com/feed/", "KrebsOnSecurity")
async def scrape_talos(): return await scrape_rss_feed("https://blog.talosintelligence.com/feeds/posts/default", "Cisco Talos")
async def scrape_crowdstrike(): return await scrape_rss_feed("https://www.crowdstrike.com/blog/feed/", "CrowdStrike")

async def scrape_all_sources() -> List[Dict[str, Any]]:
    """Collects news from all configured sources."""
    scrapers = [
        scrape_bleepingcomputer(), scrape_thehackernews(), scrape_securityweek(),
        scrape_darkreading(), scrape_unit42(), scrape_mandiant(),
        scrape_zerofox(), scrape_infosecurity(), scrape_cybersecuritynews(),
        scrape_infosecnews(), scrape_cisa(), scrape_cybernews(),
        scrape_therecord(), scrape_sans_isc(), scrape_krebs(),
        scrape_talos(), scrape_crowdstrike()
    ]

    all_articles = []
    for scraper_task in scrapers:
        try:
            articles = await scraper_task
            all_articles.extend(articles)
        except Exception as e:
            logger.error(f"Scraper error: {e}")

    return all_articles
