import { GoogleGenAI } from "@google/genai";
import pLimit from "p-limit";
import { NewsCategory, APP_CONFIG } from "@/config/feeds";
import { env } from "@/lib/env";
import { getSummaryPrompt } from "@/prompts";
import { validateSummary } from "@/schemas";
import { ArticleSummary } from "@/types/news";

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
 * Strips potential markdown code blocks, backticks, or trailing characters from Gemini response.
 */
export function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();

  // Strip leading code fences
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }

  // Strip trailing code fences
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  // Find first { and last } to remove any leading/trailing explanatory notes
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

/**
 * Delays execution for exponential backoff
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls Gemini with automatic retries and exponential backoff on 429/5xx errors
 */
async function callGeminiWithRetry(prompt: string, modelName: string): Promise<string> {
  const ai = getGenAI();
  let lastError: unknown;
  let delay = APP_CONFIG.geminiInitialBackoffMs;

  for (let attempt = 1; attempt <= APP_CONFIG.geminiMaxRetries; attempt++) {
    try {
      console.log(
        `[Gemini] Generating summary with model ${modelName} (attempt ${attempt}/${APP_CONFIG.geminiMaxRetries})`
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
      console.warn(`[Gemini] Attempt ${attempt} failed: ${errMsg}`);

      const isRateLimit =
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("resource_exhausted") ||
        errMsg.toLowerCase().includes("quota");

      const isServerTransient =
        errMsg.includes("503") ||
        errMsg.includes("500") ||
        errMsg.toLowerCase().includes("overloaded");

      if ((isRateLimit || isServerTransient) && attempt < APP_CONFIG.geminiMaxRetries) {
        console.log(`[Gemini] Backing off for ${delay}ms before retrying...`);
        await sleep(delay);
        delay *= 2;
        continue;
      }

      // Non-transient errors or max attempts reached
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
    try {
      const prompt = getSummaryPrompt(request.category, {
        title: request.title,
        content: request.content,
        url: request.url,
      });

      const modelName = env.GEMINI_MODEL;
      const rawResponse = await callGeminiWithRetry(prompt, modelName);

      const cleanedJson = cleanJsonResponse(rawResponse);

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleanedJson);
      } catch (jsonErr) {
        console.error("[Gemini] Failed to parse JSON response:", cleanedJson);
        return {
          success: false,
          error: `Malformed JSON from Gemini: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}`,
          modelUsed: modelName,
        };
      }

      // Validate against the category Zod schema
      const validation = validateSummary(request.category, parsed);
      if (!validation.success) {
        console.error(
          `[Gemini] Schema validation failed for ${request.category}:`,
          validation.error
        );
        return {
          success: false,
          error: `Summary validation error: ${validation.error}`,
          modelUsed: modelName,
        };
      }

      console.log(`[Gemini] Summary successfully generated & validated for: ${request.title}`);
      return {
        success: true,
        summary: validation.data,
        modelUsed: modelName,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Gemini] Error generating summary:", errMsg);
      return {
        success: false,
        error: errMsg,
      };
    }
  });
}
