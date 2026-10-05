import React from "react";
import type { Metadata } from "next";
import { getArticles, getNewsStats } from "@/services/news.service";
import { SourceFilterTabs } from "@/components/SourceFilterTabs";
import { NewsGrid } from "@/components/NewsGrid";
import { EmptyState } from "@/components/EmptyState";
import { NewsListResponse, NewsStats } from "@/types/news";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Technology",
  description:
    "Latest technology news synthesized and explained clearly by AI. Hardware, software, AI breakthroughs, and cybersecurity from top global and Indian publishers.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TechnologyPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page, 10) : 1;
  const search = typeof resolvedParams.search === "string" ? resolvedParams.search : "";
  const source = typeof resolvedParams.source === "string" ? resolvedParams.source : "all";

  let articlesData: NewsListResponse = {
    articles: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    category: "technology",
  };

  let stats: NewsStats = {
    total: 0,
    byCategory: { technology: 0, business: 0 },
    byStatus: { completed: 0, pending: 0, processing: 0, failed: 0 },
  };

  try {
    const [fetchedArticles, fetchedStats] = await Promise.all([
      getArticles({
        category: "technology",
        source,
        page,
        limit: 12,
        search,
      }),
      getNewsStats(),
    ]);

    articlesData = fetchedArticles;
    stats = fetchedStats;
  } catch (error) {
    console.error("[Technology Page] Error loading articles:", error);
  }

  const availableSources = articlesData.sources || stats.sources || [];

  return (
    <div className="space-y-12">
      {/* Editorial Category Header (Section 19) */}
      <section className="space-y-4 pt-4 pb-2 border-b border-[#242424]">
        <div className="text-xs font-mono text-[#666666] tracking-widest uppercase">
          SECTION / TECHNOLOGY
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight uppercase leading-none">
          TECHNOLOGY
        </h1>

        <p className="text-base sm:text-lg text-[#a3a3a3] max-w-2xl leading-relaxed font-normal">
          Latest technology reporting explained clearly by AI.
          Hardware launches, models, cybersecurity, chips, and digital policy.
        </p>

        {/* Source Filter Tabs */}
        <div className="pt-2">
          <SourceFilterTabs
            sources={availableSources}
            activeSource={source}
            baseUrl="/technology"
          />
        </div>
      </section>

      {/* Grid or Empty */}
      {articlesData.articles.length === 0 ? (
        <EmptyState
          title="NO TECHNOLOGY STORIES FOUND"
          message="No articles matching your criteria in the technology section."
          actionText="VIEW ALL STORIES"
          actionHref="/"
        />
      ) : (
        <NewsGrid
          articles={articlesData.articles}
          currentPage={articlesData.page}
          totalPages={articlesData.totalPages}
          totalArticles={articlesData.total}
          title="TECHNOLOGY INTELLIGENCE"
        />
      )}
    </div>
  );
}
