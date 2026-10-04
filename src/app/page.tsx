import React from "react";
import { getArticles, getNewsStats } from "@/services/news.service";
import { CategoryTabs } from "@/components/CategoryTabs";
import { FeaturedArticle } from "@/components/FeaturedArticle";
import { NewsGrid } from "@/components/NewsGrid";
import { EmptyState } from "@/components/EmptyState";
import { NewsListResponse, NewsStats } from "@/types/news";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page, 10) : 1;
  const search = typeof resolvedParams.search === "string" ? resolvedParams.search : "";

  let articlesData: NewsListResponse = {
    articles: [],
    total: 0,
    page: 1,
    limit: 13,
    totalPages: 1,
    category: "all",
  };

  let stats: NewsStats = {
    total: 0,
    byCategory: { technology: 0, business: 0 },
    byStatus: { completed: 0, pending: 0, processing: 0, failed: 0 },
    lastSyncedAt: null,
  };

  try {
    const [fetchedArticles, fetchedStats] = await Promise.all([
      getArticles({
        category: "all",
        page,
        limit: 13, // 1 featured + 12 grid items
        search,
      }),
      getNewsStats(),
    ]);

    articlesData = fetchedArticles;
    stats = fetchedStats;
  } catch (error) {
    console.error("[Home Page] Error fetching data:", error);
  }

  const hasArticles = articlesData.articles.length > 0;
  // If not searching and on page 1, pull out the first article as Featured
  const isDefaultView = !search && page === 1;
  const featured = isDefaultView && hasArticles ? articlesData.articles[0] : null;
  const gridArticles = isDefaultView && hasArticles
    ? articlesData.articles.slice(1)
    : articlesData.articles;

  return (
    <div className="space-y-12">
      {/* Editorial Hero Header (Section 5) */}
      <section className="space-y-6 pt-4 pb-2 border-b border-[#242424]">
        <div className="flex items-center justify-between text-xs font-mono text-[#666666] tracking-widest uppercase">
          <span>AI NEWS INTELLIGENCE ENGINE</span>
          <span>UPDATED CONTINUOUSLY</span>
        </div>

        <div className="space-y-3 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-none uppercase">
            LATEST INTELLIGENCE
          </h1>
          <p className="text-base sm:text-lg text-[#a3a3a3] leading-relaxed font-normal">
            AI-generated summaries of the latest technology and business reporting from The Hindu.
            Technical specs, market figures, and quotes preserved without noise.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="pt-2 flex items-center justify-between">
          <CategoryTabs
            totalCount={stats.total}
            techCount={stats.byCategory.technology}
            bizCount={stats.byCategory.business}
          />
        </div>
      </section>

      {/* Search notification */}
      {search && (
        <div className="flex items-center justify-between font-mono text-xs text-[#888888] pb-2 border-b border-[#242424]">
          <span>
            SEARCH RESULTS FOR &ldquo;{search.toUpperCase()}&rdquo; &bull; {articlesData.total} STORIES FOUND
          </span>
          <Link href="/" className="text-white hover:underline">
            [ CLEAR SEARCH ]
          </Link>
        </div>
      )}

      {/* Empty State */}
      {!hasArticles && (
        <EmptyState
          title={search ? "NO ARTICLES MATCH SEARCH" : "NO NEWS INGESTED YET"}
          message={
            search
              ? `No articles match "${search}". Try searching for another term.`
              : "Sync the RSS feeds from The Hindu to populate technology and business intelligence."
          }
          actionText={search ? "CLEAR SEARCH" : "REFRESH"}
          actionHref="/"
        />
      )}

      {/* Featured Article (Section 6) */}
      {featured && <FeaturedArticle article={featured} />}

      {/* Latest News Grid (Section 7) */}
      {gridArticles.length > 0 && (
        <NewsGrid
          articles={gridArticles}
          currentPage={articlesData.page}
          totalPages={articlesData.totalPages}
          totalArticles={articlesData.total}
          title={isDefaultView ? "LATEST NEWS" : "STORIES"}
        />
      )}
    </div>
  );
}
