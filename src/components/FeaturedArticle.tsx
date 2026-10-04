import React from "react";
import Link from "next/link";
import { ArticleDocument } from "@/types/news";

interface FeaturedArticleProps {
  article: ArticleDocument;
}

function formatRelativeTime(dateInput: Date | string): string {
  try {
    const date = new Date(dateInput);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "JUST NOW";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}M AGO`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}H AGO`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}D AGO`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }).toUpperCase();
  } catch {
    return "RECENT";
  }
}

export function FeaturedArticle({ article }: FeaturedArticleProps) {
  const headline = article.summary?.headline || article.title;
  const overview =
    article.summary?.overview ||
    article.description ||
    article.content?.slice(0, 240) ||
    "Click to read the complete article report and detailed AI analysis.";
  const timeAgo = formatRelativeTime(article.publishedAt);

  return (
    <article className="border border-[#242424] bg-[#0a0a0a] hover:border-[#404040] transition-colors p-8 sm:p-10 rounded-none relative">
      {/* Top Header Row */}
      <div className="flex items-center justify-between text-xs font-mono text-[#888888] tracking-widest uppercase mb-6">
        <span className="text-white font-semibold tracking-wider">
          {article.category}
        </span>
        <span className="text-[#666666]">{timeAgo}</span>
      </div>

      {/* Balanced Headline */}
      <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-white leading-[1.22] mb-5 max-w-4xl">
        <Link href={`/article/${article._id}`} className="hover:text-[#cccccc] transition-colors">
          {headline}
        </Link>
      </h2>

      {/* Excerpt / Overview */}
      <p className="text-sm sm:text-[15px] text-[#a3a3a3] leading-relaxed max-w-3xl mb-6 font-normal line-clamp-3">
        {overview}
      </p>

      {/* Hairline Divider */}
      <div className="border-t border-[#242424] pt-5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3 text-[#666666] uppercase">
          <span className="text-[#888888] font-medium">{article.source?.toUpperCase() || "THE HINDU"}</span>
          <span>/</span>
          <span>{article.author || "EDITORIAL"}</span>
        </div>

        <Link
          href={`/article/${article._id}`}
          className="inline-flex items-center gap-2 text-white hover:text-[#a3a3a3] font-semibold transition-colors uppercase tracking-wider"
        >
          <span>READ SUMMARY</span>
          <span>&rarr;</span>
        </Link>
      </div>
    </article>
  );
}
