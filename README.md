# Cyber News Aggregator

A lightweight, high-efficiency dashboard for cybersecurity news, summarized by AI.

## Features
- **Real-time Updates**: Uses Server-Sent Events (SSE) to push new summaries to the UI.
- **AI Summarization**: Automatically generates 3 key bullet points for each article using OpenAI GPT-4o-mini (with fallback mock mode).
- **Multi-source Scraper**: Aggregates news from BleepingComputer and TheHackerNews.
- **Privacy & History**: Stores articles for 7 days with a "Clear History" option.
- **Dark Mode Dashboard**: Modern, responsive UI built with React and Tailwind CSS.

## Tech Stack
- **Backend**: FastAPI, SQLAlchemy (SQLite), BeautifulSoup4, APScheduler, httpx.
- **Frontend**: React (Vite), Tailwind CSS, Lucide React.
- **AI**: OpenAI API (optional, mocks available).

## Getting Started

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. (Optional) Set up your OpenAI API key in a `.env` file:
   ```bash
   echo "OPENAI_API_KEY=your_key_here" > .env
   ```
4. Run the server:
   ```bash
   python main.py
   ```
   The backend will be available at `http://localhost:8000`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The dashboard will be available at `http://localhost:5173`.

## Project Structure
- `backend/main.py`: API routes, SSE, and background scheduler.
- `backend/scraper.py`: Web scraping logic for news sources.
- `backend/summarizer.py`: AI integration for generating article summaries.
- `frontend/src/App.jsx`: Main dashboard logic and real-time connection.
- `frontend/src/components/NewsCard.jsx`: UI component for displaying news items.
