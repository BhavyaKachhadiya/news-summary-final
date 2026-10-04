"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface CategoryTabsProps {
  totalCount?: number;
  techCount?: number;
  bizCount?: number;
}

export function CategoryTabs({ totalCount, techCount, bizCount }: CategoryTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "ALL", count: totalCount },
    { href: "/technology", label: "TECHNOLOGY", count: techCount },
    { href: "/business", label: "BUSINESS", count: bizCount },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`font-mono text-xs px-3.5 py-1.5 rounded transition-colors whitespace-nowrap border ${
              isActive
                ? "bg-white text-black border-white font-semibold"
                : "bg-transparent text-[#888888] border-[#242424] hover:text-white hover:border-[#444444]"
            }`}
          >
            <span>[ {tab.label} ]</span>
            {typeof tab.count === "number" && (
              <span className={`ml-2 text-[10px] ${isActive ? "text-black" : "text-[#555555]"}`}>
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
