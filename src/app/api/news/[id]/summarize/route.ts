import { NextRequest, NextResponse } from "next/server";
import { summarizeArticleById } from "@/services/news.service";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";
import { MongoIdSchema, SummarizeBodySchema } from "@/lib/validation/api.schema";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Validate MongoDB ObjectId
    const idValidation = MongoIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid article ID format" },
        { status: 400 }
      );
    }

    // Rate limiting: 10 requests per minute per IP
    const clientIp = getClientIp(request);
    const limitResult = rateLimit(clientIp, {
      limit: 10,
      windowMs: 60 * 1000,
      keyPrefix: "summarize",
    });

    if (!limitResult.success) {
      logger.warn("SummarizeAPI", `Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json(
        {
          error: "Too many summary requests. Please slow down.",
          retryAfter: limitResult.reset,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(limitResult.reset),
            "X-RateLimit-Limit": String(limitResult.limit),
            "X-RateLimit-Remaining": String(limitResult.remaining),
          },
        }
      );
    }

    // Safely parse JSON request body
    let forceRetry = false;
    try {
      const body = await request.json();
      const parsedBody = SummarizeBodySchema.safeParse(body);
      if (parsedBody.success) {
        forceRetry = parsedBody.data.forceRetry;
      }
    } catch {
      // Empty body is acceptable; defaults forceRetry to false
      forceRetry = false;
    }

    const result = await summarizeArticleById(id, forceRetry);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Failed to summarize article",
          article: result.article,
        },
        { status: result.error?.includes("lock") ? 409 : 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        article: result.article,
      },
      {
        headers: {
          "X-RateLimit-Limit": String(limitResult.limit),
          "X-RateLimit-Remaining": String(limitResult.remaining),
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    logger.error("SummarizeAPI", "Unhandled error during summarize", error);
    return NextResponse.json(
      { error: "Failed to summarize article", details: message },
      { status: 500 }
    );
  }
}
