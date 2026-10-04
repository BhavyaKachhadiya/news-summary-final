"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Cpu, TrendingUp } from "lucide-react";

interface CategoryNavProps {
  techCount?: number;
  bizCount?: number;
  totalCount?: number;
}

export function CategoryNav({ techCount, bizCount, totalCount }: CategoryNavProps) {
  const pathname = usePathname();

  const tabs = [
    {
      id: "all",
      label: "All News",
      href: "/",
      icon: Layers,
      count: totalCount,
      color: "hover:text-sky-300",
      activeBg: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    },
    {
      id: "technology",
      label: "Technology",
      href: "/technology",
      icon: Cpu,
      count: techCount,
      color: "hover:text-cyan-300",
      activeBg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    },
    {
      id: "business",
      label: "Business & Finance",
      href: "/business",
      icon: TrendingUp,
      count: bizCount,
      color: "hover:text-emerald-300",
      activeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all whitespace-nowrap ${
              isActive
                ? `${tab.activeBg} shadow-sm shadow-slate-900/40`
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`text-xs px-2 py-0.2 rounded-full ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
