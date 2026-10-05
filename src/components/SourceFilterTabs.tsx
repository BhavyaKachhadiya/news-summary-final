"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface SourceFilterTabsProps {
  sources: string[];
  activeSource?: string;
  baseUrl?: string;
}

export function SourceFilterTabs({
  sources,
  activeSource = "all",
  baseUrl = "/",
}: SourceFilterTabsProps) {
  const searchParams = useSearchParams();

  // Helper to build URL preserving existing search query while resetting page to 1
  const createFilterUrl = (sourceName: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("page"); // Reset pagination when switching source

    if (sourceName.toLowerCase() === "all") {
      params.delete("source");
    } else {
      params.set("source", sourceName);
    }

    const queryStr = params.toString();
    return queryStr ? `${baseUrl}?${queryStr}` : baseUrl;
  };

  const isAllActive = !activeSource || activeSource.toLowerCase() === "all";

  return (
    <div className="w-full overflow-x-auto pb-2 pt-1 scrollbar-none">
      <div className="flex items-center gap-2 min-w-max">
        {/* ALL Filter Button */}
        <Link
          href={createFilterUrl("all")}
          className={`font-mono text-xs px-3.5 py-1.5 rounded transition-colors whitespace-nowrap border ${
            isAllActive
              ? "bg-white text-black border-white font-semibold"
              : "bg-transparent text-[#888888] border-[#242424] hover:text-white hover:border-[#444444]"
          }`}
        >
          <span>[ ALL ]</span>
        </Link>

        {/* Dynamic Source Filter Buttons */}
        {sources.map((source) => {
          const isActive =
            !isAllActive &&
            activeSource.trim().toLowerCase() === source.trim().toLowerCase();

          return (
            <Link
              key={source}
              href={createFilterUrl(source)}
              className={`font-mono text-xs px-3.5 py-1.5 rounded transition-colors whitespace-nowrap border ${
                isActive
                  ? "bg-white text-black border-white font-semibold"
                  : "bg-transparent text-[#888888] border-[#242424] hover:text-white hover:border-[#444444]"
              }`}
            >
              <span>[ {source.toUpperCase()} ]</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Backward compatibility alias for any existing imports
export const CategoryTabs = SourceFilterTabs;
