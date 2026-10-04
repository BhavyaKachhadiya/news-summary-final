import { NextRequest, NextResponse } from "next/server";
import { getArticles } from "@/services/news.service";
import { NewsCategory } from "@/config/feeds";
import { SummaryStatus } from "@/types/news";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const categoryParam = searchParams.get("category");
    const category =
      categoryParam === "technology" || categoryParam === "business"
        ? (categoryParam as NewsCategory)
        : "all";

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const search = searchParams.get("search") || "";
    const statusParam = searchParams.get("status");
    const status =
      statusParam && ["pending", "processing", "completed", "failed"].includes(statusParam)
        ? (statusParam as SummaryStatus)
        : undefined;

    const data = await getArticles({
      category,
      page,
      limit,
      search,
      status,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[API /api/news] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles", details: message },
      { status: 500 }
    );
  }
}
