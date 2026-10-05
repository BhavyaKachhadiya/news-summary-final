# SIGNAL — AI News Intelligence Engine (The Hindu & Bhaskar English)

A production-ready AI News Aggregator and Summarization platform built with **Next.js 16 (App Router)**, **TypeScript** (Strict, zero `any`), **Tailwind CSS**, **MongoDB**, **Mongoose**, **Zod**, and the official **Google Gemini API** (`@google/genai`).

The platform ingests real-time RSS feeds from **The Hindu** & **Bhaskar English** (Technology & Business), extracts full reporting with rigorous SSRF protection (private IP blocking, manual redirect enforcement, payload size limits), synthesizes in-depth structured summaries with Google Gemini, stores results in MongoDB with atomic status locking and stale worker recovery, and presents them in an executive-grade responsive reader with a full Operations Admin Panel (`/admin`).

---

## Architecture Pipeline

```
The Hindu & Bhaskar English RSS Feeds (Tech & Business)
               │
               ▼
   RSS Parser (Deduplication, Normalization, Resilient Error Handling)
               │
               ▼
   Article Extractor (Concurrent p-limit, SSRF DNS/IP Guard, Size Caps)
               │
               ▼
   MongoDB Document Store (Pending State, Upsert Deduplication)
               │
               ▼
   Atomic Lock & Stale Job Recovery (Pending/Failed -> Processing)
               │
               ▼
   Gemini Intelligence Engine (Queue Limiter, Jittered Backoff, Prompt Sanitizer)
               │
               ▼
   Strict Zod Schema Validation (Technology & Business Schemas)
               │
               ▼
   MongoDB Final State (Completed with Structured Summary)
               │
               ▼
   Next.js App Router & Executive Admin Dashboard (/admin)
```

---

## Production Security & Resilience Features

- **SSRF Protection (`src/lib/security/ssrf.ts`)**:
  - DNS resolution validation (`assertSafeDns`)
  - Loopback, private, carrier-grade NAT, and link-local IP blocking (`isPrivateIp` via `ipaddr.js`)
  - Disallows automatic redirects (`redirect: "manual"`), enforces maximum 3 hops, re-validates every redirect destination
  - Blocks unsafe protocols (`file:`, `ftp:`, `data:`, `gopher:`, `javascript:`)
  - Response size limit (2MB) and extracted text limit (20,000 characters)

- **Atomic Gemini Processing Locks & Stale Worker Recovery**:
  - MongoDB atomic `findOneAndUpdate` ensures two simultaneous requests never trigger duplicate Gemini calls
  - `summaryStartedAt` timestamp tracks in-flight generation
  - Automatic stale job recovery resets crashed/timed-out jobs (>5 min) back to `pending`
  - Max retry cap per article (5 retries) prevents infinite retry loops

- **API Security & Rate Limiting**:
  - `POST /api/news/sync`: Protected by `CRON_SECRET` header or Bearer token (strictly required in production)
  - `POST /api/news/[id]/summarize`: IP-based sliding window rate limiter (10 requests/min), MongoDB ObjectId validation, restricted `forceRetry`
  - `GET /api/news`: Zod query validation (`PaginationQuerySchema`), bounded limits (1–100), regex escaping (`escapeRegex`) preventing ReDoS

- **Gemini Resilience & Prompt Injection Defense**:
  - Untrusted scraped content is sanitized and demarcated with explicit isolation boundary tags
  - Concurrency queue (`p-limit`, default 3) prevents flooding Gemini quota
  - Exponential backoff with random jitter (±20%) gracefully recovers from HTTP 429, 500, 503, and quota errors
  - Malformed JSON recovery parser repairs trailing commas and extracts root JSON objects
  - Strict Zod validation guarantees schema conformity before database persistence

- **Operations Admin Dashboard (`/admin`)**:
  - Overview metrics: Total articles, completed, pending/processing, and failed summaries
  - Feed sync controls: "Sync Feeds Now" and "Retry Failed"
  - Article registry with status filter, retry trigger, and deletion
  - System health display verifying all active protections

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, Server Components)
- **Language**: TypeScript (Strict, 0 `any` types)
- **Styling**: Tailwind CSS v4, Glassmorphism design system
- **Database**: MongoDB with Mongoose (Connection pooling, compound indexes)
- **AI SDK**: Google GenAI TypeScript SDK (`@google/genai`)
- **Validation**: Zod
- **Testing**: Vitest (Unit, SSRF, schema, and API security test suites)

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

# Bearer token secret to secure /api/news/sync (Required in production)
CRON_SECRET=your_secure_cron_secret_token
```

### 4. Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running News Synchronization

### Option A: Via Admin Dashboard

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) and click **"Sync Feeds Now"**.

### Option B: Via API Endpoint

```bash
curl -X POST http://localhost:3000/api/news/sync \
  -H "Authorization: Bearer your_secure_cron_secret_token"
```

To retry all failed summaries:

```bash
curl -X POST "http://localhost:3000/api/news/sync?retryFailed=true" \
  -H "Authorization: Bearer your_secure_cron_secret_token"
```

### Option C: GitHub Actions Workflow

An automated workflow (`.github/workflows/sync-news.yml`) runs hourly with:
- Concurrency locking to prevent overlapping sync executions
- Mandatory `CRON_SECRET` and `APP_URL` repository secret verification

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                     # Home page (All News, Search, Hero)
│   ├── technology/page.tsx          # Technology category feed
│   ├── business/page.tsx            # Business category feed
│   ├── article/[id]/page.tsx        # Dynamic article view with deep summary
│   ├── admin/page.tsx               # Admin Sync & Pipeline Control Center
│   ├── api/
│   │   ├── news/
│   │   │   ├── route.ts             # GET /api/news (Zod pagination, regex escaping)
│   │   │   ├── sync/route.ts        # POST /api/news/sync (CRON_SECRET protected)
│   │   │   └── [id]/
│   │   │       ├── route.ts         # GET & DELETE /api/news/[id]
│   │   │       └── summarize/
│   │   │           └── route.ts     # POST /api/news/[id]/summarize (rate limited)
│   │   └── stats/route.ts           # GET /api/stats (pipeline statistics & auto-recovery)
│   ├── globals.css                  # Theme tokens and glassmorphism styling
│   └── layout.tsx                   # App layout with Header, Footer, Open Graph/Twitter metadata
│
├── components/
│   ├── Header.tsx                   # Navigation with Admin link & Live Sync
│   ├── Footer.tsx                   # Attribution & AI disclosures
│   ├── CategoryTabs.tsx             # Category tabs with live counts
│   ├── SearchDialog.tsx             # Modal search with keyboard shortcuts
│   ├── NewsCard.tsx                 # News card with category badges & takeaways
│   ├── NewsGrid.tsx                 # Grid layout with pagination
│   └── SummaryView.tsx              # Executive AI summary presentation
│
├── config/
│   └── feeds.ts                     # RSS feed URLs, whitelists & APP_CONFIG limits
├── lib/
│   ├── mongodb.ts                   # Cached Mongoose connection pool
│   ├── env.ts                       # Zod-validated environment config
│   ├── security/
│   │   ├── ssrf.ts                  # SSRF protection, DNS check & safeFetch
│   │   └── rate-limit.ts            # Sliding window in-memory rate limiter
│   ├── logging/
│   │   └── logger.ts                # Structured JSON logging (redacts secrets)
│   └── validation/
│       └── api.schema.ts            # Zod schemas for pagination, IDs, bodies
├── models/
│   └── Article.ts                   # Mongoose Article Schema & compound indexes
├── prompts/
│   ├── technology.prompt.ts         # Technology prompt
│   ├── business.prompt.ts           # Business prompt
│   └── index.ts                     # Prompt interpolator
├── schemas/
│   ├── technology-summary.schema.ts # Zod schema for technology summaries
│   ├── business-summary.schema.ts   # Zod schema for business summaries
│   └── index.ts                     # Schema validator
├── services/
│   ├── rss.service.ts               # XML parsing, deduplication, URL normalization
│   ├── article-extractor.service.ts # Cheerio scraping & SSRF domain validation
│   ├── gemini.service.ts            # Google GenAI API with retry, jitter & queue
│   └── news.service.ts              # Atomic locking, stale recovery & database operations
└── types/
    └── news.ts                      # Strict TypeScript domain interfaces
```

---

## Running Tests

Run the test suite with Vitest:

```bash
npm test
```

Unit tests cover:
- URL normalization & tracking removal
- Technology and Business Zod summary schemas
- Gemini markdown code fence cleaning & malformed JSON repair
- SSRF URL validation, protocol blocking, and private IP rejection
- API pagination bounds & MongoDB ObjectId validation
- Regex special character escaping (ReDoS prevention)
- In-memory rate limiting per client IP
- Gemini prompt injection sanitization

---

## License & Attribution

- News content is sourced from RSS feeds provided by **The Hindu** ([thehindu.com](https://www.thehindu.com)) and **Bhaskar English** ([bhaskarenglish.in](https://www.bhaskarenglish.in)).
- Summaries are synthesized using Google Gemini for educational and informational purposes.
