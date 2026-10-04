import { describe, it, expect } from "vitest";
import { isAllowedUrl } from "@/services/article-extractor.service";

describe("Article Extractor - SSRF Domain Validation", () => {
  it("should allow valid The Hindu and Bhaskar English URLs", () => {
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
  });

  it("should block disallowed external domains to prevent SSRF", () => {
    expect(isAllowedUrl("https://evil.com/malicious")).toBe(false);
    expect(isAllowedUrl("https://thehindu.com.attacker.com")).toBe(false);
    expect(isAllowedUrl("http://localhost:3000")).toBe(false);
    expect(isAllowedUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isAllowedUrl("not-a-valid-url")).toBe(false);
  });
});
