import React from "react";
import { FinancialMetricItem } from "@/types/news";

interface FinancialDetailsProps {
  details: FinancialMetricItem[];
  className?: string;
}

export function FinancialDetails({
  details,
  className = "",
}: FinancialDetailsProps) {
  if (!details || details.length === 0) return null;

  return (
    <section
      className={`border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 flex flex-col hover:border-[#383838] transition-colors ${className}`}
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1f1f1f]">
        <h3 className="font-mono text-xs uppercase tracking-widest text-[#a3a3a3] font-semibold">
          FINANCIAL METRICS
        </h3>
        <span className="font-mono text-[10px] text-[#555555] uppercase">
          {details.length} METRICS
        </span>
      </div>

      <div className="divide-y divide-[#1e1e1e] flex-1">
        {details.map((item, idx) => (
          <div key={idx} className="py-2.5 space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#888888]">
                {item.metric}
              </span>
              <span className="font-mono text-sm font-bold text-white tracking-tight">
                {item.value}
              </span>
            </div>
            {item.context && (
              <p className="text-[11px] text-[#666666] leading-tight">
                {item.context}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
