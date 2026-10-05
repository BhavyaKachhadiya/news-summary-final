import { NextRequest, NextResponse } from "next/server";
import { getArticles } from "@/services/news.service";
import { PaginationQuerySchema } from "@/lib/validation/api.schema";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const queryParams = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      source: searchParams.get("source") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    };

    const parsed = PaginationQuerySchema.safeParse(queryParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, category, source, search, status } = parsed.data;

    const data = await getArticles({
      category,
      source,
      page,
      limit,
      search,
      status,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    logger.error("NewsAPI", "Error fetching articles", error);
    return NextResponse.json(
      { error: "Failed to fetch articles", details: message },
      { status: 500 }
    );
  }
}
