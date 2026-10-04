Build a production-ready AI News Aggregator and Summarization Website using the following architecture:
RSS Feed → Fetch Articles → Extract Article Content → Detect Category → Gemini API → Detailed Summary → Store/Cache → Display on Website
The website should fetch news from The Hindu RSS feeds, extract the full article content where accessible, send the content to Gemini using a server-side API key, and display a detailed AI-generated summary.
1. RSS FEEDS
Initially support these feeds:
Technology
https://www.thehindu.com/sci-tech/technology/feeder/default.rss
Business
https://www.thehindu.com/business/feeder/default.rss
Design the code so additional RSS feeds can easily be added later.
For example:
const RSS_FEEDS = {
  technology: "https://www.thehindu.com/sci-tech/technology/feeder/default.rss",
  business: "https://www.thehindu.com/business/feeder/default.rss",
} as const;
Do not hard-code category logic throughout the application.

2. CORE WORKFLOW
Implement the following workflow:
User opens website
        ↓
Backend fetches RSS feeds
        ↓
Parse RSS XML
        ↓
Extract:
  - title
  - URL
  - description
  - publication date
  - author if available
  - category
        ↓
Check whether article already exists
        ↓
If not summarized:
        ↓
Fetch article page
        ↓
Extract readable article content
        ↓
Select category-specific Gemini prompt
        ↓
Send article to Gemini API
        ↓
Receive structured JSON
        ↓
Validate Gemini response
        ↓
Store/cache result
        ↓
Display article + AI summary
Do not call Gemini every time a user opens an article.
Use the article URL or GUID as the unique identifier.

3. TECHNOLOGY SUMMARY PROMPT
For articles in the Technology category, use this detailed summarization prompt:
[INSERT THE COMPLETE TECHNOLOGY GEMINI PROMPT PROVIDED ABOVE]
The Technology prompt must produce a detailed summary rather than a short 3–5 sentence summary.
Target approximately 800–1,500 words when the article contains enough information.

4. BUSINESS SUMMARY PROMPT
For articles in the Business category, use this detailed summarization prompt:
[INSERT THE COMPLETE BUSINESS GEMINI PROMPT PROVIDED ABOVE]
The Business prompt should focus particularly on:
* Companies
* Financial figures
* Revenue
* Profit/loss
* Investments
* Valuations
* Markets
* RBI
* SEBI
* Government policies
* Regulations
* Economic developments
* Interest rates
* Inflation
* GDP
* Banking
* Cryptocurrency
* Financial markets
* Statements from executives and officials
* Business impact
* Economic impact
* Risks and uncertainties

5. GEMINI API
Use the official Google Gemini/Google GenAI SDK for TypeScript.
The Gemini API key MUST NEVER be exposed to the browser.
Use:
GEMINI_API_KEY=your_api_key_here
The API key must only be accessed by server-side code.
Never do this:
NEXT_PUBLIC_GEMINI_API_KEY=...
Never send the Gemini API key to the frontend.
Create a dedicated Gemini service:
src/
├── services/
│   └── gemini.service.ts
Example interface:
interface GeminiSummaryRequest {
  title: string;
  content: string;
  url: string;
  category: NewsCategory;
}

interface GeminiSummaryResponse {
  headline: string;
  overview: string;
  background: string;
  what_happened: string;
  key_details: string[];
  technology_explained?: string;
  business_details?: string[];
  financial_details?: FinancialDetail[];
  regulatory_context?: string;
  market_economic_context?: string;
  companies_and_organizations: Organization[];
  people: Person[];
  statements_and_claims: string[];
  impact: string;
  risks_and_uncertainties: string[];
  future_developments: string[];
  key_takeaways: string[];
  category: NewsCategory;
}
Use strong TypeScript types.
Do NOT use any.

6. GEMINI RESPONSE VALIDATION
Never blindly trust the Gemini response.
Validate the returned JSON before storing it.
Use a schema validation library such as:
Zod
Create schemas for:
TechnologySummarySchema
BusinessSummarySchema
If Gemini returns malformed JSON:
1. Attempt safe extraction if appropriate.
2. Validate it.
3. If validation fails, return a useful server error.
4. Do not save invalid summaries.

7. RSS PARSER
Use a reliable RSS/XML parser.
Create:
src/
└── services/
    └── rss.service.ts
The service should expose something similar to:
interface RssArticle {
  id: string;
  title: string;
  url: string;
  description: string;
  publishedAt: string;
  category: NewsCategory;
}
Function:
async function fetchFeed(
  category: NewsCategory
): Promise<RssArticle[]>
Support RSS parsing safely.
Handle:
* Invalid XML
* Missing title
* Missing URL
* Missing publication date
* Duplicate articles
* Network errors
* RSS feed unavailable

8. ARTICLE CONTENT EXTRACTION
RSS usually does not contain the complete article.
After obtaining the RSS article URL, fetch the article page on the server.
Extract the readable article content.
Remove:
* Navigation
* Advertisements
* Related articles
* Social media widgets
* Footer
* Subscription prompts
* Cookie banners
* Unrelated page content
Prefer extracting the article's:
* Headline
* Article body
* Published date
* Author
* Relevant metadata
Create:
src/
└── services/
    └── article-extractor.service.ts
Use a reliable HTML parser/readability approach.
If full article extraction fails, gracefully fall back to the RSS description rather than crashing.
Clearly mark the source content as incomplete if necessary.

9. DATABASE / STORAGE
Use a database rather than generating summaries repeatedly.
Recommended:
Mongodb + Prisma
Create an Article model containing approximately:
Article
├── id
├── source
├── sourceUrl
├── title
├── description
├── content
├── category
├── publishedAt
├── fetchedAt
├── summarizedAt
├── summary
├── createdAt
└── updatedAt
The sourceUrl should have a unique constraint.
Store the Gemini-generated JSON in a structured JSON/JSONB column if appropriate.
Do not regenerate a summary if an article already has a valid summary.

10. CATEGORY SYSTEM
Use a type-safe category:
type NewsCategory =
  | "technology"
  | "business";
Create a centralized configuration:
interface CategoryConfig {
  name: string;
  rssUrl: string;
  prompt: string;
}
Example:
const categoryConfig: Record<NewsCategory, CategoryConfig> = {
  technology: {
    name: "Technology",
    rssUrl: "...",
    prompt: TECHNOLOGY_PROMPT,
  },

  business: {
    name: "Business",
    rssUrl: "...",
    prompt: BUSINESS_PROMPT,
  },
};
This architecture should make adding categories easy.
For example later:
Sports
Science
World
India
Entertainment
should only require adding a configuration and summarization prompt.

11. BACKEND API
Create APIs for:
Fetch latest articles
GET /api/news
Support:
/api/news?category=technology
/api/news?category=business
Support pagination:
/api/news?page=1&limit=20
Get article
GET /api/news/:id
Fetch latest RSS articles
POST /api/news/sync
This endpoint should:
1. Fetch RSS.
2. Detect new articles.
3. Store new articles.
4. Avoid duplicates.
Generate summary
POST /api/news/:id/summarize
This endpoint should:
1. Check whether summary already exists.
2. If it exists, return it.
3. Otherwise extract article content.
4. Select category prompt.
5. Call Gemini.
6. Validate response.
7. Store response.
8. Return summary.

12. IMPORTANT: DO NOT SUMMARIZE EVERYTHING ON EVERY REQUEST
Avoid this architecture:
User opens page
      ↓
Fetch RSS
      ↓
Call Gemini for every article
This will:
* Waste Gemini API quota
* Increase costs
* Increase response time
* Cause rate-limit problems
Instead:
RSS Sync
   ↓
New article?
   ↓
Yes
   ↓
Store article
   ↓
Generate summary
   ↓
Store summary
Then the website reads the stored result.

13. OPTIONAL BACKGROUND SYNC
Implement a server-side sync mechanism.
For example:
Every 30 minutes
       ↓
Fetch RSS feeds
       ↓
Find new articles
       ↓
Store new articles
       ↓
Generate summaries
Do not depend on a user's browser being open.
If the deployment environment does not support persistent background workers, provide a protected sync API that can be triggered by a cron service.

14. RATE LIMITING
Gemini API calls must be controlled.
Implement:
* Request queue
* Concurrency limit
* Retry handling
* Exponential backoff
* Maximum retry count
Do not send 100 Gemini requests simultaneously.
Example:
RSS contains 30 new articles

        ↓

Queue

        ↓

Gemini
Concurrency = 2–5

        ↓

Process safely

15. DUPLICATE DETECTION
Use the canonical article URL as the primary duplicate identifier.
Normalize URLs before storing them.
For example:
https://example.com/article
https://example.com/article?utm_source=rss
should preferably resolve to the same article where possible.

16. FRONTEND
Build a modern news website.
Recommended stack:
Next.js
TypeScript
Tailwind CSS
Use the App Router.
Pages:
/
├── Technology
├── Business
└── article/[id]

17. HOMEPAGE
Create a clean modern homepage.
Layout:
┌──────────────────────────────────────────────┐
│ AI NEWS                                      │
│ Technology | Business                        │
├──────────────────────────────────────────────┤
│                                              │
│ Latest News                                  │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ Article title                            │ │
│ │ The Hindu • 2 hours ago                  │ │
│ │                                          │ │
│ │ AI-generated overview...                 │ │
│ │                                          │ │
│ │ [Read Detailed Summary]                  │ │
│ └──────────────────────────────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘
Use responsive design.

18. CATEGORY PAGE
Technology:
/technology
Business:
/business
Display:
* Latest articles
* Article title
* Publication time
* Category
* Short overview
* Key takeaway
* Read more button
Sort newest first.

19. ARTICLE PAGE
Example:
/technology/article-id
Display:
Category

Headline

Published date
Source: The Hindu

Overview

Background

What Happened

Key Details

Technology Explained / Business Details

Financial Details

Regulatory Context

Statements and Claims

Impact

Future Developments

Key Takeaways

────────────────────

Original Article
[Read on The Hindu]
The original article URL must always be provided.
Do not represent the AI-generated summary as the original article.
Clearly label:
AI-generated summary
Source: The Hindu

20. UI/UX
Create a professional news-reader interface.
Requirements:
* Responsive
* Mobile-first
* Desktop optimized
* Fast loading
* Accessible
* Clean typography
* Good spacing
* Dark/light mode
* Skeleton loading
* Empty states
* Error states
* Search
* Category filters
* Pagination or infinite scroll
Avoid excessive animations.
Focus on readability.

21. SEARCH
Implement article search.
Allow users to search:
AI
Bitcoin
RBI
Google
Apple
Tesla
Startup
IPO
Search should work across:
* Title
* Summary
* Category
* Companies
* People
* Key takeaways

22. ARTICLE STATUS
Articles should have a processing state:
type SummaryStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";
Display appropriate UI:
Pending
Generating summary...
Summary available
Failed — Retry
Provide a retry mechanism for failed summaries.

23. SECURITY
Follow production security practices.
IMPORTANT:
Never expose:
GEMINI_API_KEY
DATABASE_URL
to the frontend.
Use environment variables.
Validate all API inputs.
Sanitize extracted HTML.
Prevent SSRF where article URLs are fetched from RSS.
Only allow fetching URLs from trusted/allowed domains such as:
thehindu.com
www.thehindu.com
Add API rate limiting.
Do not allow arbitrary users to submit URLs to the article-fetching service.

24. ERROR HANDLING
Handle:
RSS unavailable
Article unavailable
Article extraction failed
Gemini API unavailable
Gemini rate limit
Invalid Gemini response
Database failure
Network timeout
Malformed RSS
Never expose internal stack traces to users.
Log useful server-side errors.

25. LOGGING
Use structured logging.
Example:
[RSS] Fetching technology feed
[RSS] Found 20 articles

[ARTICLE] Processing:
https://...

[GEMINI] Generating summary
[GEMINI] Summary generated successfully

[DATABASE] Article stored
Never log:
GEMINI_API_KEY
or other secrets.

26. PROJECT STRUCTURE
Use a clean architecture similar to:
src/
├── app/
│   ├── page.tsx
│   ├── technology/
│   │   └── page.tsx
│   ├── business/
│   │   └── page.tsx
│   ├── article/
│   │   └── [id]/
│   │       └── page.tsx
│   └── api/
│       └── news/
│           ├── route.ts
│           ├── sync/
│           │   └── route.ts
│           └── [id]/
│               ├── route.ts
│               └── summarize/
│                   └── route.ts
│
├── components/
│   ├── NewsCard.tsx
│   ├── NewsList.tsx
│   ├── CategoryNav.tsx
│   ├── SummaryView.tsx
│   ├── LoadingSkeleton.tsx
│   └── ErrorState.tsx
│
├── services/
│   ├── rss.service.ts
│   ├── article-extractor.service.ts
│   ├── gemini.service.ts
│   └── news.service.ts
│
├── prompts/
│   ├── technology.prompt.ts
│   └── business.prompt.ts
│
├── lib/
│   ├── db.ts
│   ├── env.ts
│   └── validation.ts
│
├── types/
│   └── news.ts
│
└── config/
    └── feeds.ts
Use clear separation between:
UI
API
Business Logic
External Services
Database
Prompts
Types
Configuration

27. TYPEScript REQUIREMENTS
Use strict TypeScript.
Enable:
{
  "compilerOptions": {
    "strict": true
  }
}
Do NOT use:
any
Prefer:
unknown
with proper type guards when necessary.
Use:
* Interfaces
* Type aliases
* Discriminated unions
* Generics where useful
* Utility types
* Zod schemas
* Type-safe database access
Keep functions small and testable.

28. ENVIRONMENT VARIABLES
Create:
.env.example
containing:
GEMINI_API_KEY=
DATABASE_URL=
Do not commit .env.
Add it to .gitignore.

29. TESTING
Add tests for:
RSS parser
valid RSS
invalid RSS
missing fields
duplicate articles
Article extraction
valid article
missing article body
invalid HTML
Gemini response
valid JSON
invalid JSON
missing fields
unexpected response
Duplicate detection
Ensure the same article cannot be inserted twice.

30. PERFORMANCE
Optimize for:
* Server-side caching
* Database indexes
* Pagination
* Lazy loading
* Minimal client-side JavaScript
* Parallel RSS fetching
* Controlled Gemini concurrency
Do not fetch or summarize unnecessary articles.
Use database indexes on:
sourceUrl
category
publishedAt
summaryStatus

31. ATTRIBUTION
Every article must clearly show:
Source: The Hindu
and provide:
Read original article →
linking to the original URL.
The application is an AI-powered summarization tool and must not imply that the generated summary is the original article.

32. FINAL REQUIREMENT
Do not build only a frontend mockup.
Build the complete working application:
RSS
 ↓
RSS Parser
 ↓
Article Extraction
 ↓
Category Detection
 ↓
Prompt Selection
 ↓
Gemini API
 ↓
JSON Validation
 ↓
Database
 ↓
REST API
 ↓
Next.js UI
The application should work end-to-end using a real Gemini API key.
Provide:
1. Complete source code
2. Database schema
3. Environment configuration
4. Installation commands
5. Development commands
6. Production build commands
7. Database migration commands
8. Example .env.example
9. README
10. Instructions for adding new RSS categories
11. Instructions for changing Gemini prompts
12. Error handling
13. Tests
Do not use mock news data once the RSS integration is implemented.
Use real RSS feeds and real Gemini API calls.
