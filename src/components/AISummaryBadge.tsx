interface AISummaryBadgeProps {
  source?: string;
}

export function AISummaryBadge({ source }: AISummaryBadgeProps) {
  const displaySource = source || "The Hindu";

  return (
    <div className="border border-[#242424] bg-[#0a0a0a] p-4 sm:p-5 rounded-none w-full">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white font-semibold mb-1">
        <span>✦</span>
        <span>AI-GENERATED EXECUTIVE SUMMARY</span>
      </div>
      <p className="text-xs text-[#888888] font-sans">
        Synthesizes reporting published by {displaySource}. Extracted context, key entities,
        corporate statements, and data points analyzed with Google Gemini into a structured multi-column intelligence grid.
      </p>
    </div>
  );
}
