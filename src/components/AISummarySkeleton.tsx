import React from "react";

export function AISummarySkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-pulse">
      {/* Row 1: Overview (8 cols) & Key Takeaways (4 cols) */}
      <div className="border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 lg:col-span-8 flex flex-col justify-between space-y-6">
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
          <div className="space-y-2">
            <div className="h-4 w-full bg-[#222222] rounded-xs" />
            <div className="h-4 w-[96%] bg-[#222222] rounded-xs" />
            <div className="h-4 w-[85%] bg-[#222222] rounded-xs" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-[#1c1c1c] rounded-xs" />
            <div className="h-4 w-[92%] bg-[#1c1c1c] rounded-xs" />
            <div className="h-4 w-[75%] bg-[#1c1c1c] rounded-xs" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-[98%] bg-[#1a1a1a] rounded-xs" />
            <div className="h-4 w-[80%] bg-[#1a1a1a] rounded-xs" />
          </div>
        </div>
      </div>

      {/* Row 1: Key Takeaways (4 cols) */}
      <div className="border border-[#333333] bg-[#0d0d0d] p-5 sm:p-6 lg:col-span-4 flex flex-col justify-between space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
          <span className="font-mono text-xs text-white uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <span>✦</span>
            <span>KEY TAKEAWAYS</span>
          </span>
          <span className="font-mono text-[10px] text-[#555555] uppercase">
            POINTS
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

      {/* Row 2: What Happened (7 cols - Wide Chronology) & Background (5 cols - Context Sidebar) */}
      <div className="border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
          <span className="font-mono text-xs text-[#666666] uppercase tracking-wider font-semibold">
            WHAT HAPPENED
          </span>
          <span className="font-mono text-[10px] text-[#444444] uppercase">CHRONOLOGY</span>
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-[96%] bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-[84%] bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-[70%] bg-[#1c1c1c] rounded-xs" />
        </div>
      </div>

      <div className="border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
          <span className="font-mono text-xs text-[#666666] uppercase tracking-wider font-semibold">
            BACKGROUND
          </span>
          <span className="font-mono text-[10px] text-[#444444] uppercase">CONTEXT</span>
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-[92%] bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-[85%] bg-[#1c1c1c] rounded-xs" />
        </div>
      </div>

      {/* Row 3: Conceptual Depth (7 cols) & Specifics / Data (5 cols) */}
      <div className="border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
          <span className="font-mono text-xs text-[#666666] uppercase tracking-wider font-semibold">
            CONCEPTUAL DEPTH &amp; ARCHITECTURE
          </span>
          <span className="font-mono text-[10px] text-[#444444] uppercase">EXPLANATION</span>
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-[94%] bg-[#1c1c1c] rounded-xs" />
          <div className="h-3.5 w-[80%] bg-[#1c1c1c] rounded-xs" />
        </div>
      </div>

      <div className="border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
          <span className="font-mono text-xs text-[#666666] uppercase tracking-wider font-semibold">
            KEY DETAILS
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

      {/* Row 4: Strategic Impact & Significance (1 Column Full Width - Feature Section) */}
      <div className="border border-[#333333] bg-[#0c0c0c] p-6 lg:col-span-12 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
          <span className="font-mono text-xs text-white uppercase tracking-wider font-semibold">
            IMPACT &amp; SIGNIFICANCE
          </span>
          <span className="font-mono text-[10px] text-[#777777] uppercase">STRATEGIC ANALYSIS</span>
        </div>
        <div className="space-y-2.5">
          <div className="h-4 w-full bg-[#202020] rounded-xs" />
          <div className="h-4 w-[95%] bg-[#202020] rounded-xs" />
          <div className="h-4 w-[85%] bg-[#1c1c1c] rounded-xs" />
        </div>
      </div>

      {/* Row 5: Balanced 2-Column Split (6 cols + 6 cols) */}
      <div className="border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 lg:col-span-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
          <span className="font-mono text-xs text-[#666666] uppercase tracking-wider font-semibold">
            ENTITIES &amp; ACTORS
          </span>
          <span className="font-mono text-[10px] text-[#444444] uppercase">NETWORK</span>
        </div>
        <div className="space-y-2.5">
          {[1, 2].map((i) => (
            <div key={i} className="border border-[#1a1a1a] bg-[#111111] p-2.5 space-y-1.5">
              <div className="h-3 w-28 bg-[#262626] rounded-xs" />
              <div className="h-2.5 w-3/4 bg-[#1a1a1a] rounded-xs" />
            </div>
          ))}
        </div>
      </div>

      <div className="border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 lg:col-span-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
          <span className="font-mono text-xs text-[#666666] uppercase tracking-wider font-semibold">
            FORWARD OUTLOOK
          </span>
          <span className="font-mono text-[10px] text-[#444444] uppercase">DEVELOPMENTS</span>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="font-mono text-xs text-[#555555] shrink-0 pt-0.5">&bull;</span>
              <div className="h-3.5 w-4/5 bg-[#1c1c1c] rounded-xs mt-0.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
