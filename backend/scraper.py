import httpx
from bs4 import BeautifulSoup
from datetime import datetime, timezone
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def scrape_bleepingcomputer():
    url = "https://www.bleepingcomputer.com/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        response = await client.get(url)
        if response.status_code != 200:
            logger.error(f"Failed to fetch BleepingComputer: {response.status_code}")
            # Try to log a bit of the response to see if it's Cloudflare
            logger.error(f"Response headers: {response.headers}")
            return []

        soup = BeautifulSoup(response.text, 'html.parser')
        articles = []
        # BleepingComputer uses div.bc_latest_news_text
        for item in soup.find_all('div', class_='bc_latest_news_text'):
            title_tag = item.find('h4')
            if not title_tag: continue
            link_tag = title_tag.find('a')
            if not link_tag: continue

            title = link_tag.text.strip()
            link = link_tag['href']
            summary_tag = item.find('p')
            summary = summary_tag.text.strip() if summary_tag else ""

            articles.append({
                'title': title,
                'url': link,
                'content': summary,
                'source': 'BleepingComputer',
                'published_at': datetime.now(timezone.utc)
            })
        return articles

async def scrape_thehackernews():
    url = "https://thehackernews.com/"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code != 200:
            logger.error(f"Failed to fetch TheHackerNews: {response.status_code}")
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        articles = []
        for item in soup.find_all('div', class_='body-post'):
            title_tag = item.find('h2', class_='home-title')
            title = title_tag.text.strip()
            link = item.find('a', class_='story-link')['href']
            summary_tag = item.find('div', class_='home-desc')
            summary = summary_tag.text.strip() if summary_tag else ""
            
            articles.append({
                'title': title,
                'url': link,
                'content': summary,
                'source': 'TheHackerNews',
                'published_at': datetime.now(timezone.utc)
            })
        return articles
