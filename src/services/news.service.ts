import pLimit from "p-limit";
import { connectToDatabase } from "@/lib/mongodb";
import { Article, ArticleModelFields, ArticleModelDocument } from "@/models/Article";
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
import { logger } from "@/lib/logging/logger";

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
 * Escapes regex special characters to prevent ReDoS or regex injection attacks.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Type-safe serialization of Mongoose documents / lean objects into ArticleDocument.
 */
function serializeArticle(
  doc: ArticleModelDocument | (ArticleModelFields & { _id: unknown })
): ArticleDocument {
  const d = doc as unknown as Record<string, unknown>;
  const rawId = d._id;
  const idStr =
    typeof rawId === "object" && rawId !== null && "toString" in rawId
      ? (rawId as { toString(): string }).toString()
      : String(rawId);

  return {
    _id: idStr,
    source: typeof d.source === "string" ? d.source : "The Hindu",
    sourceUrl: typeof d.sourceUrl === "string" ? d.sourceUrl : "",
    guid: typeof d.guid === "string" ? d.guid : null,
    title: typeof d.title === "string" ? d.title : "",
    description: typeof d.description === "string" ? d.description : "",
    content: typeof d.content === "string" ? d.content : "",
    category: (d.category as NewsCategory) || "technology",
    author: typeof d.author === "string" ? d.author : "The Hindu",
    publishedAt:
      d.publishedAt instanceof Date
        ? d.publishedAt.toISOString()
        : typeof d.publishedAt === "string"
        ? d.publishedAt
        : new Date().toISOString(),
    fetchedAt:
      d.fetchedAt instanceof Date
        ? d.fetchedAt.toISOString()
        : typeof d.fetchedAt === "string"
        ? d.fetchedAt
        : new Date().toISOString(),
    summarizedAt:
      d.summarizedAt instanceof Date
        ? d.summarizedAt.toISOString()
        : typeof d.summarizedAt === "string"
        ? d.summarizedAt
        : null,
    summaryStatus: (d.summaryStatus as SummaryStatus) || "pending",
    summaryStartedAt:
      d.summaryStartedAt instanceof Date
        ? d.summaryStartedAt.toISOString()
        : typeof d.summaryStartedAt === "string"
        ? d.summaryStartedAt
        : null,
    retryCount: typeof d.retryCount === "number" ? d.retryCount : 0,
    summary: (d.summary as ArticleDocument["summary"]) || null,
    summaryError: typeof d.summaryError === "string" ? d.summaryError : null,
    createdAt:
      d.createdAt instanceof Date
        ? d.createdAt.toISOString()
        : typeof d.createdAt === "string"
        ? d.createdAt
        : new Date().toISOString(),
    updatedAt:
      d.updatedAt instanceof Date
        ? d.updatedAt.toISOString()
        : typeof d.updatedAt === "string"
        ? d.updatedAt
        : new Date().toISOString(),
  };
}

/**
 * Recovers articles stuck in 'processing' state past staleProcessingTimeoutMs.
 */
export async function recoverStaleProcessingJobs(): Promise<number> {
  await connectToDatabase();
  const cutoff = new Date(Date.now() - APP_CONFIG.staleProcessingTimeoutMs);

  const res = await Article.updateMany(
    {
      summaryStatus: "processing",
      summaryStartedAt: { $lt: cutoff },
    },
    {
      $set: {
        summaryStatus: "pending",
        summaryError: "Processing timed out or crashed; automatically reset to pending.",
        summaryStartedAt: null,
      },
    }
  );

  if (res.modifiedCount > 0) {
    logger.warn("NewsService", `Reset ${res.modifiedCount} stale processing jobs back to pending.`);
  }

  return res.modifiedCount;
}

/**
 * Orchestrates full RSS synchronization with concurrent extraction and deduplication.
 */
export async function syncNews(): Promise<SyncResult> {
  await connectToDatabase();
  logger.info("NewsService", "Starting RSS synchronization...");

  // Recover any stale processing jobs before starting sync
  await recoverStaleProcessingJobs();

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
    logger.warn("NewsService", "No articles retrieved from RSS feeds.");
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

  logger.info(
    "NewsService",
    `Total fetched: ${allRssArticles.length}, New articles to insert: ${newRssArticles.length}`
  );
  result.newArticlesFound = newRssArticles.length;

  // 2. Concurrently extract content using p-limit
  const extractionQueue = pLimit(APP_CONFIG.maxConcurrentExtraction);

  const extractionPromises = newRssArticles.map((rssItem) =>
    extractionQueue(async () => {
      try {
        logger.info("NewsService", `Ingesting & extracting: ${rssItem.title}`);
        const extracted = await extractArticleContent(rssItem.url, rssItem.description);

        // Atomic upsert by sourceUrl to eliminate race conditions
        const articleData: ArticleModelFields = {
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
          summarizedAt: null,
          summaryStatus: "pending",
          summaryStartedAt: null,
          retryCount: 0,
          summary: null,
          summaryError: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await Article.findOneAndUpdate(
          { sourceUrl: rssItem.url },
          { $setOnInsert: articleData },
          { upsert: true, new: true }
        );

        result.details.push({
          title: rssItem.title,
          url: rssItem.url,
          category: rssItem.category,
          status: "pending",
        });
      } catch (createErr: unknown) {
        logger.error("NewsService", `Failed to save article ${rssItem.url}`, createErr);
      }
    })
  );

  await Promise.allSettled(extractionPromises);

  logger.info(
    "NewsService",
    `Sync completed. Ingested ${result.newArticlesFound} new articles (pending on-demand summary).`
  );
  return result;
}

export interface TypedArticleQuery {
  category?: NewsCategory;
  summaryStatus?: SummaryStatus | { $in: string[] };
  $or?: Array<Record<string, unknown>>;
  _id?: unknown;
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

  const query: TypedArticleQuery = {};

  if (category && category !== "all") {
    query.category = category;
  }

  if (status) {
    query.summaryStatus = status;
  }

  if (search.trim()) {
    const escaped = escapeRegex(search.trim());
    const searchRegex = new RegExp(escaped, "i");
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
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  // Typecast query safely through unknown to Mongoose find filter
  const filterArg = query as unknown as Parameters<typeof Article.find>[0];

  const [docs, total] = await Promise.all([
    Article.find(filterArg)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Article.countDocuments(filterArg),
  ]);

  const articles = docs.map((d) => serializeArticle(d as ArticleModelFields & { _id: unknown }));
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
    return serializeArticle(doc as ArticleModelFields & { _id: unknown });
  } catch {
    return null;
  }
}

/**
 * Deletes a single article by MongoDB ID (Admin functionality).
 */
export async function deleteArticleById(id: string): Promise<boolean> {
  await connectToDatabase();
  const res = await Article.findByIdAndDelete(id);
  return !!res;
}

/**
 * Summarizes or retries summarization for a specific article.
 * Uses atomic MongoDB status transitions to guarantee that 2 simultaneous requests
 * CANNOT trigger two Gemini calls.
 */
export async function summarizeArticleById(
  id: string,
  forceRetry: boolean = false
): Promise<{ success: boolean; article?: ArticleDocument; error?: string }> {
  await connectToDatabase();

  // First, check current state
  const existing = await Article.findById(id);
  if (!existing) {
    return { success: false, error: "Article not found" };
  }

  if (existing.summaryStatus === "completed" && !forceRetry) {
    return { success: true, article: serializeArticle(existing as ArticleModelDocument) };
  }

  // Prevent unlimited retries (max 5 retries)
  if (existing.retryCount && existing.retryCount >= 5 && !forceRetry) {
    return {
      success: false,
      error: "Maximum retry limit reached for this article",
      article: serializeArticle(existing as ArticleModelDocument),
    };
  }

  // Check if stuck in processing past cutoff
  const staleCutoff = new Date(Date.now() - APP_CONFIG.staleProcessingTimeoutMs);
  const isStaleProcessing =
    existing.summaryStatus === "processing" &&
    existing.summaryStartedAt &&
    new Date(existing.summaryStartedAt) < staleCutoff;

  // ATOMIC LOCK: Transition from 'pending' | 'failed' (or stale 'processing' or forceRetry) -> 'processing'
  const allowedStatuses: string[] = ["pending", "failed"];
  if (isStaleProcessing || forceRetry) {
    allowedStatuses.push("processing");
  }
  if (forceRetry) {
    allowedStatuses.push("completed");
  }

  const now = new Date();
  const lockQuery = {
    _id: id,
    summaryStatus: { $in: allowedStatuses },
  } as unknown as Parameters<typeof Article.findOneAndUpdate>[0];

  const lockUpdate = {
    $set: {
      summaryStatus: "processing",
      summaryStartedAt: now,
    },
    $inc: { retryCount: 1 },
  } as unknown as Parameters<typeof Article.findOneAndUpdate>[1];

  const lockedDoc = (await Article.findOneAndUpdate(
    lockQuery,
    lockUpdate,
    { new: true }
  )) as ArticleModelDocument | null;

  // If another request grabbed the lock first, wait/return current article
  if (!lockedDoc) {
    logger.info("NewsService", `Article ${id} is already being processed by another worker.`);
    const currentDoc = await Article.findById(id);
    return {
      success: currentDoc?.summaryStatus === "completed",
      article: currentDoc ? serializeArticle(currentDoc as ArticleModelDocument) : undefined,
      error:
        currentDoc?.summaryStatus === "processing"
          ? "Article summary is currently processing"
          : currentDoc?.summaryError || "Concurrent processing lock in place",
    };
  }

  // Ensure content is present; if empty, re-attempt extraction
  if (!lockedDoc.content || lockedDoc.content.length < 50) {
    const extracted = await extractArticleContent(lockedDoc.sourceUrl, lockedDoc.description);
    if (extracted.content) {
      lockedDoc.content = extracted.content;
      await lockedDoc.save();
    }
  }

  try {
    const summaryResult = await generateArticleSummary({
      title: lockedDoc.title,
      content: lockedDoc.content || lockedDoc.description,
      url: lockedDoc.sourceUrl,
      category: lockedDoc.category as NewsCategory,
    });

    if (summaryResult.success && summaryResult.summary) {
      const updated = await Article.findByIdAndUpdate(
        id,
        {
          $set: {
            summaryStatus: "completed",
            summary: summaryResult.summary,
            summarizedAt: new Date(),
            summaryError: null,
          },
        },
        { new: true }
      );

      return {
        success: true,
        article: updated ? serializeArticle(updated as ArticleModelDocument) : undefined,
      };
    } else {
      const errMessage = summaryResult.error || "Failed to generate summary";
      const updated = await Article.findByIdAndUpdate(
        id,
        {
          $set: {
            summaryStatus: "failed",
            summaryError: errMessage,
          },
        },
        { new: true }
      );

      return {
        success: false,
        error: errMessage,
        article: updated ? serializeArticle(updated as ArticleModelDocument) : undefined,
      };
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const updated = await Article.findByIdAndUpdate(
      id,
      {
        $set: {
          summaryStatus: "failed",
          summaryError: errMsg,
        },
      },
      { new: true }
    );

    return {
      success: false,
      error: errMsg,
      article: updated ? serializeArticle(updated as ArticleModelDocument) : undefined,
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
