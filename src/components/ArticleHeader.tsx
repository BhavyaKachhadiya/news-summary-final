import React from "react";

interface ArticleHeaderProps {
  category: string;
  publishedAt: Date | string;
  headline: string;
  author?: string;
  source?: string;
}

function formatRelativeTime(dateInput: Date | string): string {
  try {
    const date = new Date(dateInput);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "JUST NOW";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} HOURS AGO`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} HOURS AGO`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} DAYS AGO`;

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).toUpperCase();
  } catch {
    return "RECENT";
  }
}

export function ArticleHeader({
  category,
  publishedAt,
  headline,
  author,
  source,
}: ArticleHeaderProps) {
  const timeAgo = formatRelativeTime(publishedAt);
  const formattedDate = new Date(publishedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="space-y-6 pb-8 border-b border-[#242424]">
      {/* Top Category & Time */}
      <div className="flex items-center justify-between text-xs font-mono text-[#888888] uppercase tracking-widest">
        <span className="text-white font-semibold">{category}</span>
        <span className="text-[#666666]">{timeAgo}</span>
      </div>

      {/* Editorial Headline */}
      <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-bold tracking-tight text-white leading-tight max-w-4xl">
        {headline}
      </h1>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#888888] uppercase tracking-wider pt-2">
        <span className="text-white font-medium">
          {source ? source.toUpperCase() : "THE HINDU"}
        </span>
        <span className="text-[#444444]">/</span>
        <span>PUBLISHED {formattedDate.toUpperCase()}</span>
        {author && (
          <>
            <span className="text-[#444444]">/</span>
            <span>REPORTED BY {author.toUpperCase()}</span>
          </>
        )}
      </div>
    </header>
  );
}
