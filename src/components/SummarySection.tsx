import React from "react";

interface SummarySectionProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  badge?: string;
}

export function SummarySection({
  label,
  children,
  className = "",
  badge,
}: SummarySectionProps) {
  if (!children) return null;

  return (
    <section
      className={`border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 flex flex-col justify-between hover:border-[#383838] transition-colors ${className}`}
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1f1f1f]">
        <h3 className="font-mono text-xs uppercase tracking-widest text-[#a3a3a3] font-semibold">
          {label}
        </h3>
        {badge && (
          <span className="font-mono text-[10px] text-[#555555] uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <div className="text-sm sm:text-[15px] leading-relaxed text-[#d4d4d4] font-normal flex-1">
        {children}
      </div>
    </section>
  );
}
