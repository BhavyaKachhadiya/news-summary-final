import React from "react";

export function AISummarySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch animate-pulse">
      {/* Row 1: Overview Skeleton (Spans 2 columns) */}
      <div className="border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 md:col-span-2 lg:col-span-2 flex flex-col justify-between space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2 font-mono text-xs text-[#666666] uppercase tracking-wider font-semibold">
            <span>OVERVIEW</span>
          </div>
          <span className="font-mono text-[10px] text-[#444444] uppercase tracking-wider">
            EXECUTIVE SYNTHESIS
          </span>
        </div>

        {/* 3-4 Paragraphs of Shimmer Lines */}
        <div className="space-y-5 flex-1">
          {/* Paragraph 1 */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-[#222222] rounded-xs" />
            <div className="h-4 w-[96%] bg-[#222222] rounded-xs" />
            <div className="h-4 w-[85%] bg-[#222222] rounded-xs" />
          </div>
          {/* Paragraph 2 */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-[#1c1c1c] rounded-xs" />
            <div className="h-4 w-[92%] bg-[#1c1c1c] rounded-xs" />
            <div className="h-4 w-[75%] bg-[#1c1c1c] rounded-xs" />
          </div>
          {/* Paragraph 3 */}
          <div className="space-y-2">
            <div className="h-4 w-[98%] bg-[#1a1a1a] rounded-xs" />
            <div className="h-4 w-[80%] bg-[#1a1a1a] rounded-xs" />
          </div>
        </div>
      </div>

      {/* Row 1: Key Takeaways Skeleton (1 column) */}
      <div className="border border-[#333333] bg-[#0d0d0d] p-5 sm:p-6 col-span-1 flex flex-col justify-between space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
          <span className="font-mono text-xs text-white uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <span>✦</span>
            <span>KEY TAKEAWAYS</span>
          </span>
          <span className="font-mono text-[10px] text-[#555555] uppercase">
            6 POINTS
          </span>
        </div>

        <div className="space-y-3.5 flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="font-mono text-[11px] font-bold text-[#666666] bg-[#1a1a1a] px-1.5 py-0.5 border border-[#2a2a2a] shrink-0 select-none">
                {String(i).padStart(2, "0")}
              </span>
              <div className="space-y-1.5 flex-1 pt-0.5">
                <div className="h-3 w-full bg-[#202020] rounded-xs" />
                <div className="h-3 w-4/5 bg-[#181818] rounded-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Background Skeleton */}
      <div className="border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 col-span-1 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
          <span className="font-mono text-xs text-[#666666] uppercase tracking-wider font-semibold">
            BACKGROUND
          </span>
          <span className="font-mono text-[10px] text-[#444444] uppercase">CONTEXT</span>
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-[94%] bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-[88%] bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-[70%] bg-[#1c1c1c] rounded-xs" />
        </div>
      </div>

      {/* Row 2: What Happened Skeleton */}
      <div className="border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 col-span-1 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
          <span className="font-mono text-xs text-[#666666] uppercase tracking-wider font-semibold">
            WHAT HAPPENED
          </span>
          <span className="font-mono text-[10px] text-[#444444] uppercase">CHRONOLOGY</span>
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-[96%] bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-[82%] bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-[65%] bg-[#1c1c1c] rounded-xs" />
        </div>
      </div>

      {/* Row 2: Details / Specifics Skeleton */}
      <div className="border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 col-span-1 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
          <span className="font-mono text-xs text-[#666666] uppercase tracking-wider font-semibold">
            DETAILS
          </span>
          <span className="font-mono text-[10px] text-[#444444] uppercase">SPECIFICS</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="font-mono text-xs text-[#555555] shrink-0 pt-0.5">&bull;</span>
              <div className="h-3.5 w-5/6 bg-[#1c1c1c] rounded-xs mt-0.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Financial / Tech Architecture Skeleton */}
      <div className="border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 col-span-1 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
          <span className="font-mono text-xs text-[#666666] uppercase tracking-wider font-semibold">
            METRICS &amp; DATA
          </span>
          <span className="font-mono text-[10px] text-[#444444] uppercase">DATA</span>
        </div>
        <div className="space-y-2.5 divide-y divide-[#161616]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="pt-2 flex justify-between items-center">
              <div className="h-3 w-24 bg-[#1c1c1c] rounded-xs" />
              <div className="h-3.5 w-16 bg-[#282828] rounded-xs" />
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Market Context / Impact Skeleton */}
      <div className="border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 col-span-1 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
          <span className="font-mono text-xs text-[#666666] uppercase tracking-wider font-semibold">
            MARKET IMPACT
          </span>
          <span className="font-mono text-[10px] text-[#444444] uppercase">ANALYSIS</span>
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-4/5 bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-3/4 bg-[#1c1c1c] rounded-xs" />
        </div>
      </div>

      {/* Row 3: Entities / Organizations Skeleton */}
      <div className="border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 col-span-1 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
          <span className="font-mono text-xs text-[#666666] uppercase tracking-wider font-semibold">
            ORGANIZATIONS
          </span>
          <span className="font-mono text-[10px] text-[#444444] uppercase">ENTITIES</span>
        </div>
        <div className="space-y-2.5">
          {[1, 2].map((i) => (
            <div key={i} className="border border-[#1a1a1a] bg-[#111111] p-2.5 space-y-1.5">
              <div className="h-3 w-24 bg-[#262626] rounded-xs" />
              <div className="h-2.5 w-4/5 bg-[#1a1a1a] rounded-xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
