"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArticleDocument } from "@/types/news";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArticleDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setIsLoading(false);
    onClose();
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/news?search=${encodeURIComponent(trimmed)}&limit=8`);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setResults(data.articles || []);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!isOpen) return null;

  const displayedResults = query.trim() ? results : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-[#242424] rounded-lg shadow-2xl overflow-hidden z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#242424]">
          <span className="font-mono text-sm text-[#888888] mr-3">⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (!val.trim()) {
                setResults([]);
                setIsLoading(false);
              }
            }}
            placeholder="Search news, companies, people, RBI, AI..."
            className="w-full bg-transparent text-white placeholder-[#555555] text-sm focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setIsLoading(false);
              }}
              className="text-[#666666] hover:text-white text-xs font-mono px-2 py-1"
            >
              CLEAR
            </button>
          )}
          <kbd className="hidden sm:inline-block font-mono text-[10px] text-[#666666] border border-[#242424] px-1.5 py-0.5 rounded ml-2">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-[#1a1a1a]">
          {isLoading && (
            <div className="p-6 text-center text-xs font-mono text-[#666666]">
              SEARCHING ARCHIVES...
            </div>
          )}

          {!isLoading && query && displayedResults.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-white font-medium mb-1">NO MATCHING ARTICLES</p>
              <p className="text-xs text-[#666666]">Try searching for other terms or entities.</p>
            </div>
          )}

          {!isLoading && displayedResults.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[10px] font-mono uppercase text-[#666666] bg-[#000000]">
                {displayedResults.length} RESULTS
              </div>
              {displayedResults.map((article) => (
                <div
                  key={article._id}
                  onClick={() => {
                    handleClose();
                    router.push(`/article/${article._id}`);
                  }}
                  className="p-4 hover:bg-[#141414] cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#888888] mb-1">
                    <span className="uppercase text-[#aaaaaa]">{article.category}</span>
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white hover:underline line-clamp-1 mb-1">
                    {article.summary?.headline || article.title}
                  </h4>
                  <p className="text-xs text-[#888888] line-clamp-2">
                    {article.summary?.overview || article.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!query && (
            <div className="p-6 text-center text-xs text-[#666666] font-mono">
              TYPE TO SEARCH TECHNOLOGY &amp; BUSINESS JOURNALISM
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
