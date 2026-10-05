import Parser from "rss-parser";
import { NewsCategory, FeedConfig, RSS_FEED_CONFIGS, APP_CONFIG } from "@/config/feeds";
import { RssArticle } from "@/types/news";
import { logger } from "@/lib/logging/logger";

interface CustomFeedItem {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
  creator?: string;
  author?: string;
}

const parser = new Parser<Record<string, unknown>, CustomFeedItem>({
  headers: {
    "User-Agent": APP_CONFIG.userAgent,
    Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
  },
  timeout: APP_CONFIG.rssFetchTimeoutMs,
});

/**
 * Normalizes an article URL by removing tracking query parameters (UTM, etc.)
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "_ga",
    ];

    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }

    // Standardize protocol to https
    if (parsed.protocol === "http:") {
      parsed.protocol = "https:";
    }

    // Remove trailing slash if path is longer than 1 character
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    parsed.pathname = pathname;

    return parsed.toString();
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Fetches and parses RSS articles for a specific feed configuration.
 * Gracefully handles malformed feeds or unavailable websites without throwing.
 */
export async function fetchFeedArticles(feedConfig: FeedConfig): Promise<RssArticle[]> {
  logger.info("RSS", `Fetching [${feedConfig.sourceName}] ${feedConfig.category} feed from: ${feedConfig.url}`);

  try {
    const feed = await parser.parseURL(feedConfig.url);
    const items = feed.items || [];
    logger.info("RSS", `Fetched ${items.length} raw items from ${feedConfig.sourceName} (${feedConfig.category})`);

    const seenUrls = new Set<string>();
    const articles: RssArticle[] = [];

    for (const item of items) {
      const rawUrl = item.link || item.guid;
      if (!rawUrl || typeof rawUrl !== "string") {
        continue;
      }

      const normalized = normalizeUrl(rawUrl);
      if (seenUrls.has(normalized)) {
        continue;
      }
      seenUrls.add(normalized);

      const title = (item.title || "").trim();
      if (!title) {
        continue;
      }

      const rawDescription = item.contentSnippet || item.summary || item.content || "";
      const cleanDescription = rawDescription.replace(/<[^>]*>?/gm, "").trim();

      let pubDate = new Date();
      if (item.isoDate) {
        const d = new Date(item.isoDate);
        if (!isNaN(d.getTime())) pubDate = d;
      } else if (item.pubDate) {
        const d = new Date(item.pubDate);
        if (!isNaN(d.getTime())) pubDate = d;
      }

      articles.push({
        id: item.guid || normalized,
        source: feedConfig.sourceName,
        title,
        url: normalized,
        guid: item.guid || null,
        description: cleanDescription,
        publishedAt: pubDate,
        category: feedConfig.category,
        author: item.creator || item.author || feedConfig.sourceName,
      });
    }

    logger.info("RSS", `Extracted ${articles.length} valid unique articles from ${feedConfig.sourceName} (${feedConfig.category})`);
    return articles;
  } catch (err: unknown) {
    logger.error("RSS", `Error fetching feed from ${feedConfig.sourceName} (${feedConfig.url})`, err);
    return [];
  }
}

/**
 * Fetches and parses RSS articles for a given category from all configured sources.
 */
export async function fetchRssFeed(category: NewsCategory): Promise<RssArticle[]> {
  const configs = RSS_FEED_CONFIGS.filter((f) => f.category === category);
  const results = await Promise.allSettled(configs.map((cfg) => fetchFeedArticles(cfg)));

  const seenUrls = new Set<string>();
  const combined: RssArticle[] = [];

  for (const res of results) {
    if (res.status === "fulfilled") {
      for (const article of res.value) {
        if (!seenUrls.has(article.url)) {
          seenUrls.add(article.url);
          combined.push(article);
        }
      }
    }
  }

  // Sort newest first
  combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return combined;
}

/**
 * Fetches RSS feeds for all configured categories and sources in parallel.
 */
export async function fetchAllRssFeeds(): Promise<Record<NewsCategory, RssArticle[]>> {
  const results = await Promise.allSettled(
    RSS_FEED_CONFIGS.map(async (cfg) => ({
      category: cfg.category,
      articles: await fetchFeedArticles(cfg),
    }))
  );

  const combined: Record<NewsCategory, RssArticle[]> = {
    technology: [],
    business: [],
  };

  const seenUrls = new Set<string>();

  for (const res of results) {
    if (res.status === "fulfilled") {
      for (const article of res.value.articles) {
        if (!seenUrls.has(article.url)) {
          seenUrls.add(article.url);
          combined[res.value.category].push(article);
        }
      }
    } else {
      logger.error("RSS", "Feed fetch failed", res.reason);
    }
  }

  // Sort by date descending
  combined.technology.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  combined.business.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return combined;
}
