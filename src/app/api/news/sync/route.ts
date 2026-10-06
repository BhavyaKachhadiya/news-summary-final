import { NextRequest, NextResponse } from "next/server";
import { syncNews, retryFailedSummaries } from "@/services/news.service";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow sufficient time for RSS ingestion and AI summarization

export async function POST(request: NextRequest) {
  try {

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
    logger.error("SyncAPI", "Error during sync", error);
    return NextResponse.json(
      { error: "Failed to synchronize news", details: message },
      { status: 500 }
    );
  }
}
