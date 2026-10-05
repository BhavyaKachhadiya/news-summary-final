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
  // BBC Feeds
  {
    sourceName: "BBC",
    category: "technology",
    url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
  },
  {
    sourceName: "BBC",
    category: "business",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
  },
  // TechCrunch Feeds
  {
    sourceName: "TechCrunch",
    category: "technology",
    url: "https://techcrunch.com/feed/",
  },
  // The Verge Feeds
  {
    sourceName: "The Verge",
    category: "technology",
    url: "https://www.theverge.com/rss/index.xml",
  },
  // Economic Times Feeds
  {
    sourceName: "Economic Times",
    category: "technology",
    url: "https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms",
  },
  {
    sourceName: "Economic Times",
    category: "business",
    url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
  },
  // NDTV & Gadgets360 Feeds
  {
    sourceName: "NDTV",
    category: "technology",
    url: "https://feeds.feedburner.com/gadgets360-latest",
  },
  {
    sourceName: "NDTV",
    category: "business",
    url: "https://feeds.feedburner.com/ndtvprofit-latest",
  },
  // Indian Express Feeds
  {
    sourceName: "Indian Express",
    category: "technology",
    url: "https://indianexpress.com/section/technology/feed/",
  },
  {
    sourceName: "Indian Express",
    category: "business",
    url: "https://indianexpress.com/section/business/feed/",
  },
  // Times of India Feeds
  {
    sourceName: "Times of India",
    category: "technology",
    url: "https://timesofindia.indiatimes.com/rssfeeds/66949542.cms",
  },
  {
    sourceName: "Times of India",
    category: "business",
    url: "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms",
  },
  // Hindustan Times Feeds
  {
    sourceName: "Hindustan Times",
    category: "technology",
    url: "https://www.hindustantimes.com/feeds/rss/technology/rssfeed.xml",
  },
  {
    sourceName: "Hindustan Times",
    category: "business",
    url: "https://www.hindustantimes.com/feeds/rss/business/rssfeed.xml",
  },
];

// Dynamically derived list of all configured unique source names
export const CONFIGURED_SOURCE_NAMES: string[] = Array.from(
  new Set([
    ...RSS_FEED_CONFIGS.map((f) => f.sourceName),
    "Moneycontrol", // Directly scraped live feed
  ])
).sort((a, b) => a.localeCompare(b));

// Backward compatibility map
export const RSS_FEEDS: Record<NewsCategory, string[]> = {
  technology: RSS_FEED_CONFIGS.filter((f) => f.category === "technology").map((f) => f.url),
  business: RSS_FEED_CONFIGS.filter((f) => f.category === "business").map((f) => f.url),
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
  "bbci.co.uk",
  "www.bbci.co.uk",
  "bbc.com",
  "www.bbc.com",
  "bbc.co.uk",
  "www.bbc.co.uk",
  "techcrunch.com",
  "www.techcrunch.com",
  "theverge.com",
  "www.theverge.com",
  "economictimes.indiatimes.com",
  "indiatimes.com",
  "timesofindia.indiatimes.com",
  "moneycontrol.com",
  "www.moneycontrol.com",
  "ndtv.com",
  "www.ndtv.com",
  "ndtvprofit.com",
  "www.ndtvprofit.com",
  "gadgets360.com",
  "www.gadgets360.com",
  "feedburner.com",
  "feeds.feedburner.com",
  "indianexpress.com",
  "www.indianexpress.com",
  "hindustantimes.com",
  "www.hindustantimes.com",
  "reuters.com",
  "www.reuters.com",
] as const;

export const APP_CONFIG = {
  appName: "SIGNAL AI News",
  description: "Automated, in-depth AI summaries of Technology and Business reporting from global and leading Indian publishers powered by Google Gemini.",
  itemsPerPage: 12,
  articleExtractionTimeoutMs: 10000,
  rssFetchTimeoutMs: 15000,
  maxPostsPerSource: 10, // Keep only the latest 10 posts from each individual source
  maxConcurrentExtraction: 5,
  maxArticleHtmlSizeBytes: 2 * 1024 * 1024, // 2MB max response HTML size
  maxExtractedTextLength: 20000, // 20,000 characters maximum extracted text
  maxGeminiInputLength: 15000, // 15,000 characters untrusted content into Gemini
  staleProcessingTimeoutMs: 5 * 60 * 1000, // 5 minutes processing lock expiry
  articleRetentionDays: 3, // Automatically purge articles older than 3 days
  maxConcurrentGeminiRequests: 3,
  geminiMaxRetries: 3,
  geminiInitialBackoffMs: 2000,
  userAgent: "Mozilla/5.0 (compatible; SignalNewsAggregator/1.0; +https://github.com/news-sum)",
} as const;
