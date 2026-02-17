# Cyber News Aggregator 🛡️

A lightweight, high-efficiency dashboard for cybersecurity news, summarized by AI.

## Features
- **Unified Deployment**: Frontend (React) and Backend (FastAPI) deployed as a single unit on Vercel.
- **AI Summarization**: Automatically generates 3 key bullet points for each article using OpenAI GPT-4o-mini.
- **Real-time Updates**: Uses Server-Sent Events (SSE) to push new summaries to the UI.
- **Automated Scraper**: Vercel Cron Job triggers news aggregation every 30 minutes.
- **Privacy & History**: Stores articles for 7 days with local history management.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS v4, Lucide Icons.
- **Backend**: Python (FastAPI), SQLAlchemy (SQLite), BeautifulSoup4.
- **Hosting**: Vercel (Serverless Functions + Cron Jobs).

## Deployment Instructions

### 1. Vercel Setup
1. Import this repository into **Vercel**.
2. Add `OPENAI_API_KEY` to the **Environment Variables** in project settings.
3. Deploy!

### 2. Local Development
1. Install Python dependencies: `pip install -r requirements.txt`
2. Install Node dependencies: `npm install`
3. Run the dev server: `npm run dev`

## Project Structure
- `/api/index.py`: Unified API entry point for Vercel.
- `/src/`: React frontend source code.
- `vercel.json`: Deployment and Cron job configuration.
