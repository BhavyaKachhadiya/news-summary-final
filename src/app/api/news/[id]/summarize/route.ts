import { NextRequest, NextResponse } from "next/server";
import { summarizeArticleById } from "@/services/news.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    let forceRetry = false;
    try {
      const body = await request.json();
      forceRetry = !!body.forceRetry;
    } catch {
      // Body may be empty, default forceRetry to true if called explicitly
      forceRetry = true;
    }

    const result = await summarizeArticleById(id, forceRetry);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to summarize article", article: result.article },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      article: result.article,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error(`[API /api/news/[id]/summarize] Error:`, error);
    return NextResponse.json(
      { error: "Failed to summarize article", details: message },
      { status: 500 }
    );
  }
}
