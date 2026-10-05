import { describe, it, expect } from "vitest";
import { getArticles } from "@/services/news.service";
import { connectToDatabase } from "@/lib/mongodb";

describe("Source Diversity in Live Feed Query", () => {
  it("should return diverse sources in first page of technology feed", async () => {
    await connectToDatabase();
    const res = await getArticles({ category: "technology", limit: 10, page: 1 });

    expect(res.articles.length).toBeGreaterThan(0);
    const sourcesOnPage1 = res.articles.map((a) => a.source);

    // Ensure page 1 is NOT dominated by only 1 source
    const uniqueSources = new Set(sourcesOnPage1);
    expect(uniqueSources.size).toBeGreaterThan(5);

    // Verify first N articles have different sources (Round 1)
    const firstGroup = sourcesOnPage1.slice(0, uniqueSources.size);
    const firstGroupSet = new Set(firstGroup);
    expect(firstGroupSet.size).toBe(uniqueSources.size);
  }, 20000);
});
