import { GoogleGenAI } from "@google/genai";
import pLimit from "p-limit";
import { NewsCategory, APP_CONFIG } from "@/config/feeds";
import { env } from "@/lib/env";
import { getSummaryPrompt } from "@/prompts";
import { validateSummary } from "@/schemas";
import { ArticleSummary } from "@/types/news";
import { logger } from "@/lib/logging/logger";

export interface GeminiSummaryRequest {
  title: string;
  content: string;
  url: string;
  category: NewsCategory;
}

export interface GeminiSummaryResult {
  success: boolean;
  summary?: ArticleSummary;
  error?: string;
  modelUsed?: string;
  latencyMs?: number;
}

// Concurrency limiter to prevent flooding the Gemini API
const queue = pLimit(APP_CONFIG.maxConcurrentGeminiRequests);

let genAIInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAIInstance) {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in .env.local"
      );
    }
    genAIInstance = new GoogleGenAI({ apiKey });
  }
  return genAIInstance;
}

/**
 * Sanitizes scraped article content to prevent prompt injection and limit token footprint.
 * Enforces boundary tags to clearly demarcate untrusted content for the model.
 */
export function sanitizePromptInput(rawContent: string): string {
  if (!rawContent) return "";

  let sanitized = rawContent.slice(0, APP_CONFIG.maxGeminiInputLength);

  // Neutralize common prompt injection directives
  sanitized = sanitized
    .replace(/ignore (all )?previous instructions/gi, "[filtered instruction]")
    .replace(/disregard (all )?prior instructions/gi, "[filtered instruction]")
    .replace(/system prompt/gi, "[system context]")
    .replace(/assistant:/gi, "assistant context:")
    .replace(/user:/gi, "user context:");

  return sanitized.trim();
}

/**
 * Strips markdown fences, trailing text, or leading noise from Gemini response.
 * Handles malformed JSON recovery by extracting outermost matched braces.
 */
export function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();

  // Strip leading markdown fences
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }

  // Strip trailing markdown fences
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  // Extract from first '{' to last '}'
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Common JSON repair: replace trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  return cleaned;
}

/**
 * Delays execution with exponential backoff and jitter
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls Gemini with automatic retries, jittered exponential backoff, and 429/500/503/quota handling
 */
async function callGeminiWithRetry(prompt: string, modelName: string): Promise<string> {
  const ai = getGenAI();
  let lastError: unknown;
  let delay = APP_CONFIG.geminiInitialBackoffMs;

  for (let attempt = 1; attempt <= APP_CONFIG.geminiMaxRetries; attempt++) {
    try {
      logger.info(
        "Gemini",
        `Calling Gemini model ${modelName} (attempt ${attempt}/${APP_CONFIG.geminiMaxRetries})`
      );

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Gemini returned empty response text");
      }

      return text;
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.warn("Gemini", `Attempt ${attempt} failed: ${errMsg}`);

      const isRateLimit =
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("resource_exhausted") ||
        errMsg.toLowerCase().includes("quota");

      const isServerTransient =
        errMsg.includes("503") ||
        errMsg.includes("500") ||
        errMsg.toLowerCase().includes("overloaded") ||
        errMsg.toLowerCase().includes("unavailable");

      if ((isRateLimit || isServerTransient) && attempt < APP_CONFIG.geminiMaxRetries) {
        // Add jitter: ±20%
        const jitter = delay * (0.8 + Math.random() * 0.4);
        logger.info("Gemini", `Backing off for ${Math.round(jitter)}ms before retrying...`);
        await sleep(jitter);
        delay *= 2;
        continue;
      }

      break;
    }
  }

  throw lastError;
}

/**
 * Generates and validates a structured AI news summary using Google Gemini.
 * Concurrency is rate-limited via a queue.
 */
export async function generateArticleSummary(
  request: GeminiSummaryRequest
): Promise<GeminiSummaryResult> {
  return queue(async () => {
    const startTime = Date.now();
    try {
      const sanitizedContent = sanitizePromptInput(request.content);

      // Wrap untrusted content safely with boundaries
      const prompt = getSummaryPrompt(request.category, {
        title: request.title,
        content: `--- UNTRUSTED ARTICLE CONTENT BEGIN ---\n${sanitizedContent}\n--- UNTRUSTED ARTICLE CONTENT END ---`,
        url: request.url,
      });

      const modelName = env.GEMINI_MODEL;
      const rawResponse = await callGeminiWithRetry(prompt, modelName);

      const cleanedJson = cleanJsonResponse(rawResponse);

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleanedJson);
      } catch (jsonErr) {
        logger.error("Gemini", "Failed to parse JSON response", {
          error: jsonErr instanceof Error ? jsonErr.message : String(jsonErr),
        });
        return {
          success: false,
          error: `Malformed JSON from Gemini: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}`,
          modelUsed: modelName,
          latencyMs: Date.now() - startTime,
        };
      }

      // Validate against the category Zod schema
      const validation = validateSummary(request.category, parsed);
      if (!validation.success) {
        logger.error("Gemini", `Schema validation failed for ${request.category}`, {
          error: validation.error,
        });
        return {
          success: false,
          error: `Summary validation error: ${validation.error}`,
          modelUsed: modelName,
          latencyMs: Date.now() - startTime,
        };
      }

      const latency = Date.now() - startTime;
      logger.info(
        "Gemini",
        `Summary successfully generated & validated for: ${request.title} in ${latency}ms`
      );

      return {
        success: true,
        summary: validation.data,
        modelUsed: modelName,
        latencyMs: latency,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error("Gemini", "Error generating summary", { error: errMsg });
      return {
        success: false,
        error: errMsg,
        latencyMs: Date.now() - startTime,
      };
    }
  });
}
