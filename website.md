Build a production-ready AI News Aggregator and Summarization Website using:
Next.js + TypeScript + MongoDB + Mongoose + Zod + Google Gemini API
The complete pipeline must be:
RSS Feed → RSS Parser → Article Extraction → Category Prompt → Gemini API → Validate JSON → MongoDB → Next.js UI
The website should fetch news from The Hindu RSS feeds, extract the article content where accessible, summarize it using Gemini, store the result in MongoDB, and display the detailed AI-generated summary.

1. RSS FEEDS
Initially support:
Technology
https://www.thehindu.com/sci-tech/technology/feeder/default.rss
Business
https://www.thehindu.com/business/feeder/default.rss
Create a centralized configuration so additional categories can easily be added.
export const RSS_FEEDS = {
  technology: "https://www.thehindu.com/sci-tech/technology/feeder/default.rss",
  business: "https://www.thehindu.com/business/feeder/default.rss",
} as const;

export type NewsCategory = keyof typeof RSS_FEEDS;

2. TECHNOLOGY STACK
Use:
Next.js
TypeScript
Tailwind CSS
MongoDB
Mongoose
Zod
Google Gemini API
Use the Next.js App Router.
Use strict TypeScript.
Do NOT use any.

3. ENVIRONMENT VARIABLES
Create:
.env.example
with:
MONGODB_URI=mongodb://localhost:27017/ai-news
GEMINI_API_KEY=
For MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-news
Never expose either variable to the browser.
Do NOT use:
NEXT_PUBLIC_GEMINI_API_KEY=
NEXT_PUBLIC_MONGODB_URI=

4. MONGODB CONNECTION
Create:
src/lib/mongodb.ts
Implement a reusable MongoDB connection.
The connection must be cached during development so Next.js hot reload does not create excessive database connections.
Example architecture:
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;

  return cached.conn;
}
Adapt the implementation as necessary for the latest Mongoose version.

5. MONGOOSE ARTICLE MODEL
Create:
src/models/Article.ts
Use a schema similar to:
import { Schema, model, models, type InferSchemaType } from "mongoose";

const ArticleSchema = new Schema(
  {
    source: {
      type: String,
      required: true,
      default: "The Hindu",
      index: true,
    },

    sourceUrl: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    guid: {
      type: String,
      default: null,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    content: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: ["technology", "business"],
      required: true,
      index: true,
    },

    author: {
      type: String,
      default: "",
    },

    publishedAt: {
      type: Date,
      required: true,
      index: true,
    },

    fetchedAt: {
      type: Date,
      default: Date.now,
    },

    summarizedAt: {
      type: Date,
      default: null,
    },

    summaryStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed"
      ],
      default: "pending",
      index: true,
    },

    summary: {
      type: Schema.Types.Mixed,
      default: null,
    },

    summaryError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ArticleSchema.index({
  category: 1,
  publishedAt: -1,
});

export type ArticleDocument = InferSchemaType<typeof ArticleSchema>;

export const Article =
  models.Article || model("Article", ArticleSchema);
Use appropriate indexes for:
sourceUrl
category
publishedAt
summaryStatus

6. GEMINI SUMMARY STORAGE
The Gemini response should be stored inside MongoDB.
Example:
{
  "summary": {
    "headline": "...",
    "overview": "...",
    "background": "...",
    "what_happened": "...",
    "key_details": [],
    "technology_explained": "...",
    "business_details": [],
    "financial_details": [],
    "regulatory_context": "...",
    "market_economic_context": "...",
    "companies_and_organizations": [],
    "people": [],
    "statements_and_claims": [],
    "impact": "...",
    "risks_and_uncertainties": [],
    "future_developments": [],
    "key_takeaways": [],
    "category": "technology"
  }
}
MongoDB's flexible document structure is useful here because Technology and Business summaries can have different category-specific fields.

7. ZOD VALIDATION
Do not trust Gemini's response directly.
Create:
src/lib/validation/
├── technology-summary.schema.ts
└── business-summary.schema.ts
Use Zod.
Example:
import { z } from "zod";

export const TechnologySummarySchema = z.object({
  headline: z.string(),
  overview: z.string(),
  background: z.string(),
  what_happened: z.string(),

  key_details: z.array(z.string()),

  technology_explained: z.string(),

  companies_and_organizations: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      role: z.string(),
    })
  ),

  people: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      involvement: z.string(),
    })
  ),

  statements_and_claims: z.array(z.string()),

  impact: z.string(),

  future_developments: z.array(z.string()),

  key_takeaways: z.array(z.string()),

  category: z.literal("Technology"),
});
Create a corresponding Business schema.
If Gemini returns invalid data:
Gemini
 ↓
Parse
 ↓
Zod validation
 ↓
Invalid?
 ↓
Do NOT save
 ↓
Mark article as failed

8. RSS SERVICE
Create:
src/services/rss.service.ts
Responsibilities:
* Fetch RSS XML
* Parse XML
* Extract articles
* Normalize URLs
* Remove duplicates
* Assign category
Interface:
export interface RssArticle {
  id: string;
  title: string;
  url: string;
  description: string;
  publishedAt: Date;
  category: NewsCategory;
}
Function:
export async function fetchRssFeed(
  category: NewsCategory
): Promise<RssArticle[]>
Handle:
* Network failures
* Invalid XML
* Missing fields
* Duplicate articles
* Timeouts

9. ARTICLE EXTRACTION
RSS does not necessarily contain the complete article.
For every new article:
RSS URL
 ↓
Fetch article page
 ↓
Extract readable article
 ↓
Remove:
  - navigation
  - ads
  - footer
  - related articles
  - subscription UI
  - cookie banners
 ↓
Return clean article content
Create:
src/services/article-extractor.service.ts
If extraction fails:
Use RSS description
instead of crashing the entire synchronization process.
Store the actual extracted content in:
Article.content

10. GEMINI SERVICE
Create:
src/services/gemini.service.ts
Use the official Google GenAI TypeScript SDK.
Responsibilities:
Article
 ↓
Select category prompt
 ↓
Gemini
 ↓
Structured JSON
 ↓
Zod validation
 ↓
Return validated summary
Never put Gemini calls inside React components.
Never expose the API key to the frontend.

11. PROMPTS
Create:
src/prompts/
├── technology.prompt.ts
└── business.prompt.ts
Store the complete detailed prompts previously defined for:
Technology
The Technology prompt should produce a full detailed summary, approximately 800–1,500 words when appropriate.
It should cover:
* Overview
* Background
* What happened
* Key details
* Technology explained
* Companies
* People
* Statements
* Impact
* Future developments
* Key takeaways
Business
The Business prompt should produce a full detailed business/financial summary.
It should cover:
* Overview
* Background
* What happened
* Business details
* Financial details
* Regulatory context
* Market/economic context
* Companies
* People
* Statements
* Impact
* Risks
* Future developments
* Key takeaways

12. CATEGORY PROMPT SELECTION
Create a type-safe function:
function getSummaryPrompt(category: NewsCategory): string {
  switch (category) {
    case "technology":
      return TECHNOLOGY_PROMPT;

    case "business":
      return BUSINESS_PROMPT;

    default:
      throw new Error(`Unsupported category: ${category}`);
  }
}
Do not duplicate Gemini logic for every category.
Only the prompt and validation schema should change.

13. RSS SYNCHRONIZATION
Create:
POST /api/news/sync
The synchronization process:
Fetch Technology RSS
        ↓
Fetch Business RSS
        ↓
Combine articles
        ↓
Normalize URLs
        ↓
Check MongoDB
        ↓
New article?
        ↓
Yes
        ↓
Extract article
        ↓
Save Article
        ↓
Generate Gemini summary
        ↓
Validate summary
        ↓
Update MongoDB
Existing articles must NOT be summarized again.
Use:
sourceUrl
as the unique identifier.

14. SUMMARY STATUS
Use:
type SummaryStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";
Flow:
pending
   ↓
processing
   ↓
completed
or:
processing
   ↓
failed
Store the error in:
summaryError
Allow the user/admin to retry failed summaries.

15. GEMINI RATE LIMITING
Do not send all new articles to Gemini simultaneously.
Implement a small concurrency-controlled queue.
For example:
10 new articles
      ↓
Queue
      ↓
2–5 concurrent Gemini requests
      ↓
Process safely
Implement:
* Retry
* Exponential backoff
* Maximum retries
* Rate-limit handling
* Timeout handling
Do not continuously retry a permanently invalid request.

16. API ROUTES
Implement:
Get articles
GET /api/news
Examples:
/api/news
/api/news?category=technology
/api/news?category=business
/api/news?page=1&limit=20
Get individual article
GET /api/news/:id
Synchronize RSS
POST /api/news/sync
Generate/retry summary
POST /api/news/:id/summarize

17. DATABASE QUERIES
Use MongoDB efficiently.
Example:
const articles = await Article.find({
  category,
})
  .sort({
    publishedAt: -1,
  })
  .skip(skip)
  .limit(limit)
  .lean();
Use .lean() for read-only queries where appropriate.
Do not fetch thousands of documents unnecessarily.

18. SEARCH
Implement MongoDB search across:
* title
* description
* summary.overview
* summary.key_takeaways
* category
Support:
/api/news?search=bitcoin
/api/news?search=RBI
/api/news?search=AI
For larger datasets, consider MongoDB Atlas Search.

19. FRONTEND
Build a modern responsive news website with:
/
├── /technology
├── /business
└── /article/[id]
Homepage:
AI NEWS

Technology | Business

Latest News

┌──────────────────────────────┐
│ Article headline             │
│ The Hindu • 2 hours ago      │
│                              │
│ AI-generated overview...     │
│                              │
│ Read Detailed Summary →      │
└──────────────────────────────┘

20. ARTICLE PAGE
Display:
Technology

Headline

The Hindu
Published date

AI-generated summary

Overview

Background

What Happened

Key Details

Technology Explained

Companies & Organizations

People

Statements & Claims

Impact

Future Developments

Key Takeaways

────────────────────

Original Article
Read on The Hindu →
For Business articles, display relevant sections:
Business Details
Financial Details
Regulatory Context
Market & Economic Context
Risks & Uncertainties
Do not display irrelevant empty sections.

21. SOURCE ATTRIBUTION
Every article must clearly display:
Source: The Hindu
and:
Read original article →
using the original article URL.
Clearly label the generated content:
AI-generated summary
Do not present the generated summary as the original article.

22. SECURITY
Protect:
GEMINI_API_KEY
MONGODB_URI
Never expose them client-side.
Validate all API inputs.
Prevent SSRF.
The article extraction service should only fetch approved domains.
Initially allow:
thehindu.com
www.thehindu.com
Do not allow users to submit arbitrary URLs for server-side fetching.
Add API rate limiting.

23. PROJECT STRUCTURE
Use:
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
│   │
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
│   ├── SearchBar.tsx
│   ├── LoadingSkeleton.tsx
│   └── ErrorState.tsx
│
├── services/
│   ├── rss.service.ts
│   ├── article-extractor.service.ts
│   ├── gemini.service.ts
│   └── news.service.ts
│
├── models/
│   └── Article.ts
│
├── prompts/
│   ├── technology.prompt.ts
│   └── business.prompt.ts
│
├── schemas/
│   ├── technology-summary.schema.ts
│   └── business-summary.schema.ts
│
├── lib/
│   ├── mongodb.ts
│   ├── env.ts
│   └── validation.ts
│
├── config/
│   └── feeds.ts
│
└── types/
    └── news.ts

24. PERFORMANCE
Implement:
* MongoDB indexes
* RSS caching
* API caching where appropriate
* Pagination
* Server-side rendering where appropriate
* .lean() for read-only MongoDB queries
* Controlled Gemini concurrency
* Avoid duplicate Gemini calls
* Avoid unnecessary article extraction
Most importantly:
Article already summarized?
        ↓
YES
        ↓
Return MongoDB summary
Do NOT call Gemini again.

25. AUTOMATIC RSS SYNC
The application should support automatic synchronization.
Preferred flow:
Every 30 minutes
       ↓
/api/news/sync
       ↓
Fetch RSS
       ↓
Find new articles
       ↓
Store in MongoDB
       ↓
Generate summaries
If the deployment platform cannot run persistent background jobs, make the sync endpoint compatible with a cron service.
Protect the sync endpoint with a secret:
CRON_SECRET=

26. ADMIN / SYNC CONTROL
Create a simple admin area or protected controls allowing the developer to:
Sync RSS
Retry failed summaries
View processing status
View number of articles
View number of summarized articles
Example:
Articles: 142

Technology: 78
Business: 64

Summarized: 137
Pending: 3
Failed: 2

[Sync Now]
[Retry Failed]
Protect admin operations.

27. ERROR HANDLING
Gracefully handle:
* RSS unavailable
* Invalid RSS
* Article unavailable
* Article extraction failure
* Gemini API failure
* Gemini rate limit
* Invalid Gemini JSON
* Zod validation failure
* MongoDB failure
* Network timeout
Never expose internal stack traces to users.

28. LOGGING
Use structured server-side logging.
Example:
[RSS] Fetching technology feed
[RSS] Found 20 articles

[RSS] Fetching business feed
[RSS] Found 20 articles

[DB] New article detected

[ARTICLE] Extracting content

[GEMINI] Generating summary

[GEMINI] Summary validated

[DB] Summary stored
Never log:
GEMINI_API_KEY
MONGODB_URI

29. TYPESCRIPT
Use strict TypeScript.
Never use:
any
Use:
unknown
when the type is not known and narrow it safely.
Use:
* Interfaces
* Type aliases
* Discriminated unions
* Generics
* Utility types
* Zod
* Type-safe Mongoose models
Keep services independent and testable.

30. TESTING
Add tests for:
RSS
Valid RSS
Invalid XML
Missing fields
Duplicate articles
MongoDB
Create article
Find article
Duplicate sourceUrl
Update summary
Gemini
Valid response
Invalid JSON
Missing fields
Rate limit
API failure
Article extraction
Valid article
Missing content
Invalid HTML

31. README
Create a complete README containing:
Installation
npm install
Environment
cp .env.example .env.local
Configure:
MONGODB_URI=
GEMINI_API_KEY=
CRON_SECRET=
Development
npm run dev
Production
npm run build
npm start
Explain:
* MongoDB setup
* Gemini API setup
* RSS configuration
* Adding categories
* Changing prompts
* Running synchronization
* Deployment
* Environment variables

32. FINAL ARCHITECTURE
The final application must work like this:
                    THE HINDU
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
        Technology            Business
           RSS                   RSS
             │                   │
             └─────────┬─────────┘
                       ↓
                  RSS Parser
                       ↓
                Article Database
                    MongoDB
                       ↓
               Article Extractor
                       ↓
                Category Detection
                       ↓
             ┌─────────┴─────────┐
             ↓                   ↓
      Technology Prompt    Business Prompt
             │                   │
             └─────────┬─────────┘
                       ↓
                   Gemini API
                       ↓
                  Zod Validation
                       ↓
                  MongoDB Store
                       ↓
                  Next.js API
                       ↓
                Next.js Frontend
                       ↓
              AI News Reader
Build the application as a real working product, not a UI prototype.
Use real RSS feeds, real MongoDB, and real Gemini API integration.
Do not use mock articles after the RSS integration is implemented.
