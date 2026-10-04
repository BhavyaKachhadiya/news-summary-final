import React from "react";
import type { Metadata } from "next";
import { getArticles, getNewsStats } from "@/services/news.service";
import { CategoryTabs } from "@/components/CategoryTabs";
import { NewsGrid } from "@/components/NewsGrid";
import { EmptyState } from "@/components/EmptyState";
import { NewsListResponse, NewsStats } from "@/types/news";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Business & Markets",
  description:
    "Business, financial markets, and economic developments from The Hindu, explained clearly by AI. RBI policies, corporate financials, SEBI regulations, and macroeconomic data.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BusinessPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page, 10) : 1;
  const search = typeof resolvedParams.search === "string" ? resolvedParams.search : "";

  let articlesData: NewsListResponse = {
    articles: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    category: "business",
  };

  let stats: NewsStats = {
    total: 0,
    byCategory: { technology: 0, business: 0 },
    byStatus: { completed: 0, pending: 0, processing: 0, failed: 0 },
  };

  try {
    const [fetchedArticles, fetchedStats] = await Promise.all([
      getArticles({
        category: "business",
        page,
        limit: 12,
        search,
      }),
      getNewsStats(),
    ]);

    articlesData = fetchedArticles;
    stats = fetchedStats;
  } catch (error) {
    console.error("[Business Page] Error loading articles:", error);
  }

  return (
    <div className="space-y-12">
      {/* Editorial Category Header (Section 19) */}
      <section className="space-y-4 pt-4 pb-2 border-b border-[#242424]">
        <div className="text-xs font-mono text-[#666666] tracking-widest uppercase">
          SECTION / BUSINESS &amp; MARKETS
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight uppercase leading-none">
          BUSINESS
        </h1>

        <p className="text-base sm:text-lg text-[#a3a3a3] max-w-2xl leading-relaxed font-normal">
          Business, markets, and economic developments from The Hindu explained clearly.
          Balance sheets, RBI interest rate decisions, SEBI regulations, inflation, and GDP figures.
        </p>

        {/* Category Tabs */}
        <div className="pt-2">
          <CategoryTabs
            totalCount={stats.total}
            techCount={stats.byCategory.technology}
            bizCount={stats.byCategory.business}
          />
        </div>
      </section>

      {/* Grid or Empty */}
      {articlesData.articles.length === 0 ? (
        <EmptyState
          title="NO BUSINESS STORIES FOUND"
          message="No articles matching your criteria in the business section."
          actionText="VIEW ALL STORIES"
          actionHref="/"
        />
      ) : (
        <NewsGrid
          articles={articlesData.articles}
          currentPage={articlesData.page}
          totalPages={articlesData.totalPages}
          totalArticles={articlesData.total}
          title="BUSINESS &amp; FINANCIAL INTELLIGENCE"
        />
      )}
    </div>
  );
}
