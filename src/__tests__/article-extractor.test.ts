import { describe, it, expect } from "vitest";
import { isAllowedUrl } from "@/services/article-extractor.service";

describe("Article Extractor - SSRF Domain Validation", () => {
  it("should allow valid news source URLs across all configured publishers", () => {
    expect(
      isAllowedUrl("https://www.thehindu.com/sci-tech/technology/article123.ece")
    ).toBe(true);

    expect(
      isAllowedUrl("https://thehindu.com/business/economy/article456.ece")
    ).toBe(true);

    expect(
      isAllowedUrl("https://www.bhaskarenglish.in/tech-science/news/sample-tech-123.html")
    ).toBe(true);

    expect(
      isAllowedUrl("https://bhaskarenglish.in/business/news/sample-biz-456.html")
    ).toBe(true);

    expect(
      isAllowedUrl("https://www.bbc.com/news/articles/cqj6jenp26zyo")
    ).toBe(true);

    expect(
      isAllowedUrl("https://techcrunch.com/2026/10/04/article-slug")
    ).toBe(true);

    expect(
      isAllowedUrl("https://www.theverge.com/gadgets/1004616/the-new-fitbit-edge-leaks")
    ).toBe(true);

    expect(
      isAllowedUrl("https://economictimes.indiatimes.com/tech/technology/article.cms")
    ).toBe(true);

    expect(
      isAllowedUrl("https://www.moneycontrol.com/technology/article-14044797.html")
    ).toBe(true);

    expect(
      isAllowedUrl("https://www.gadgets360.com/mobiles/news/article-12140114")
    ).toBe(true);

    expect(
      isAllowedUrl("https://indianexpress.com/article/technology/article-10907186")
    ).toBe(true);

    expect(
      isAllowedUrl("https://timesofindia.indiatimes.com/gadgets-news/article.cms")
    ).toBe(true);

    expect(
      isAllowedUrl("https://www.hindustantimes.com/technology/article-101791191105547.html")
    ).toBe(true);

    expect(
      isAllowedUrl("https://www.reuters.com/technology/article-slug-2026")
    ).toBe(true);
  });

  it("should block disallowed external domains to prevent SSRF", () => {
    expect(isAllowedUrl("https://evil.com/malicious")).toBe(false);
    expect(isAllowedUrl("https://thehindu.com.attacker.com")).toBe(false);
    expect(isAllowedUrl("http://localhost:3000")).toBe(false);
    expect(isAllowedUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isAllowedUrl("not-a-valid-url")).toBe(false);
  });
});
