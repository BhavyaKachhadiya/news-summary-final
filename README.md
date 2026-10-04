# The Hindu AI News Aggregator & Intelligence Engine

A production-ready AI News Aggregator and Summarization platform built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **MongoDB**, **Mongoose**, **Zod**, and the official **Google Gemini API** (`@google/genai`).

The platform ingests real-time RSS feeds from **The Hindu** (Technology & Business), extracts full article reporting with SSRF protection, synthesizes in-depth (800–1,500 word) structured summaries with Google Gemini, stores results in MongoDB with status tracking, and presents them in an executive-grade responsive reader.

---

## Architecture Pipeline

```
The Hindu RSS Feeds (Technology & Business)
               │
               ▼
           RSS Parser (Deduplication & URL Normalization)
               │
               ▼
       Article Extractor (Cheerio + SSRF Domain Guard)
               │
               ▼
     Category Detection (Technology vs. Business)
               │
               ▼
    Gemini Intelligence Engine (Queue Limiter + Exponential Backoff)
               │
               ▼
   Strict Zod Schema Validation (Technology & Business Schemas)
               │
               ▼
      MongoDB / Mongoose Document Store (Indexed & Cached)
               │
               ▼
        Next.js App Router (Dynamic SSR + Live Search)
               │
               ▼
   AI News Reader & Admin Pipeline Control Dashboard
```

---

## Features

- **Live RSS Ingestion**: Ingests real-time feeds from *The Hindu* (`sci-tech/technology` & `business`).
- **Article Scraping & SSRF Protection**: Cleans away ads, paywalls, and cookie banners using `cheerio`. Enforces an allowed domain whitelist (`thehindu.com`, `www.thehindu.com`).
- **Deep AI Summaries**: Uses prompt engineering tailored specifically for technology and business journalism (preserving financial metrics, RBI/SEBI regulations, technical concepts, quotes, and dates).
- **Strict Validation with Zod**: Validates structured Gemini JSON output before persisting to the database.
- **Controlled Concurrency & Rate Limiting**: Built-in queue (`p-limit`) and exponential backoff retry mechanism.
- **Dynamic Search & Filtering**: Multi-field search across titles, descriptions, overviews, and key takeaways.
- **Admin & Sync Control Dashboard**: Interactive web UI (`/admin`) for manual RSS sync, status monitoring, and failed summary retries.
- **Scheduled Synchronization**: Secure webhook endpoint (`POST /api/news/sync`) protected with `CRON_SECRET`.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, Server Components)
- **Language**: TypeScript (Strict, no `any`)
- **Styling**: Tailwind CSS v4, Glassmorphism design system
- **Database**: MongoDB with Mongoose (Cached connection pool for Next.js hot-reloads)
- **AI SDK**: Google GenAI TypeScript SDK (`@google/genai`)
- **Validation**: Zod
- **Testing**: Vitest

---

## Getting Started

### 1. Prerequisites

- **Node.js**: v18.17+ (Tested on Node.js v20+)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/)

### 2. Installation

```bash
git clone <repo-url>
cd news-sum
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Configure the environment variables in `.env.local`:

```env
# MongoDB Connection URI
MONGODB_URI=mongodb://localhost:27017/ai-news

# Google Gemini API Key (Server-side only; never expose NEXT_PUBLIC_)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Optional: Gemini model override (defaults to gemini-2.5-flash)
GEMINI_MODEL=gemini-2.5-flash

# Optional: Bearer token secret to secure /api/news/sync
CRON_SECRET=your_cron_secret_token
```

### 4. Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Automated News Synchronization

### Option A: Via Admin Dashboard

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) and click **"Sync Feeds Now"**.

### Option B: Via API Endpoint

```bash
# Unprotected (if CRON_SECRET is empty)
curl -X POST http://localhost:3000/api/news/sync

# Protected with CRON_SECRET
curl -X POST http://localhost:3000/api/news/sync \
  -H "Authorization: Bearer your_cron_secret_token"
```

To retry all failed summaries:

```bash
curl -X POST "http://localhost:3000/api/news/sync?retryFailed=true"
```

### Option C: Cron Service (e.g. Vercel Cron, GitHub Actions, crontab)

Set up a periodic POST request every 30 minutes to `/api/news/sync` with the `Authorization` header.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                     # Home page (All News, Search, Hero)
│   ├── technology/page.tsx          # Technology Category feed
│   ├── business/page.tsx            # Business Category feed
│   ├── article/[id]/page.tsx        # Dynamic Article view with deep summary
│   ├── admin/page.tsx               # Admin Sync & Pipeline Control Center
│   ├── api/
│   │   ├── news/
│   │   │   ├── route.ts             # GET /api/news (pagination, filters, search)
│   │   │   ├── sync/route.ts        # POST /api/news/sync (RSS ingestion pipeline)
│   │   │   └── [id]/
│   │   │       ├── route.ts         # GET /api/news/[id]
│   │   │       └── summarize/
│   │   │           └── route.ts     # POST /api/news/[id]/summarize (retry/on-demand)
│   │   └── stats/route.ts           # GET /api/stats (pipeline statistics)
│   ├── globals.css                  # Theme tokens and glassmorphism styling
│   └── layout.tsx                   # App layout with Header, Footer, SEO metadata
│
├── components/
│   ├── Header.tsx                   # Navigation with Live Sync button
│   ├── Footer.tsx                   # Attribution to The Hindu & AI disclosures
│   ├── CategoryNav.tsx              # Category tabs with article counts
│   ├── SearchBar.tsx                # Multi-field search with debouncing
│   ├── NewsCard.tsx                 # News card with category badges & takeaways
│   ├── NewsList.tsx                 # Grid layout with pagination
│   ├── SummaryView.tsx              # Full executive summary presentation
│   ├── StatusBadge.tsx              # Visual status indicators
│   ├── LoadingSkeleton.tsx          # Loading states
│   └── ErrorState.tsx               # Graceful error screens
│
├── config/
│   └── feeds.ts                     # RSS feed URLs & category definitions
├── lib/
│   ├── mongodb.ts                   # Cached Mongoose connection
│   └── env.ts                       # Environment variable helpers
├── models/
│   └── Article.ts                   # Mongoose Article Schema & compound indexes
├── prompts/
│   ├── technology.prompt.ts         # Technology prompt from tech-prompt.md
│   ├── business.prompt.ts           # Business prompt from business-prompt.md
│   └── index.ts                     # Category prompt resolver & interpolator
├── schemas/
│   ├── technology-summary.schema.ts # Zod schema for technology summaries
│   ├── business-summary.schema.ts   # Zod schema for business summaries
│   └── index.ts                     # Schema validator
├── services/
│   ├── rss.service.ts               # XML parsing, deduplication, URL normalization
│   ├── article-extractor.service.ts # Cheerio scraping & SSRF domain validation
│   ├── gemini.service.ts            # Google GenAI API with retry and queue
│   └── news.service.ts              # Business logic & database operations
└── types/
    └── news.ts                      # Strict TypeScript types
```

---

## Running Tests

Run the test suite with Vitest:

```bash
npm test
```

Tests cover:
- URL normalization & UTM tracking removal
- Technology and Business Zod summary schemas
- Gemini markdown code fence cleaning
- SSRF protection & domain validation

---

## Production Build

```bash
npm run build
npm start
```

---

## License & Attribution

- News content is sourced from RSS feeds provided by **The Hindu** ([thehindu.com](https://www.thehindu.com)).
- Summaries are generated using Google Gemini for educational and informational purposes.
