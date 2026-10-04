import { describe, it, expect } from "vitest";
import { normalizeUrl } from "@/services/rss.service";

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
