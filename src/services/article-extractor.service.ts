import * as cheerio from "cheerio";
import { APP_CONFIG } from "@/config/feeds";
import { safeFetch, validateUrl } from "@/lib/security/ssrf";
import { logger } from "@/lib/logging/logger";

/**
 * Validates whether a URL belongs to the allowed domains list (SSRF protection).
 */
export function isAllowedUrl(urlStr: string): boolean {
  return validateUrl(urlStr).isValid;
}

export interface ExtractedArticle {
  title?: string;
  content: string;
  extractedSuccessfully: boolean;
  wordCount: number;
}

/**
 * Extracts readable article text from news article URL.
 * Falls back to fallbackDescription if web scraping fails or returns minimal content.
 * Enforces SSRF defense, redirect constraints, and max HTML/text size limits.
 */
export async function extractArticleContent(
  url: string,
  fallbackDescription: string = ""
): Promise<ExtractedArticle> {
  const safeFallback = fallbackDescription.slice(0, APP_CONFIG.maxExtractedTextLength);

  if (!isAllowedUrl(url)) {
    logger.warn("ArticleExtractor", `Blocked URL outside allowed domains: ${url}`);
    return {
      content: safeFallback,
      extractedSuccessfully: false,
      wordCount: safeFallback.split(/\s+/).filter(Boolean).length,
    };
  }

  try {
    logger.info("ArticleExtractor", `Fetching article: ${url}`);

    const result = await safeFetch(url, {
      maxRedirects: 3,
      maxSizeBytes: APP_CONFIG.maxArticleHtmlSizeBytes,
      timeoutMs: APP_CONFIG.articleExtractionTimeoutMs,
      headers: {
        "User-Agent": APP_CONFIG.userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });

    if (result.status >= 400 || !result.text) {
      logger.warn(
        "ArticleExtractor",
        `HTTP ${result.status} fetching ${url}. Using description fallback.`
      );
      return {
        content: safeFallback,
        extractedSuccessfully: false,
        wordCount: safeFallback.split(/\s+/).filter(Boolean).length,
      };
    }

    const $ = cheerio.load(result.text);

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

    const paragraphs: string[] = [];

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

    let fullText = paragraphs.join("\n\n").trim();

    // Enforce max extracted text size
    if (fullText.length > APP_CONFIG.maxExtractedTextLength) {
      fullText = fullText.slice(0, APP_CONFIG.maxExtractedTextLength);
    }

    // If extracted text is substantial (at least 150 chars), use it
    if (fullText.length >= 150) {
      const words = fullText.split(/\s+/).filter(Boolean).length;
      logger.info(
        "ArticleExtractor",
        `Successfully extracted ${words} words from ${url}`
      );
      return {
        content: fullText,
        extractedSuccessfully: true,
        wordCount: words,
      };
    }

    // Fallback to RSS description
    logger.info(
      "ArticleExtractor",
      `Extracted content too short (${fullText.length} chars). Falling back to description.`
    );
    const content = safeFallback || fullText;
    return {
      content,
      extractedSuccessfully: false,
      wordCount: content.split(/\s+/).filter(Boolean).length,
    };
  } catch (err) {
    logger.error("ArticleExtractor", `Extraction failed for ${url}`, err);
    return {
      content: safeFallback,
      extractedSuccessfully: false,
      wordCount: safeFallback.split(/\s+/).filter(Boolean).length,
    };
  }
}
