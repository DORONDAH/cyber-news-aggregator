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
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=15.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.error(f"Failed to fetch BleepingComputer: {response.status_code}")
                return []

            soup = BeautifulSoup(response.text, 'html.parser')
            articles = []
            for item in soup.find_all('div', class_='bc_latest_news_text'):
                title_tag = item.find('h4')
                if not title_tag: continue
                link_tag = title_tag.find('a')
                if not link_tag: continue

                title = link_tag.text.strip()
                link = link_tag['href']
                if link.startswith('/'):
                    link = f"https://www.bleepingcomputer.com{link}"
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
    except Exception as e:
        logger.error(f"Error scraping BleepingComputer: {str(e)}")
        return []

async def scrape_thehackernews():
    url = "https://thehackernews.com/"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
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
    except Exception as e:
        logger.error(f"Error scraping TheHackerNews: {str(e)}")
        return []

async def scrape_securityweek():
    url = "https://www.securityweek.com/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=15.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.error(f"Failed to fetch SecurityWeek: {response.status_code}")
                return []

            soup = BeautifulSoup(response.text, 'html.parser')
            articles = []
            # Look for article items on the homepage
            for item in soup.find_all('div', class_='article-content'):
                title_tag = item.find('h2') or item.find('h3')
                if not title_tag: continue
                link_tag = title_tag.find('a')
                if not link_tag: continue

                title = link_tag.text.strip()
                link = link_tag['href']
                if link.startswith('/'):
                    link = f"https://www.securityweek.com{link}"
                summary_tag = item.find('div', class_='entry-content') or item.find('p')
                summary = summary_tag.text.strip() if summary_tag else ""

                articles.append({
                    'title': title,
                    'url': link,
                    'content': summary,
                    'source': 'SecurityWeek',
                    'published_at': datetime.now(timezone.utc)
                })
            return articles
    except Exception as e:
        logger.error(f"Error scraping SecurityWeek: {str(e)}")
        return []

async def scrape_darkreading():
    url = "https://www.darkreading.com/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=15.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.error(f"Failed to fetch Dark Reading: {response.status_code}")
                return []

            soup = BeautifulSoup(response.text, 'html.parser')
            articles = []
            # Dark Reading uses 'article' tags or specific classes for news items
            for item in soup.find_all('div', class_='featured-item')[:10]:
                title_tag = item.find('a', class_='featured-item-title')
                if not title_tag: continue

                title = title_tag.text.strip()
                link = title_tag['href']
                if link.startswith('/'):
                    link = f"https://www.darkreading.com{link}"

                summary_tag = item.find('div', class_='featured-item-description')
                summary = summary_tag.text.strip() if summary_tag else ""

                articles.append({
                    'title': title,
                    'url': link,
                    'content': summary,
                    'source': 'Dark Reading',
                    'published_at': datetime.now(timezone.utc)
                })
            return articles
    except Exception as e:
        logger.error(f"Error scraping Dark Reading: {str(e)}")
        return []

async def scrape_zerofox():
    url = "https://www.zerofox.com/blog/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=15.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.error(f"Failed to fetch ZeroFox: {response.status_code}")
                return []

            soup = BeautifulSoup(response.text, 'html.parser')
            articles = []
            # ZeroFox blog layout
            for item in soup.find_all('div', class_='post-item')[:10]:
                title_tag = item.find('h3')
                if not title_tag: continue
                link_tag = title_tag.find('a')
                if not link_tag: continue

                title = link_tag.text.strip()
                link = link_tag['href']

                summary_tag = item.find('div', class_='post-content') or item.find('p')
                summary = summary_tag.text.strip() if summary_tag else ""

                articles.append({
                    'title': title,
                    'url': link,
                    'content': summary,
                    'source': 'ZeroFox',
                    'published_at': datetime.now(timezone.utc)
                })
            return articles
    except Exception as e:
        logger.error(f"Error scraping ZeroFox: {str(e)}")
        return []

async def scrape_infosecurity():
    url = "https://www.infosecurity-magazine.com/news/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=15.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.error(f"Failed to fetch Infosecurity: {response.status_code}")
                return []

            soup = BeautifulSoup(response.text, 'html.parser')
            articles = []
            # Updated selector: webpage-item
            for item in soup.find_all(['li', 'div'], class_='webpage-item')[:10]:
                title_tag = item.find(['h2', 'h3'], class_='webpage-title')
                if not title_tag: continue
                link_tag = title_tag.find('a')
                if not link_tag: continue

                title = link_tag.text.strip()
                link = link_tag['href']
                if link.startswith('/'):
                    link = f"https://www.infosecurity-magazine.com{link}"

                summary_tag = item.find(['p', 'div'], class_='webpage-summary')
                summary = summary_tag.text.strip() if summary_tag else ""

                articles.append({
                    'title': title,
                    'url': link,
                    'content': summary,
                    'source': 'Infosecurity Mag',
                    'published_at': datetime.now(timezone.utc)
                })
            return articles
    except Exception as e:
        logger.error(f"Error scraping Infosecurity: {str(e)}")
        return []

async def scrape_cyberscoop():
    url = "https://cyberscoop.com/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=15.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.error(f"Failed to fetch CyberScoop: {response.status_code}")
                return []

            soup = BeautifulSoup(response.text, 'html.parser')
            articles = []
            # Updated selector: post-item
            for item in soup.find_all('article', class_='post-item')[:10]:
                title_tag = item.find(['h2', 'h3'], class_='post-item__title')
                if not title_tag: continue
                link_tag = title_tag.find('a')
                if not link_tag: continue

                title = link_tag.text.strip()
                link = link_tag['href']

                summary_tag = item.find('div', class_='post-item__excerpt') or item.find('p')
                summary = summary_tag.text.strip() if summary_tag else ""

                articles.append({
                    'title': title,
                    'url': link,
                    'content': summary,
                    'source': 'CyberScoop',
                    'published_at': datetime.now(timezone.utc)
                })
            return articles
    except Exception as e:
        logger.error(f"Error scraping CyberScoop: {str(e)}")
        return []

async def scrape_cisa():
    url = "https://www.cisa.gov/news-events/cybersecurity-advisories"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=15.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.error(f"Failed to fetch CISA: {response.status_code}")
                return []

            soup = BeautifulSoup(response.text, 'html.parser')
            articles = []
            # Updated selector: article.c-teaser
            for item in soup.find_all('article', class_='c-teaser')[:10]:
                title_tag = item.find('h3', class_='c-teaser__title')
                if not title_tag: continue
                link_tag = title_tag.find('a')
                if not link_tag: continue

                title = link_tag.text.strip()
                link = link_tag['href']
                if link.startswith('/'):
                    link = f"https://www.cisa.gov{link}"

                summary_tag = item.find('div', class_='c-teaser__summary') or item.find('p')
                summary = summary_tag.text.strip() if summary_tag else ""

                articles.append({
                    'title': title,
                    'url': link,
                    'content': summary,
                    'source': 'CISA',
                    'published_at': datetime.now(timezone.utc)
                })
            return articles
    except Exception as e:
        logger.error(f"Error scraping CISA: {str(e)}")
        return []
