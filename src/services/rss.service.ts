import Parser from "rss-parser";
import * as cheerio from "cheerio";
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
  enclosure?: { url?: string };
  mediaContent?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
  mediaThumbnail?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
  "media:content"?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
  "media:thumbnail"?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
}

const parser = new Parser<Record<string, unknown>, CustomFeedItem>({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
    ],
  },
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
 * Extracts candidate image URL from custom feed item tags (enclosure, media:content, <img> in content).
 */
export function extractImageUrlFromFeedItem(item: CustomFeedItem): string | null {
  try {
    if (item.enclosure?.url) {
      return item.enclosure.url;
    }

    const mc = item.mediaContent || item["media:content"];
    if (mc) {
      if (Array.isArray(mc) && mc[0]?.$?.url) {
        return mc[0].$.url;
      } else if (!Array.isArray(mc) && mc.$?.url) {
        return mc.$.url;
      }
    }

    const mt = item.mediaThumbnail || item["media:thumbnail"];
    if (mt) {
      if (Array.isArray(mt) && mt[0]?.$?.url) {
        return mt[0].$.url;
      } else if (!Array.isArray(mt) && mt.$?.url) {
        return mt.$.url;
      }
    }

    const rawHtml = item.content || item.summary || "";
    if (rawHtml) {
      const match = rawHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch {
    // Graceful fallback if structure cannot be inspected
  }
  return null;
}

/**
 * Parses and returns a valid Date from RSS item date fields.
 */
export function parsePublishedDate(item: CustomFeedItem): Date {
  if (item.isoDate) {
    const d = new Date(item.isoDate);
    if (!isNaN(d.getTime())) return d;
  }
  if (item.pubDate) {
    const d = new Date(item.pubDate);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * Takes an array of articles from a single source, deduplicates them by URL,
 * sorts them by publication date in descending order, and keeps only the latest N posts.
 */
export function limitSourceArticles(
  articles: RssArticle[],
  maxCount: number = APP_CONFIG.maxPostsPerSource
): RssArticle[] {
  const seenUrls = new Set<string>();
  const uniqueArticles: RssArticle[] = [];

  for (const a of articles) {
    if (!seenUrls.has(a.url)) {
      seenUrls.add(a.url);
      uniqueArticles.push(a);
    }
  }

  // Sort descending by actual published timestamp
  uniqueArticles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return uniqueArticles.slice(0, maxCount);
}

/**
 * Round-robin interleaves articles across sources:
 * 1. Groups articles by source.
 * 2. Within each source, sorts articles newest to oldest.
 * 3. Orders sources by their newest article's publication date.
 * 4. Iterates in rounds (Round 1 takes 1st post from each source, Round 2 takes 2nd post, etc.)
 * Ensures source diversity while maintaining recency.
 */
export function interleaveArticlesBySource<T extends { source?: string; publishedAt: Date | string }>(
  articles: T[]
): T[] {
  if (articles.length <= 1) {
    return articles;
  }

  const sourceGroups = new Map<string, T[]>();

  for (const article of articles) {
    const src = (article.source || "Other").trim();
    if (!sourceGroups.has(src)) {
      sourceGroups.set(src, []);
    }
    sourceGroups.get(src)!.push(article);
  }

  // Sort articles within each source newest to oldest
  for (const group of sourceGroups.values()) {
    group.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  // Order sources by the publication date of their freshest post
  const sortedSources = Array.from(sourceGroups.keys()).sort((srcA, srcB) => {
    const latestA = new Date(sourceGroups.get(srcA)![0].publishedAt).getTime();
    const latestB = new Date(sourceGroups.get(srcB)![0].publishedAt).getTime();
    return latestB - latestA;
  });

  const result: T[] = [];
  let round = 0;
  let addedInRound = true;

  while (addedInRound) {
    addedInRound = false;
    for (const src of sortedSources) {
      const group = sourceGroups.get(src)!;
      if (round < group.length) {
        result.push(group[round]);
        addedInRound = true;
      }
    }
    round++;
  }

  return result;
}

/**
 * Combines articles from multiple sources, removes duplicate URLs globally,
 * and interleaves them using round-robin source diversification while preserving recency.
 */
export function combineAndDeduplicateArticles(articleGroups: RssArticle[][]): RssArticle[] {
  const seenUrls = new Set<string>();
  const combined: RssArticle[] = [];

  for (const group of articleGroups) {
    for (const article of group) {
      if (!seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        combined.push(article);
      }
    }
  }

  return interleaveArticlesBySource(combined);
}

/**
 * Fetches and parses RSS articles for a specific feed configuration.
 * Sorts articles by pubDate descending and keeps ONLY the latest 10 posts for that source.
 * Gracefully handles malformed feeds or unavailable websites without throwing.
 */
export async function fetchFeedArticles(
  feedConfig: FeedConfig,
  limitCount: number = APP_CONFIG.maxPostsPerSource
): Promise<RssArticle[]> {
  logger.info("RSS", `Fetching [${feedConfig.sourceName}] ${feedConfig.category} feed from: ${feedConfig.url}`);

  try {
    const feed = await parser.parseURL(feedConfig.url);
    const items = feed.items || [];
    logger.info("RSS", `Fetched ${items.length} raw items from ${feedConfig.sourceName} (${feedConfig.category})`);

    const rawArticles: RssArticle[] = [];

    for (const item of items) {
      const rawUrl = item.link || item.guid;
      if (!rawUrl || typeof rawUrl !== "string") {
        continue;
      }

      const normalized = normalizeUrl(rawUrl);
      const title = (item.title || "").trim();
      if (!title) {
        continue;
      }

      const rawDescription = item.contentSnippet || item.summary || item.content || "";
      const cleanDescription = rawDescription.replace(/<[^>]*>?/gm, "").trim();
      const pubDate = parsePublishedDate(item);
      const imageUrl = extractImageUrlFromFeedItem(item);

      rawArticles.push({
        id: item.guid || normalized,
        source: feedConfig.sourceName,
        title,
        url: normalized,
        guid: item.guid || null,
        description: cleanDescription,
        imageUrl,
        publishedAt: pubDate,
        category: feedConfig.category,
        author: item.creator || item.author || feedConfig.sourceName,
      });
    }

    // Keep ONLY the latest N posts from this individual source, sorted newest first
    const limited = limitSourceArticles(rawArticles, limitCount);
    logger.info(
      "RSS",
      `Kept ${limited.length} latest articles (max ${limitCount}) from ${feedConfig.sourceName} (${feedConfig.category})`
    );
    return limited;
  } catch (err: unknown) {
    logger.error("RSS", `Error fetching feed from ${feedConfig.sourceName} (${feedConfig.url})`, err);
    return [];
  }
}

/**
 * Scrapes fresh articles directly from Moneycontrol sections.
 * Moneycontrol deprecated open RSS XML endpoints in 2024, so direct extraction provides live feeds.
 * Sorts articles by pubDate descending and keeps ONLY the latest 10 posts.
 */
export async function fetchMoneycontrolArticles(
  category: NewsCategory,
  limitCount: number = APP_CONFIG.maxPostsPerSource
): Promise<RssArticle[]> {
  const targetUrl =
    category === "technology"
      ? "https://www.moneycontrol.com/technology/"
      : "https://www.moneycontrol.com/news/business/";

  logger.info("RSS", `Fetching [Moneycontrol] ${category} live feed from: ${targetUrl}`);

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(APP_CONFIG.rssFetchTimeoutMs),
    });

    if (!res.ok) {
      logger.warn("RSS", `Moneycontrol ${category} returned HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const rawArticles: RssArticle[] = [];

    $("li, div.news_listing, div.f-left, div.article_listing").each((_, el) => {
      const a = $(el)
        .find("a[href*='.html']")
        .filter((__, anchor) => {
          const h = $(anchor).attr("href") || "";
          const matches =
            category === "technology"
              ? h.includes("/technology/")
              : h.includes("/news/business/") ||
                h.includes("/news/economy/") ||
                h.includes("/news/markets/");
          return matches && $(anchor).text().trim().length > 25;
        })
        .first();

      if (a.length > 0) {
        const rawUrl = a.attr("href");
        const title = a.text().trim();
        if (rawUrl && title) {
          const normalized = normalizeUrl(rawUrl);
          const desc = $(el).find("p").first().text().trim();
          const img =
            $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || null;

          rawArticles.push({
            id: normalized,
            source: "Moneycontrol",
            title,
            url: normalized,
            guid: normalized,
            description: desc,
            imageUrl: img,
            publishedAt: new Date(),
            category,
            author: "Moneycontrol",
          });
        }
      }
    });

    // Keep ONLY the latest N posts from Moneycontrol for this category
    const limited = limitSourceArticles(rawArticles, limitCount);
    logger.info(
      "RSS",
      `Extracted & kept ${limited.length} latest articles from Moneycontrol (${category})`
    );
    return limited;
  } catch (err: unknown) {
    logger.error("RSS", `Error fetching Moneycontrol ${category}`, err);
    return [];
  }
}

/**
 * Fetches RSS articles for a given category from each configured source individually.
 * For each source separately, keeps only the latest 10 posts.
 * Then combines all posts, removes duplicates, and sorts newest first.
 */
export async function fetchRssFeed(
  category: NewsCategory,
  limitPerSource: number = APP_CONFIG.maxPostsPerSource
): Promise<RssArticle[]> {
  const configs = RSS_FEED_CONFIGS.filter((f) => f.category === category);
  const results = await Promise.allSettled([
    ...configs.map((cfg) => fetchFeedArticles(cfg, limitPerSource)),
    fetchMoneycontrolArticles(category, limitPerSource),
  ]);

  const sourceGroups: RssArticle[][] = [];
  for (const res of results) {
    if (res.status === "fulfilled") {
      sourceGroups.push(res.value);
    }
  }

  return combineAndDeduplicateArticles(sourceGroups);
}

/**
 * Fetches RSS feeds for all configured categories and sources in parallel.
 * Enforces per-source 10 post limit independently for each feed.
 * Deduplicates globally across all sources and sorts newest to oldest.
 */
export async function fetchAllRssFeeds(
  limitPerSource: number = APP_CONFIG.maxPostsPerSource
): Promise<Record<NewsCategory, RssArticle[]>> {
  const feedPromises = RSS_FEED_CONFIGS.map(async (cfg) => ({
    category: cfg.category,
    articles: await fetchFeedArticles(cfg, limitPerSource),
  }));

  const moneycontrolPromises = [
    (async () => ({
      category: "technology" as NewsCategory,
      articles: await fetchMoneycontrolArticles("technology", limitPerSource),
    }))(),
    (async () => ({
      category: "business" as NewsCategory,
      articles: await fetchMoneycontrolArticles("business", limitPerSource),
    }))(),
  ];

  const results = await Promise.allSettled([...feedPromises, ...moneycontrolPromises]);

  const categoryGroups: Record<NewsCategory, RssArticle[][]> = {
    technology: [],
    business: [],
  };

  for (const res of results) {
    if (res.status === "fulfilled") {
      categoryGroups[res.value.category].push(res.value.articles);
    } else {
      logger.error("RSS", "Feed fetch failed", res.reason);
    }
  }

  return {
    technology: combineAndDeduplicateArticles(categoryGroups.technology),
    business: combineAndDeduplicateArticles(categoryGroups.business),
  };
}
