"use client";

import React from "react";
import { SourceFilterTabs } from "./SourceFilterTabs";

interface CategoryTabsProps {
  sources?: string[];
  activeSource?: string;
  baseUrl?: string;
  totalCount?: number;
  techCount?: number;
  bizCount?: number;
}

/**
 * Backward compatibility wrapper delegating to SourceFilterTabs.
 * Dynamic news source filters without post counts.
 */
export function CategoryTabs({
  sources = [],
  activeSource = "all",
  baseUrl = "/",
}: CategoryTabsProps) {
  return (
    <SourceFilterTabs
      sources={sources}
      activeSource={activeSource}
      baseUrl={baseUrl}
    />
  );
}
