import { describe, it, expect } from "vitest";
import {
  normalizeUrl,
  limitSourceArticles,
  combineAndDeduplicateArticles,
  interleaveArticlesBySource,
} from "@/services/rss.service";

describe("RSS Service - URL Normalization & Sanitization", () => {
  it("should strip UTM parameters and tracking tags", () => {
    const rawUrl =
      "https://www.thehindu.com/sci-tech/technology/ai-update/article12345.ece?utm_source=rss&utm_medium=feed&utm_campaign=daily";
    const normalized = normalizeUrl(rawUrl);

    expect(normalized).toBe(
      "https://www.thehindu.com/sci-tech/technology/ai-update/article12345.ece"
    );
  });

  it("should enforce https protocol for The Hindu links", () => {
    const rawUrl =
      "http://www.thehindu.com/business/economy/article67890.ece";
    const normalized = normalizeUrl(rawUrl);

    expect(normalized).toBe(
      "https://www.thehindu.com/business/economy/article67890.ece"
    );
  });

  it("should remove trailing slashes from pathnames", () => {
    const rawUrl = "https://www.thehindu.com/sci-tech/technology/";
    const normalized = normalizeUrl(rawUrl);

    expect(normalized).toBe("https://www.thehindu.com/sci-tech/technology");
  });

  it("should preserve non-tracking valid query parameters", () => {
    const rawUrl = "https://www.thehindu.com/search/?q=artificial+intelligence&utm_source=rss";
    const normalized = normalizeUrl(rawUrl);

    expect(normalized).toBe("https://www.thehindu.com/search?q=artificial+intelligence");
  });
});

describe("RSS Service - Per-Source Top-10 Limiting & Deduplication", () => {
  it("should limit source articles to 10 latest posts sorted by publication date", () => {
    // Generate 15 posts with distinct dates
    const articles = Array.from({ length: 15 }, (_, i) => ({
      title: `Article ${i + 1}`,
      url: `https://example.com/article-${i + 1}`,
      description: `Description ${i + 1}`,
      publishedAt: new Date(2026, 9, i + 1, 12, 0, 0), // Oct 1 to Oct 15
      category: "technology" as const,
      source: "Test Source",
    }));

    const limited = limitSourceArticles(articles, 10);

    expect(limited).toHaveLength(10);
    // Newest post must be first (Oct 15)
    expect(limited[0].title).toBe("Article 15");
    expect(limited[9].title).toBe("Article 6");
    expect(new Date(limited[0].publishedAt).getTime()).toBeGreaterThan(
      new Date(limited[9].publishedAt).getTime()
    );
  });

  it("should handle sources with fewer than 10 posts normally", () => {
    const articles = [
      {
        title: "Article A",
        url: "https://example.com/a",
        description: "A",
        publishedAt: new Date("2026-10-01T10:00:00Z"),
        category: "technology" as const,
        source: "Source Small",
      },
      {
        title: "Article B",
        url: "https://example.com/b",
        description: "B",
        publishedAt: new Date("2026-10-02T10:00:00Z"),
        category: "technology" as const,
        source: "Source Small",
      },
    ];

    const limited = limitSourceArticles(articles, 10);
    expect(limited).toHaveLength(2);
    expect(limited[0].title).toBe("Article B");
    expect(limited[1].title).toBe("Article A");
  });

  it("should combine posts from multiple sources without global 10-cap and deduplicate", () => {
    const sourceA = Array.from({ length: 10 }, (_, i) => ({
      title: `Source A Post ${i + 1}`,
      url: `https://source-a.com/post-${i + 1}`,
      description: "Desc",
      publishedAt: new Date(2026, 9, i + 1, 10, 0, 0),
      category: "technology" as const,
      source: "Source A",
    }));

    const sourceB = Array.from({ length: 10 }, (_, i) => ({
      title: `Source B Post ${i + 1}`,
      url: `https://source-b.com/post-${i + 1}`,
      description: "Desc",
      publishedAt: new Date(2026, 9, i + 1, 11, 0, 0),
      category: "technology" as const,
      source: "Source B",
    }));

    // Add duplicate of post 1 into source B
    sourceB.push({
      title: "Duplicate of Source A Post 1",
      url: "https://source-a.com/post-1",
      description: "Duplicate",
      publishedAt: new Date(2026, 9, 20, 10, 0, 0),
      category: "technology" as const,
      source: "Source B",
    });

    const combined = combineAndDeduplicateArticles([sourceA, sourceB]);

    // Should NOT be limited to 10 total: 10 from A + 10 from B (duplicate stripped) = 20 total
    expect(combined).toHaveLength(20);

    // Verify round-robin interleaving: Source B and Source A alternate
    expect(combined[0].source).toBe("Source B");
    expect(combined[1].source).toBe("Source A");
    expect(combined[2].source).toBe("Source B");
    expect(combined[3].source).toBe("Source A");
  });

  it("should implement round-robin source interleaving (Round 1: 1 post/source, Round 2: 2nd post/source)", () => {
    const sourceA = [
      { title: "A1", url: "https://a.com/1", publishedAt: new Date("2026-10-05T10:00:00Z"), source: "Source A" },
      { title: "A2", url: "https://a.com/2", publishedAt: new Date("2026-10-05T09:00:00Z"), source: "Source A" },
      { title: "A3", url: "https://a.com/3", publishedAt: new Date("2026-10-05T08:00:00Z"), source: "Source A" },
    ];
    const sourceB = [
      { title: "B1", url: "https://b.com/1", publishedAt: new Date("2026-10-05T09:30:00Z"), source: "Source B" },
      { title: "B2", url: "https://b.com/2", publishedAt: new Date("2026-10-05T08:30:00Z"), source: "Source B" },
      { title: "B3", url: "https://b.com/3", publishedAt: new Date("2026-10-05T07:30:00Z"), source: "Source B" },
    ];
    const sourceC = [
      { title: "C1", url: "https://c.com/1", publishedAt: new Date("2026-10-05T09:15:00Z"), source: "Source C" },
      { title: "C2", url: "https://c.com/2", publishedAt: new Date("2026-10-05T08:15:00Z"), source: "Source C" },
      { title: "C3", url: "https://c.com/3", publishedAt: new Date("2026-10-05T07:15:00Z"), source: "Source C" },
    ];

    const interleaved = interleaveArticlesBySource([...sourceA, ...sourceB, ...sourceC]);

    // Round 1: newest from A (A1), newest from B (B1), newest from C (C1)
    // Round 2: A2, B2, C2
    // Round 3: A3, B3, C3
    expect(interleaved.map((x) => x.title)).toEqual([
      "A1", "B1", "C1",
      "A2", "B2", "C2",
      "A3", "B3", "C3",
    ]);
  });
});
