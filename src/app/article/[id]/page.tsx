import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticleById } from "@/services/news.service";
import { SummaryView } from "@/components/SummaryView";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  const title = article.summary?.headline || article.title;
  const description =
    article.summary?.overview || article.description || "The Hindu AI Detailed Summary";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: new Date(article.publishedAt).toISOString(),
      authors: [article.author || "The Hindu"],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    notFound();
  }

  const backHref =
    article.category === "technology"
      ? "/technology"
      : article.category === "business"
      ? "/business"
      : "/";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 font-mono text-xs text-[#888888] hover:text-white transition-colors uppercase tracking-wider"
        >
          <span>&larr;</span>
          <span>BACK TO {article.category.toUpperCase()}</span>
        </Link>
      </div>

      {/* Main summary view */}
      <SummaryView article={article} />
    </div>
  );
}
