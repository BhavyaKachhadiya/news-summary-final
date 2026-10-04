import React from "react";

interface SourceLinkProps {
  url: string;
  sourceName?: string;
}

export function SourceLink({ url, sourceName }: SourceLinkProps) {
  const displaySource = sourceName || "The Hindu";

  return (
    <section className="pt-8 border-t border-[#242424] w-full">
      <h3 className="font-mono text-xs uppercase tracking-widest text-[#888888] mb-3">
        ORIGINAL REPORTING
      </h3>

      <div className="border border-[#242424] bg-[#0a0a0a] p-6 space-y-3">
        <div className="font-mono text-xs text-white font-bold tracking-wider uppercase">
          {displaySource}
        </div>
        <p className="text-xs text-[#888888]">
          Support quality independent journalism by reading the complete original reporting
          published by {displaySource}.
        </p>
        <div className="pt-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-xs text-white border border-[#333333] bg-[#141414] hover:bg-white hover:text-black px-4 py-2 transition-colors uppercase tracking-wider font-semibold"
          >
            <span>READ ORIGINAL ARTICLE</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
