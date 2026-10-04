import { NextRequest, NextResponse } from "next/server";
import { syncNews, retryFailedSummaries } from "@/services/news.service";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow sufficient time for RSS ingestion and AI summarization

export async function POST(request: NextRequest) {
  try {
    // Check CRON_SECRET if configured
    const configuredSecret = env.CRON_SECRET;
    if (configuredSecret) {
      const authHeader = request.headers.get("authorization");
      const cronSecretHeader = request.headers.get("x-cron-secret");
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

      const providedSecret = bearerToken || cronSecretHeader;
      if (providedSecret !== configuredSecret) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid or missing CRON_SECRET." },
          { status: 401 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const retryFailed = searchParams.get("retryFailed") === "true";

    let retryResult = null;
    if (retryFailed) {
      retryResult = await retryFailedSummaries();
    }

    const syncResult = await syncNews();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      sync: syncResult,
      retry: retryResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[API /api/news/sync] Error during sync:", error);
    return NextResponse.json(
      { error: "Failed to synchronize news", details: message },
      { status: 500 }
    );
  }
}
