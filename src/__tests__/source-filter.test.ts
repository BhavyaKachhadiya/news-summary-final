import { describe, it, expect } from "vitest";
import { getArticles, getAvailableSources } from "@/services/news.service";
import { connectToDatabase } from "@/lib/mongodb";

describe("Dynamic Source Filtering", () => {
  it("should return dynamically configured source names without hardcoding", async () => {
    await connectToDatabase();
    const sources = await getAvailableSources();

    expect(sources.length).toBeGreaterThan(0);
    expect(sources).toContain("Moneycontrol");
    expect(sources).toContain("The Hindu");
    expect(sources).toContain("BBC");
    expect(sources).toContain("TechCrunch");
  }, 20000);

  it("should filter articles strictly to the chosen source when specified", async () => {
    await connectToDatabase();
    const res = await getArticles({ source: "Moneycontrol", limit: 10, page: 1 });

    expect(res.articles.length).toBeGreaterThan(0);
    for (const article of res.articles) {
      expect(article.source.toLowerCase()).toBe("moneycontrol");
    }
  }, 20000);
});
