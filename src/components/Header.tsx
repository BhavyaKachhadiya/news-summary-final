"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchDialog } from "./SearchDialog";

export function Header() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Global keyboard shortcut for search (Cmd+K / Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleQuickSync = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus("SYNCING...");
      const res = await fetch("/api/news/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncStatus(`+${data.sync?.newArticlesFound ?? 0} ARTICLES`);
        setTimeout(() => {
          setSyncStatus(null);
          window.location.reload();
        }, 1200);
      } else {
        setSyncStatus("FAILED");
        setTimeout(() => setSyncStatus(null), 2500);
      }
    } catch {
      setSyncStatus("ERROR");
      setTimeout(() => setSyncStatus(null), 2500);
    } finally {
      setIsSyncing(false);
    }
  };

  const navItems = [
    { href: "/", label: "HOME" },
    { href: "/technology", label: "TECHNOLOGY" },
    { href: "/business", label: "BUSINESS" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#000000]/90 backdrop-blur-md border-b border-[#242424]">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Strong Typographic Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="group flex items-baseline gap-2">
                <span className="font-mono text-xl font-bold tracking-tight text-white group-hover:text-[#cccccc] transition-colors">
                  SIGNAL
                </span>
                <span className="font-mono text-[10px] text-[#666666] tracking-widest hidden sm:inline">
                  AI / NEWS
                </span>
              </Link>

              {/* Desktop Nav Items */}
              <nav className="hidden md:flex items-center gap-6 font-mono text-xs tracking-wider">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`transition-colors ${
                        isActive
                          ? "text-white font-semibold underline underline-offset-8 decoration-1"
                          : "text-[#888888] hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Controls & Search */}
            <div className="flex items-center gap-3">
              {/* Quick Sync trigger */}
              <button
                onClick={handleQuickSync}
                disabled={isSyncing}
                title="Fetch RSS updates from all configured news sources"
                className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 border border-[#242424] text-[#888888] hover:text-white hover:border-[#444444] transition-colors disabled:opacity-50"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? "bg-white animate-ping" : "bg-[#555555]"}`} />
                <span>{syncStatus || (isSyncing ? "SYNCING..." : "SYNC")}</span>
              </button>

              {/* Search button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 font-mono text-xs px-3 py-1.5 border border-[#242424] bg-[#0a0a0a] text-[#888888] hover:text-white hover:border-[#444444] transition-colors rounded"
                title="Search (Cmd+K)"
              >
                <span>⌕</span>
                <span className="hidden sm:inline">SEARCH</span>
                <kbd className="hidden md:inline-block font-mono text-[10px] text-[#555555] border border-[#242424] px-1 rounded">
                  ⌘K
                </kbd>
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden font-mono text-sm px-2 py-1 text-white border border-[#242424]"
                aria-label="Toggle navigation"
              >
                {isMobileMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#242424] bg-[#0a0a0a] px-4 py-4 space-y-3 font-mono text-xs">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-1.5 text-[#a3a3a3] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-[#1f1f1f]">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleQuickSync();
                }}
                disabled={isSyncing}
                className="w-full text-left py-1 text-[#888888] hover:text-white"
              >
                {isSyncing ? "SYNCING RSS..." : "FETCH RSS UPDATES"}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Search Modal */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
