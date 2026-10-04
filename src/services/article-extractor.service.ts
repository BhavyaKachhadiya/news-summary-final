import * as cheerio from "cheerio";
import { ALLOWED_DOMAINS, APP_CONFIG } from "@/config/feeds";

/**
 * Validates whether a URL belongs to the allowed domains list (SSRF protection).
 */
export function isAllowedUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export interface ExtractedArticle {
  title?: string;
  content: string;
  extractedSuccessfully: boolean;
  wordCount: number;
}

/**
 * Extracts readable article text from The Hindu article URL.
 * Falls back to fallbackDescription if web scraping fails or returns minimal content.
 */
export async function extractArticleContent(
  url: string,
  fallbackDescription: string = ""
): Promise<ExtractedArticle> {
  if (!isAllowedUrl(url)) {
    console.warn(`[Article Extractor] Blocked URL outside allowed domains: ${url}`);
    return {
      content: fallbackDescription,
      extractedSuccessfully: false,
      wordCount: fallbackDescription.split(/\s+/).filter(Boolean).length,
    };
  }

  try {
    console.log(`[Article Extractor] Fetching article: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      APP_CONFIG.articleExtractionTimeoutMs
    );

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": APP_CONFIG.userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      next: { revalidate: 3600 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `[Article Extractor] HTTP ${response.status} fetching ${url}. Using description fallback.`
      );
      return {
        content: fallbackDescription,
        extractedSuccessfully: false,
        wordCount: fallbackDescription.split(/\s+/).filter(Boolean).length,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noise, scripts, styles, ads, modals, navigation
    $(
      "script, style, noscript, iframe, svg, header, nav, footer, " +
      ".ad-banner, .advertisement, .dfp-ad, [class*='banner'], " +
      ".social-share, .comments, .related-articles, .taboola, .outbrain, " +
      ".paywall-banner, .subscribe-card, .newsletter-signup, " +
      ".author-details, .tag-cloud, .cookie-consent, [id*='ad-']"
    ).remove();

    // Check specific selectors for article body (The Hindu & Bhaskar English)
    const bodySelectors = [
      "div.articlebodycontent",
      "div[itemprop='articleBody']",
      "div.article-content",
      ".content-body",
      "div._articleBody",
      "article .body",
      "article",
      "main",
    ];

    let paragraphs: string[] = [];

    // First try standard article containers
    for (const selector of bodySelectors) {
      const container = $(selector);
      if (container.length > 0) {
        const pElements = container.find("p");
        if (pElements.length > 0) {
          pElements.each((_, el) => {
            const text = $(el).text().trim();
            if (
              text &&
              !text.toLowerCase().includes("read also") &&
              !text.toLowerCase().includes("also read") &&
              !text.toLowerCase().includes("subscribe now") &&
              !text.toLowerCase().includes("sign up for our newsletter") &&
              !text.toLowerCase().includes("get the latest news from your city") &&
              text.length > 25
            ) {
              paragraphs.push(text);
            }
          });
          if (paragraphs.length >= 2) {
            break;
          }
        }
      }
    }

    // Try Bhaskar English specific styled paragraphs if none found yet
    if (paragraphs.length === 0) {
      $("p[style*='word-break'], p[style*='white-space']").each((_, el) => {
        const text = $(el).text().trim();
        if (
          text &&
          !text.toLowerCase().includes("get the latest news from your city") &&
          text.length > 25
        ) {
          paragraphs.push(text);
        }
      });
    }

    // General fallback: all paragraphs in the document
    if (paragraphs.length === 0) {
      $("p").each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 35) {
          paragraphs.push(text);
        }
      });
    }

    const fullText = paragraphs.join("\n\n").trim();

    // If extracted text is substantial (at least 150 chars), use it
    if (fullText.length >= 150) {
      const words = fullText.split(/\s+/).filter(Boolean).length;
      console.log(
        `[Article Extractor] Successfully extracted ${words} words from ${url}`
      );
      return {
        content: fullText,
        extractedSuccessfully: true,
        wordCount: words,
      };
    }

    // Fallback to RSS description
    console.log(
      `[Article Extractor] Extracted content too short (${fullText.length} chars). Falling back to description.`
    );
    const content = fallbackDescription || fullText;
    return {
      content,
      extractedSuccessfully: false,
      wordCount: content.split(/\s+/).filter(Boolean).length,
    };
  } catch (err) {
    console.error(`[Article Extractor] Extraction failed for ${url}:`, err);
    return {
      content: fallbackDescription,
      extractedSuccessfully: false,
      wordCount: fallbackDescription.split(/\s+/).filter(Boolean).length,
    };
  }
}
