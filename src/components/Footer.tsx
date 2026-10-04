import React from "react";
import Link from "next/link";
import { RSS_FEED_CONFIGS } from "@/config/feeds";

export function Footer() {
  return (
    <footer className="border-t border-[#242424] bg-[#000000] text-[#888888] py-12 px-4 sm:px-8 mt-24">
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs">
        {/* Brand */}
        <div className="md:col-span-2 space-y-3">
          <div className="font-mono text-sm font-bold text-white tracking-widest">
            SIGNAL / AI NEWS
          </div>
          <p className="text-[#666666] leading-relaxed max-w-md">
            Continuous automated news intelligence platform. Ingests reporting from The Hindu and
            Bhaskar English, extracts context, and synthesizes structured editorial summaries with Google Gemini.
          </p>
          <div className="font-mono text-[11px] text-[#555555]">
            STRICT MONOCHROME EDITORIAL ENGINE
          </div>
        </div>

        {/* RSS Feeds */}
        <div className="space-y-2">
          <div className="font-mono text-[11px] uppercase tracking-widest text-[#a3a3a3] mb-3">
            RSS FEEDS
          </div>
          <ul className="space-y-1.5 font-mono text-[11px]">
            {RSS_FEED_CONFIGS.map((feed) => (
              <li key={feed.url}>
                <a
                  href={feed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {feed.sourceName.toUpperCase()} &bull; {feed.category.toUpperCase()} &rarr;
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation */}
        <div className="space-y-2">
          <div className="font-mono text-[11px] uppercase tracking-widest text-[#a3a3a3] mb-3">
            SECTIONS
          </div>
          <ul className="space-y-1.5 font-mono text-[11px]">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                ALL INTELLIGENCE
              </Link>
            </li>
            <li>
              <Link href="/technology" className="hover:text-white transition-colors">
                TECHNOLOGY ARCHIVES
              </Link>
            </li>
            <li>
              <Link href="/business" className="hover:text-white transition-colors">
                BUSINESS &amp; MARKETS
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto pt-8 border-t border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#555555] gap-4">
        <p>
          JOURNALISTIC REPORTING COPYRIGHT &copy; {new Date().getFullYear()} RESPECTIVE PUBLISHERS (THE HINDU &amp; BHASKAR ENGLISH). SUMMARIES ARE AI-GENERATED.
        </p>
        <p>SIGNAL TERMINAL / ENGINE V1.0</p>
      </div>
    </footer>
  );
}
