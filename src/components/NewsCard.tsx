import React from "react";
import Link from "next/link";
import { ArticleDocument } from "@/types/news";

interface NewsCardProps {
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

export function NewsCard({ article }: NewsCardProps) {
  const headline = article.summary?.headline || article.title;
  const overview =
    article.summary?.overview ||
    article.description ||
    article.content?.slice(0, 160) ||
    "Click to read report and synthesize AI summary.";
  const timeAgo = formatRelativeTime(article.publishedAt);
  const keyTakeaway = article.summary?.key_takeaways?.[0];

  return (
    <article className="border border-[#242424] bg-[#0a0a0a] hover:border-[#404040] hover:bg-[#111111] transition-all p-6 flex flex-col justify-between group">
      <div>
        {/* Category & Time */}
        <div className="flex items-center justify-between text-[11px] font-mono mb-4 text-[#888888]">
          <span className="uppercase tracking-widest text-[#a3a3a3] font-medium">
            {article.category}
          </span>
          <span className="text-[#666666]">{timeAgo}</span>
        </div>

        {/* Headline */}
        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#e0e0e0] leading-snug tracking-tight mb-3 line-clamp-2">
          <Link href={`/article/${article._id}`} className="hover:underline">
            {headline}
          </Link>
        </h3>

        {/* AI Overview / Context */}
        <p className="text-xs text-[#a3a3a3] leading-relaxed line-clamp-3 mb-4 font-normal">
          {overview}
        </p>

        {/* Key Takeaway snippet if present */}
        {keyTakeaway && (
          <div className="pt-3 border-t border-[#1f1f1f] mb-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] block mb-1">
              KEY TAKEAWAY
            </span>
            <p className="text-xs text-[#cccccc] line-clamp-2 leading-relaxed font-sans">
              {keyTakeaway}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-4 border-t border-[#1f1f1f] flex items-center justify-between text-xs font-mono mt-auto">
        <span className="text-[11px] text-[#666666] uppercase">{article.source || "THE HINDU"}</span>

        <Link
          href={`/article/${article._id}`}
          className="inline-flex items-center gap-1.5 text-white hover:text-[#a3a3a3] font-medium uppercase tracking-wider transition-colors"
        >
          <span>READ SUMMARY</span>
          <span>&rarr;</span>
        </Link>
      </div>
    </article>
  );
}
