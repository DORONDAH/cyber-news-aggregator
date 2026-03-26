# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
This directory contains multiple projects, primarily:
- `cyber-news-aggregator`: A React + FastAPI dashboard for cybersecurity news summarized by AI.
- `gemini-cli`: A TypeScript monorepo for a Google Gemini CLI tool.

---

## Cyber News Aggregator (`/cyber-news-aggregator`)

### Development Commands
- **Install Dependencies**: `npm install` (Frontend), `pip install -r requirements.txt` (Backend)
- **Run Frontend Dev Server**: `npm run dev` (Vite)
- **Build Frontend**: `npm run build`
- **Lint Code**: `npm run lint`
- **Preview Build**: `npm run preview`

### Architecture & Structure
- **Frontend**: React (Vite) with Tailwind CSS v4 and Lucide Icons. Source code in `/src`.
- **Backend**: Python (FastAPI) deployed as Vercel Serverless Functions. Source in `/api`.
  - `api/index.py`: Main API entry point.
  - `api/scraper.py`: News aggregation logic (triggered by Vercel Cron). Uses `feedparser` for RSS and `BeautifulSoup` for cleaning content.
  - `api/summarizer.py`: AI summarization using Gemini 2.5 Flash. Categorizes articles into (Ransomware, Vulnerability, Data Breach, Malware, Policy/Legal, General).
  - `api/models.py`: SQLAlchemy models for SQLite. Articles are automatically deleted after 7 days.
- **Real-time Updates**: Uses Server-Sent Events (SSE) to push summaries to the UI.
- **Database**: SQLite database stored in `/tmp/cyber_news.db` on Vercel and locally as `cyber_news.db`.

---

## Gemini CLI (`/gemini-cli`)

### Development Commands
- **Full Validation**: `npm run preflight` (Builds, tests, typechecks, and lints).
- **Build**: `npm run build`
- **Test**: `npm run test` (Vitest)
- **Lint**: `npm run lint`
- **Typecheck**: `npm run typecheck`
- **Format**: `npm run format` (Prettier)

### Architecture & Structure
- **Monorepo**: Multi-package structure under `/packages`.
- **Core Logic**: TypeScript-based CLI interacting with Google Gemini API.
- **CLI UI**: Built with React using the Ink library for terminal rendering.
- **Testing**: Vitest is used for unit and integration testing. Tests are co-located with source files (`*.test.ts`, `*.test.tsx`).

### Coding Standards
- **Prefer Plain Objects**: Use TypeScript interfaces/types with plain objects over classes for better React/Ink integration.
- **Encapsulation**: Use ES module (`import`/`export`) for API boundaries rather than private class members.
- **Type Safety**: Avoid `any` and type assertions; prefer `unknown` with type narrowing.
- **Functional Style**: Leverage JavaScript array operators (`.map`, `.filter`, `.reduce`) for immutable data transformations.
- **React Patterns**: Use functional components and Hooks. Avoid side effects in render logic; use `useEffect` only for synchronization.
