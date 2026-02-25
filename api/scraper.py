import httpx
from bs4 import BeautifulSoup
from datetime import datetime, timezone
import logging
import feedparser
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_rss_date(struct_time):
    if not struct_time:
        return datetime.now(timezone.utc)
    return datetime.fromtimestamp(time.mktime(struct_time), tz=timezone.utc)

async def scrape_rss(url, source_name, limit=10):
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.error(f"Failed to fetch RSS for {source_name}: {response.status_code}")
                return []

            feed = feedparser.parse(response.text)
            articles = []

            for entry in feed.entries[:limit]:
                # Extract summary from summary or content
                content = entry.get('summary', '')
                if not content and 'content' in entry:
                    content = entry.content[0].value

                # Clean HTML if present in content
                soup = BeautifulSoup(content, 'html.parser')
                clean_content = soup.get_text(separator=' ').strip()

                articles.append({
                    'title': entry.get('title', 'No Title'),
                    'url': entry.get('link', ''),
                    'content': clean_content[:2000], # Cap for AI processing
                    'source': source_name,
                    'published_at': parse_rss_date(entry.get('published_parsed'))
                })
            return articles
    except Exception as e:
        logger.error(f"Error scraping RSS {source_name}: {str(e)}")
        return []

async def scrape_bleepingcomputer():
    return await scrape_rss("https://www.bleepingcomputer.com/feed/", "BleepingComputer")

async def scrape_thehackernews():
    return await scrape_rss("https://thehackernews.com/feeds/posts/default", "TheHackerNews")

async def scrape_securityweek():
    return await scrape_rss("https://feeds.feedburner.com/securityweek", "SecurityWeek")

async def scrape_darkreading():
    return await scrape_rss("https://www.darkreading.com/rss.xml", "Dark Reading")

async def scrape_unit42():
    return await scrape_rss("https://unit42.paloaltonetworks.com/feed/", "Unit 42")

async def scrape_mandiant():
    # Mandiant uses a slightly different structure often, but RSS is standard
    return await scrape_rss("https://www.mandiant.com/resources/blog/rss.xml", "Mandiant")

async def scrape_zerofox():
    return await scrape_rss("https://www.zerofox.com/feed/", "ZeroFox")

async def scrape_infosecurity():
    return await scrape_rss("https://www.infosecurity-magazine.com/rss/news/", "Infosecurity Mag")

async def scrape_cisa():
    # CISA RSS for cybersecurity advisories
    return await scrape_rss("https://www.cisa.gov/cybersecurity-advisories.xml", "CISA")

async def scrape_cybernews():
    return await scrape_rss("https://cybernews.com/news/feed/", "Cybernews")

async def scrape_therecord():
    return await scrape_rss("https://therecord.media/feed/", "The Record")
