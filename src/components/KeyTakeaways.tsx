import React from "react";

interface KeyTakeawaysProps {
  takeaways: string[];
  className?: string;
}

export function KeyTakeaways({ takeaways, className = "" }: KeyTakeawaysProps) {
  if (!takeaways || takeaways.length === 0) return null;

  return (
    <section
      className={`border border-[#333333] bg-[#0d0d0d] p-5 sm:p-6 flex flex-col hover:border-[#555555] transition-colors ${className}`}
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#242424]">
        <h3 className="font-mono text-xs uppercase tracking-widest text-white font-semibold flex items-center gap-2">
          <span>✦</span>
          <span>KEY TAKEAWAYS</span>
        </h3>
        <span className="font-mono text-[10px] text-[#777777] uppercase">
          {takeaways.length} POINTS
        </span>
      </div>

      <div className="space-y-3.5 flex-1">
        {takeaways.map((takeaway, idx) => {
          const numStr = String(idx + 1).padStart(2, "0");
          return (
            <div key={idx} className="flex items-start gap-3">
              <span className="font-mono text-[11px] font-bold text-white bg-[#1a1a1a] px-1.5 py-0.5 border border-[#333333] shrink-0 select-none">
                {numStr}
              </span>
              <p className="text-xs sm:text-sm leading-relaxed text-[#f0f0f0] font-normal pt-0.5">
                {takeaway}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
