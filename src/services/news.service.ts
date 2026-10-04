import { connectToDatabase } from "@/lib/mongodb";
import { Article, ArticleModelDocument } from "@/models/Article";
import { fetchAllRssFeeds } from "./rss.service";
import { extractArticleContent } from "./article-extractor.service";
import { generateArticleSummary } from "./gemini.service";
import { NewsCategory, APP_CONFIG } from "@/config/feeds";
import {
  ArticleDocument,
  NewsListResponse,
  NewsStats,
  SummaryStatus,
} from "@/types/news";

export interface SyncResult {
  totalFeedsFetched: number;
  newArticlesFound: number;
  summariesCompleted: number;
  summariesFailed: number;
  details: Array<{
    title: string;
    url: string;
    category: NewsCategory;
    status: SummaryStatus;
    error?: string;
  }>;
}

export interface GetArticlesOptions {
  category?: NewsCategory | "all";
  page?: number;
  limit?: number;
  search?: string;
  status?: SummaryStatus;
}

/**
 * Normalizes MongoDB documents into plain JavaScript objects for safe Next.js serialization.
 */
function serializeArticle(doc: any): ArticleDocument {
  return {
    _id: doc._id.toString(),
    source: doc.source || "The Hindu",
    sourceUrl: doc.sourceUrl,
    guid: doc.guid || null,
    title: doc.title,
    description: doc.description || "",
    content: doc.content || "",
    category: doc.category as NewsCategory,
    author: doc.author || "The Hindu",
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : new Date().toISOString(),
    fetchedAt: doc.fetchedAt ? new Date(doc.fetchedAt).toISOString() : new Date().toISOString(),
    summarizedAt: doc.summarizedAt ? new Date(doc.summarizedAt).toISOString() : null,
    summaryStatus: doc.summaryStatus as SummaryStatus,
    summary: doc.summary || null,
    summaryError: doc.summaryError || null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  };
}

/**
 * Orchestrates full RSS synchronization, article scraping, and Gemini summarization.
 */
export async function syncNews(): Promise<SyncResult> {
  await connectToDatabase();
  console.log("[News Service] Starting RSS synchronization...");

  const feeds = await fetchAllRssFeeds();
  const allRssArticles = [...feeds.technology, ...feeds.business];

  const result: SyncResult = {
    totalFeedsFetched: allRssArticles.length,
    newArticlesFound: 0,
    summariesCompleted: 0,
    summariesFailed: 0,
    details: [],
  };

  if (allRssArticles.length === 0) {
    console.warn("[News Service] No articles retrieved from RSS feeds.");
    return result;
  }

  // 1. Identify which articles are not yet in the database
  const incomingUrls = allRssArticles.map((a) => a.url);
  const existingArticles = await Article.find(
    { sourceUrl: { $in: incomingUrls } },
    { sourceUrl: 1 }
  ).lean();

  const existingUrlSet = new Set(existingArticles.map((a) => a.sourceUrl));
  const newRssArticles = allRssArticles.filter((a) => !existingUrlSet.has(a.url));

  console.log(
    `[News Service] Total fetched: ${allRssArticles.length}, New articles to insert: ${newRssArticles.length}`
  );
  result.newArticlesFound = newRssArticles.length;

  // 2. Extract content and save each new article in 'pending' status.
  // We do NOT call Gemini during RSS sync; summaries are generated on-demand when a user views an article.
  for (const rssItem of newRssArticles) {
    try {
      console.log(`[News Service] Ingesting & extracting content for: ${rssItem.title}`);
      const extracted = await extractArticleContent(rssItem.url, rssItem.description);

      await Article.create({
        source: rssItem.source || "The Hindu",
        sourceUrl: rssItem.url,
        guid: rssItem.guid,
        title: rssItem.title,
        description: rssItem.description,
        content: extracted.content,
        category: rssItem.category,
        author: rssItem.author || rssItem.source || "The Hindu",
        publishedAt: rssItem.publishedAt,
        fetchedAt: new Date(),
        summaryStatus: "pending",
        summary: null,
      });

      result.details.push({
        title: rssItem.title,
        url: rssItem.url,
        category: rssItem.category,
        status: "pending",
      });
    } catch (createErr: unknown) {
      // Handle rare race conditions if duplicate was inserted concurrently
      console.error(`[News Service] Failed to save article ${rssItem.url}:`, createErr);
    }
  }

  console.log(
    `[News Service] Sync completed. Ingested ${result.newArticlesFound} new articles (pending on-demand summary).`
  );
  return result;
}

/**
 * Retrieves paginated articles with optional category and search filters.
 */
export async function getArticles(options: GetArticlesOptions = {}): Promise<NewsListResponse> {
  await connectToDatabase();

  const {
    category = "all",
    page = 1,
    limit = APP_CONFIG.itemsPerPage,
    search = "",
    status,
  } = options;

  const query: Record<string, any> = {};

  if (category && category !== "all") {
    query.category = category;
  }

  if (status) {
    query.summaryStatus = status;
  }

  if (search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { "summary.overview": searchRegex },
      { "summary.headline": searchRegex },
      { "summary.key_takeaways": searchRegex },
      { "summary.what_happened": searchRegex },
    ];
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const [docs, total] = await Promise.all([
    Article.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Article.countDocuments(query),
  ]);

  const articles = docs.map(serializeArticle);
  const totalPages = Math.ceil(total / safeLimit) || 1;

  return {
    articles,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    category,
  };
}

/**
 * Retrieves a single article by MongoDB ID.
 */
export async function getArticleById(id: string): Promise<ArticleDocument | null> {
  await connectToDatabase();

  try {
    const doc = await Article.findById(id).lean();
    if (!doc) {
      return null;
    }
    return serializeArticle(doc);
  } catch {
    return null;
  }
}

/**
 * Summarizes or retries summarization for a specific article.
 */
export async function summarizeArticleById(
  id: string,
  forceRetry: boolean = false
): Promise<{ success: boolean; article?: ArticleDocument; error?: string }> {
  await connectToDatabase();

  const doc = await Article.findById(id);
  if (!doc) {
    return { success: false, error: "Article not found" };
  }

  if (doc.summaryStatus === "completed" && !forceRetry) {
    return { success: true, article: serializeArticle(doc) };
  }

  // Ensure content is present; if empty, re-attempt extraction
  if (!doc.content || doc.content.length < 50) {
    const extracted = await extractArticleContent(doc.sourceUrl, doc.description);
    if (extracted.content) {
      doc.content = extracted.content;
      await doc.save();
    }
  }

  doc.summaryStatus = "processing";
  await doc.save();

  const summaryResult = await generateArticleSummary({
    title: doc.title,
    content: doc.content || doc.description,
    url: doc.sourceUrl,
    category: doc.category as NewsCategory,
  });

  if (summaryResult.success && summaryResult.summary) {
    doc.summaryStatus = "completed";
    doc.summary = summaryResult.summary;
    doc.summarizedAt = new Date();
    doc.summaryError = null;
    await doc.save();

    return { success: true, article: serializeArticle(doc) };
  } else {
    doc.summaryStatus = "failed";
    doc.summaryError = summaryResult.error || "Failed to generate summary";
    await doc.save();

    return {
      success: false,
      error: doc.summaryError,
      article: serializeArticle(doc),
    };
  }
}

/**
 * Retries all failed summaries in the database.
 */
export async function retryFailedSummaries(): Promise<{ retried: number; succeeded: number; failed: number }> {
  await connectToDatabase();

  const failedArticles = await Article.find({ summaryStatus: "failed" }).limit(20);
  let succeeded = 0;
  let failed = 0;

  for (const article of failedArticles) {
    const res = await summarizeArticleById(article._id.toString(), true);
    if (res.success) {
      succeeded++;
    } else {
      failed++;
    }
  }

  return {
    retried: failedArticles.length,
    succeeded,
    failed,
  };
}

/**
 * Returns summary statistics for admin dashboards.
 */
export async function getNewsStats(): Promise<NewsStats> {
  await connectToDatabase();

  const [total, techCount, bizCount, completed, pending, processing, failed, latestArticle] =
    await Promise.all([
      Article.countDocuments(),
      Article.countDocuments({ category: "technology" }),
      Article.countDocuments({ category: "business" }),
      Article.countDocuments({ summaryStatus: "completed" }),
      Article.countDocuments({ summaryStatus: "pending" }),
      Article.countDocuments({ summaryStatus: "processing" }),
      Article.countDocuments({ summaryStatus: "failed" }),
      Article.findOne({}, { fetchedAt: 1 }).sort({ fetchedAt: -1 }).lean(),
    ]);

  return {
    total,
    byCategory: {
      technology: techCount,
      business: bizCount,
    },
    byStatus: {
      completed,
      pending,
      processing,
      failed,
    },
    lastSyncedAt: latestArticle?.fetchedAt
      ? new Date(latestArticle.fetchedAt).toISOString()
      : null,
  };
}
