import { NextResponse } from "next/server";
import { getNewsStats } from "@/services/news.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getNewsStats();
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[API /api/stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve stats", details: message },
      { status: 500 }
    );
  }
}
