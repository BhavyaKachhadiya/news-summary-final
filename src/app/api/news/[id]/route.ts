import { NextRequest, NextResponse } from "next/server";
import { getArticleById, deleteArticleById } from "@/services/news.service";
import { MongoIdSchema } from "@/lib/validation/api.schema";
import { env } from "@/lib/env";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const idValidation = MongoIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid article ID format" },
        { status: 400 }
      );
    }

    const article = await getArticleById(id);

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(article);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    logger.error("ArticleAPI", `Error retrieving article`, error);
    return NextResponse.json(
      { error: "Failed to retrieve article", details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const idValidation = MongoIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid article ID format" },
        { status: 400 }
      );
    }

    // Require CRON_SECRET if configured or if in production
    const configuredSecret = env.CRON_SECRET;
    if (configuredSecret) {
      const authHeader = request.headers.get("authorization");
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;
      if (bearerToken !== configuredSecret) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid or missing token" },
          { status: 401 }
        );
      }
    }

    const deleted = await deleteArticleById(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Article not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Article deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    logger.error("ArticleAPI", `Error deleting article`, error);
    return NextResponse.json(
      { error: "Failed to delete article", details: message },
      { status: 500 }
    );
  }
}
