"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArticleDocument } from "@/types/news";
import { NewsCard } from "./NewsCard";
import { ChevronLeft, ChevronRight, Newspaper } from "lucide-react";

interface NewsListProps {
  articles: ArticleDocument[];
  currentPage: number;
  totalPages: number;
  totalArticles: number;
}

export function NewsList({
  articles,
  currentPage,
  totalPages,
  totalArticles,
}: NewsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (articles.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center max-w-xl mx-auto my-12 border border-slate-800">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center mb-4">
          <Newspaper className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-200 mb-2">No Articles Found</h3>
        <p className="text-xs text-slate-400 mb-6">
          No news articles match your current criteria. Try adjusting your search query,
          switching categories, or triggering an RSS synchronization.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Grid of news cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <NewsCard key={article._id} article={article} />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Showing page <strong className="text-slate-200">{currentPage}</strong> of{" "}
            <strong className="text-slate-200">{totalPages}</strong> ({totalArticles} total articles)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-cyan-400">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
