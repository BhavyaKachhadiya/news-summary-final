export type NewsCategory = "technology" | "business";

export interface FeedConfig {
  sourceName: string;
  category: NewsCategory;
  url: string;
}

export const RSS_FEED_CONFIGS: FeedConfig[] = [
  // The Hindu Feeds
  {
    sourceName: "The Hindu",
    category: "technology",
    url: "https://www.thehindu.com/sci-tech/technology/feeder/default.rss",
  },
  {
    sourceName: "The Hindu",
    category: "business",
    url: "https://www.thehindu.com/business/feeder/default.rss",
  },
  // Bhaskar English Feeds
  {
    sourceName: "Bhaskar English",
    category: "technology",
    url: "https://www.bhaskarenglish.in/rss-v1--category-16336.xml",
  },
  {
    sourceName: "Bhaskar English",
    category: "business",
    url: "https://www.bhaskarenglish.in/rss-v1--category-16332.xml",
  },
];

// Backward compatibility map
export const RSS_FEEDS: Record<NewsCategory, string[]> = {
  technology: [
    "https://www.thehindu.com/sci-tech/technology/feeder/default.rss",
    "https://www.bhaskarenglish.in/rss-v1--category-16336.xml",
  ],
  business: [
    "https://www.thehindu.com/business/feeder/default.rss",
    "https://www.bhaskarenglish.in/rss-v1--category-16332.xml",
  ],
};

export const CATEGORY_LABELS: Record<NewsCategory, string> = {
  technology: "Technology",
  business: "Business",
};

export const ALLOWED_DOMAINS = [
  "thehindu.com",
  "www.thehindu.com",
  "bhaskarenglish.in",
  "www.bhaskarenglish.in",
] as const;

export const APP_CONFIG = {
  appName: "SIGNAL AI News",
  description: "Automated, in-depth AI summaries of Technology and Business reporting from The Hindu & Bhaskar English powered by Google Gemini.",
  itemsPerPage: 12,
  articleExtractionTimeoutMs: 10000,
  rssFetchTimeoutMs: 15000,
  maxConcurrentExtraction: 5,
  maxArticleHtmlSizeBytes: 2 * 1024 * 1024, // 2MB max response HTML size
  maxExtractedTextLength: 20000, // 20,000 characters maximum extracted text
  maxGeminiInputLength: 15000, // 15,000 characters untrusted content into Gemini
  staleProcessingTimeoutMs: 5 * 60 * 1000, // 5 minutes processing lock expiry
  maxConcurrentGeminiRequests: 3,
  geminiMaxRetries: 3,
  geminiInitialBackoffMs: 2000,
  userAgent: "Mozilla/5.0 (compatible; SignalNewsAggregator/1.0; +https://github.com/news-sum)",
} as const;
