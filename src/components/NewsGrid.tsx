"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArticleDocument } from "@/types/news";
import { NewsCard } from "./NewsCard";

interface NewsGridProps {
  articles: ArticleDocument[];
  currentPage: number;
  totalPages: number;
  totalArticles: number;
  title?: string;
}

export function NewsGrid({
  articles,
  currentPage,
  totalPages,
  totalArticles,
  title = "LATEST NEWS",
}: NewsGridProps) {
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
      <div className="border border-[#242424] bg-[#0a0a0a] p-12 text-center my-8">
        <h3 className="font-mono text-sm uppercase text-white mb-2 tracking-wider">
          NO NEWS FOUND
        </h3>
        <p className="text-xs text-[#666666] max-w-sm mx-auto">
          There are no articles matching your query.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {title && (
        <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[#888888]">
            {title}
          </h2>
          <span className="font-mono text-[11px] text-[#666666]">
            {totalArticles} STORIES
          </span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((article) => (
          <NewsCard key={article._id} article={article} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-[#242424] font-mono text-xs">
          <span className="text-[#666666]">
            PAGE {currentPage} OF {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 border border-[#242424] bg-[#0a0a0a] text-[#a3a3a3] hover:text-white hover:border-[#444444] disabled:opacity-30 disabled:pointer-events-none transition-colors uppercase"
            >
              &larr; PREVIOUS
            </button>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 border border-[#242424] bg-[#0a0a0a] text-[#a3a3a3] hover:text-white hover:border-[#444444] disabled:opacity-30 disabled:pointer-events-none transition-colors uppercase"
            >
              NEXT &rarr;
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
