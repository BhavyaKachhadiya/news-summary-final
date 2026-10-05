import { NextResponse } from "next/server";
import { getNewsStats, recoverStaleProcessingJobs } from "@/services/news.service";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check and recover stale jobs whenever stats are fetched
    await recoverStaleProcessingJobs();
    const stats = await getNewsStats();
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    logger.error("StatsAPI", "Failed to retrieve stats", error);
    return NextResponse.json(
      { error: "Failed to retrieve stats", details: message },
      { status: 500 }
    );
  }
}
