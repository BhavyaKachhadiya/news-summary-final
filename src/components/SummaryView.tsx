"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArticleDocument, TechnologySummary, BusinessSummary } from "@/types/news";
import { ArticleHeader } from "./ArticleHeader";
import { AISummaryBadge } from "./AISummaryBadge";
import { SummarySection } from "./SummarySection";
import { KeyTakeaways } from "./KeyTakeaways";
import { FinancialDetails } from "./FinancialDetails";
import { PeopleList } from "./PeopleList";
import { OrganizationsList } from "./OrganizationsList";
import { SourceLink } from "./SourceLink";
import { AISummarySkeleton } from "./AISummarySkeleton";

interface SummaryViewProps {
  article: ArticleDocument;
}

function FormattedArticleContent({
  content,
  source,
  sourceUrl,
}: {
  content: string;
  source?: string;
  sourceUrl: string;
}) {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="border border-[#242424] bg-[#0a0a0a] p-6 sm:p-8 space-y-6">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2 font-mono text-xs text-white uppercase tracking-widest font-semibold">
          <span>📰</span>
          <span>ORIGINAL REPORTING &bull; {(source || "THE HINDU").toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-[#777777]">
          <span>~{readingTime} MIN READ</span>
          <span>&bull;</span>
          <span>{wordCount} WORDS</span>
          <span>&bull;</span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <span>SOURCE</span>
            <span>↗</span>
          </a>
        </div>
      </div>

      {/* Formatted Paragraphs */}
      <div className="space-y-4 text-sm sm:text-[15px] leading-[1.8] text-[#cccccc] font-normal">
        {paragraphs.map((para, idx) => (
          <p
            key={idx}
            className={
              idx === 0
                ? "text-white font-medium text-base sm:text-[16px] leading-[1.75]"
                : ""
            }
          >
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}

export function SummaryView({ article }: SummaryViewProps) {
  const [currentArticle, setCurrentArticle] = useState<ArticleDocument>(article);
  const [isSummarizing, setIsSummarizing] = useState(
    !article.summary && article.summaryStatus !== "completed"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"summary" | "original" | "split">("summary");
  const hasTriggeredRef = useRef(false);

  const isTech = currentArticle.category === "technology";
  const summary = currentArticle.summary;
  const isSummaryReady = Boolean(summary && currentArticle.summaryStatus === "completed");

  const handleGenerateSummary = async (force: boolean = false) => {
    try {
      setIsSummarizing(true);
      setErrorMsg(null);

      const res = await fetch(`/api/news/${currentArticle._id}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRetry: force }),
      });

      const data = await res.json();
      if (res.ok && data.article) {
        setCurrentArticle(data.article);
      } else {
        setErrorMsg(data.error || "Failed to generate summary");
      }
    } catch {
      setErrorMsg("Network error when communicating with summary server.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Automatically trigger summarization on-demand when user opens an unsummarized article
  useEffect(() => {
    if (
      !hasTriggeredRef.current &&
      !currentArticle.summary &&
      currentArticle.summaryStatus !== "completed"
    ) {
      hasTriggeredRef.current = true;
      handleGenerateSummary(false);
    }
  }, [currentArticle._id, currentArticle.summary, currentArticle.summaryStatus]);

  const techSummary = isTech ? (summary as TechnologySummary) : null;
  const bizSummary = !isTech ? (summary as BusinessSummary) : null;

  const renderSummaryGrid = (isSplit = false) => {
    if (!summary) return null;

    return (
      <div
        className={
          isSplit
            ? "grid grid-cols-1 gap-5 items-stretch"
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
        }
      >
        {/* Row 1: Overview */}
        {summary.overview && (
          <SummarySection
            label="OVERVIEW"
            badge="EXECUTIVE SYNTHESIS"
            className={
              !isSplit && summary.key_takeaways && summary.key_takeaways.length > 0
                ? "md:col-span-2 lg:col-span-2"
                : "col-span-1"
            }
          >
            <div className="space-y-3.5">
              {summary.overview
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((para, idx) => (
                  <p key={idx}>{para.trim()}</p>
                ))}
            </div>
          </SummarySection>
        )}

        {/* Row 1: Key Takeaways */}
        {summary.key_takeaways && summary.key_takeaways.length > 0 && (
          <KeyTakeaways takeaways={summary.key_takeaways} className="col-span-1" />
        )}

        {/* Row 2: Background */}
        {summary.background && (
          <SummarySection label="BACKGROUND" badge="CONTEXT" className="col-span-1">
            <div className="space-y-3">
              {summary.background
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((para, idx) => (
                  <p key={idx}>{para.trim()}</p>
                ))}
            </div>
          </SummarySection>
        )}

        {/* Row 2: What Happened */}
        {summary.what_happened && (
          <SummarySection label="WHAT HAPPENED" badge="CHRONOLOGY" className="col-span-1">
            <div className="space-y-3">
              {summary.what_happened
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((para, idx) => (
                  <p key={idx}>{para.trim()}</p>
                ))}
            </div>
          </SummarySection>
        )}

        {/* Key Details (Tech) or Business Details (Biz) */}
        {techSummary && techSummary.key_details?.length > 0 && (
          <SummarySection label="KEY DETAILS" badge="TECHNICAL SPECIFICS" className="col-span-1">
            <ul className="space-y-2.5">
              {techSummary.key_details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono text-xs text-[#666666] shrink-0 pt-1">&bull;</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </SummarySection>
        )}

        {bizSummary && bizSummary.business_details?.length > 0 && (
          <SummarySection label="BUSINESS DETAILS" badge="TRANSACTION DATA" className="col-span-1">
            <ul className="space-y-2.5">
              {bizSummary.business_details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono text-xs text-[#666666] shrink-0 pt-1">&bull;</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </SummarySection>
        )}

        {/* Technology Explained (Tech) */}
        {techSummary && techSummary.technology_explained && (
          <SummarySection label="TECHNOLOGY EXPLAINED" badge="ARCHITECTURE" className="col-span-1">
            <div className="space-y-3">
              {techSummary.technology_explained
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((para, idx) => (
                  <p key={idx}>{para.trim()}</p>
                ))}
            </div>
          </SummarySection>
        )}

        {/* Financial Details (Biz) */}
        {bizSummary && bizSummary.financial_details?.length > 0 && (
          <FinancialDetails details={bizSummary.financial_details} className="col-span-1" />
        )}

        {/* Regulatory Context (Biz) */}
        {bizSummary && bizSummary.regulatory_context && (
          <SummarySection label="REGULATORY CONTEXT" badge="RBI / SEBI / GOVT" className="col-span-1">
            <div className="space-y-3">
              {bizSummary.regulatory_context
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((para, idx) => (
                  <p key={idx}>{para.trim()}</p>
                ))}
            </div>
          </SummarySection>
        )}

        {/* Market & Economic Context (Biz) */}
        {bizSummary && bizSummary.market_economic_context && (
          <SummarySection label="MARKET CONTEXT" badge="MACRO IMPACT" className="col-span-1">
            <div className="space-y-3">
              {bizSummary.market_economic_context
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((para, idx) => (
                  <p key={idx}>{para.trim()}</p>
                ))}
            </div>
          </SummarySection>
        )}

        {/* Impact & Significance */}
        {summary.impact && (
          <SummarySection label="IMPACT &amp; SIGNIFICANCE" badge="ANALYSIS" className="col-span-1">
            <div className="space-y-3">
              {summary.impact
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((para, idx) => (
                  <p key={idx}>{para.trim()}</p>
                ))}
            </div>
          </SummarySection>
        )}

        {/* Statements & Claims */}
        {summary.statements_and_claims && summary.statements_and_claims.length > 0 && (
          <SummarySection label="STATEMENTS &amp; CLAIMS" badge="DIRECT QUOTES" className="col-span-1">
            <div className="space-y-3">
              {summary.statements_and_claims.map((claim, idx) => (
                <blockquote
                  key={idx}
                  className="border-l-2 border-[#444444] pl-3 py-1 italic text-xs sm:text-sm text-[#cccccc]"
                >
                  &ldquo;{claim}&rdquo;
                </blockquote>
              ))}
            </div>
          </SummarySection>
        )}

        {/* Companies & Organizations */}
        {summary.companies_and_organizations &&
          summary.companies_and_organizations.length > 0 && (
            <OrganizationsList
              organizations={summary.companies_and_organizations}
              className="col-span-1"
            />
          )}

        {/* People Mentioned */}
        {summary.people && summary.people.length > 0 && (
          <PeopleList people={summary.people} className="col-span-1" />
        )}

        {/* Risks & Uncertainties (Biz) */}
        {bizSummary && bizSummary.risks_and_uncertainties?.length > 0 && (
          <SummarySection label="RISKS &amp; UNCERTAINTIES" badge="VULNERABILITIES" className="col-span-1">
            <ul className="space-y-2">
              {bizSummary.risks_and_uncertainties.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-xs text-[#666666] shrink-0 pt-0.5">&bull;</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </SummarySection>
        )}

        {/* Future Developments */}
        {summary.future_developments && summary.future_developments.length > 0 && (
          <SummarySection label="FUTURE DEVELOPMENTS" badge="OUTLOOK" className="col-span-1">
            <ul className="space-y-2">
              {summary.future_developments.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-xs text-[#666666] shrink-0 pt-0.5">&bull;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SummarySection>
        )}
      </div>
    );
  };

  return (
    <article className="w-full space-y-8">
      {/* Editorial Article Header */}
      <ArticleHeader
        category={currentArticle.category}
        publishedAt={currentArticle.publishedAt}
        headline={summary?.headline || currentArticle.title}
        author={currentArticle.author}
        source={currentArticle.source}
      />

      {/* AI Indicator Badge */}
      <AISummaryBadge source={currentArticle.source} />

      {/* While summarizing: Render the full AI Summary Skeleton Layout */}
      {isSummarizing && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border border-[#242424] bg-[#0a0a0a] px-5 py-3.5">
            <div className="flex items-center gap-2.5 font-mono text-xs text-white uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>✦ SYNTHESIZING AI EXECUTIVE SUMMARY</span>
            </div>
            <span className="font-mono text-[11px] text-[#666666] uppercase hidden sm:inline">
              PREPARING MULTI-COLUMN INTELLIGENCE GRID
            </span>
          </div>

          <AISummarySkeleton />
        </div>
      )}

      {/* Error / Manual Retry Notice */}
      {!isSummarizing && (!summary || currentArticle.summaryStatus !== "completed") && (
        <div className="border border-[#333333] bg-[#0a0a0a] p-6 w-full space-y-3">
          <div className="font-mono text-xs uppercase text-white font-bold tracking-wider">
            {currentArticle.summaryStatus === "failed"
              ? "SUMMARY GENERATION FAILED"
              : "SUMMARY NOT YET GENERATED"}
          </div>
          <p className="text-xs text-[#888888]">
            {errorMsg ||
              currentArticle.summaryError ||
              "An in-depth summary has not been generated for this article yet. You can read the original reporting below."}
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleGenerateSummary(true)}
              className="font-mono text-xs uppercase px-4 py-2 border border-[#444444] bg-[#141414] hover:bg-white hover:text-black text-white transition-colors"
            >
              [ RETRY SUMMARY GENERATION ]
            </button>
          </div>
        </div>
      )}

      {/* PRIMARY ORIGINAL REPORTING AT TOP: Displayed immediately when summary is not ready yet */}
      {!isSummaryReady && currentArticle.content && (
        <section className="space-y-3">
          <div className="flex items-center justify-between font-mono text-[11px] text-[#888888] uppercase tracking-wider">
            <span>FULL ORIGINAL REPORTING (READ WHILE AI SUMMARY PREPARES)</span>
            <span>{currentArticle.source?.toUpperCase() || "THE HINDU"}</span>
          </div>
          <FormattedArticleContent
            content={currentArticle.content}
            source={currentArticle.source}
            sourceUrl={currentArticle.sourceUrl}
          />
        </section>
      )}

      {/* VIEW SWITCHER TOOLBAR (When summary IS ready) */}
      {isSummaryReady && (
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-[#242424]">
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setViewMode("summary")}
              className={`px-3 py-1.5 border transition-colors uppercase tracking-wider ${
                viewMode === "summary"
                  ? "bg-white text-black font-semibold border-white"
                  : "bg-[#0a0a0a] text-[#888888] border-[#242424] hover:text-white"
              }`}
            >
              ✦ AI SUMMARY
            </button>

            {currentArticle.content && (
              <button
                onClick={() => setViewMode("original")}
                className={`px-3 py-1.5 border transition-colors uppercase tracking-wider ${
                  viewMode === "original"
                    ? "bg-white text-black font-semibold border-white"
                    : "bg-[#0a0a0a] text-[#888888] border-[#242424] hover:text-white"
                }`}
              >
                📰 ORIGINAL REPORTING
              </button>
            )}

            {currentArticle.content && (
              <button
                onClick={() => setViewMode("split")}
                className={`hidden lg:inline-flex px-3 py-1.5 border transition-colors uppercase tracking-wider ${
                  viewMode === "split"
                    ? "bg-white text-black font-semibold border-white"
                    : "bg-[#0a0a0a] text-[#888888] border-[#242424] hover:text-white"
                }`}
              >
                ⚇ TWO SIDES (SPLIT VIEW)
              </button>
            )}
          </div>

          <div className="font-mono text-[11px] text-[#666666] hidden sm:block uppercase">
            VIEW: {viewMode === "split" ? "TWO SIDES (SIDE-BY-SIDE)" : viewMode}
          </div>
        </div>
      )}

      {/* ACTIVE CONTENT VIEW */}
      {isSummaryReady && (
        <>
          {viewMode === "summary" && renderSummaryGrid(false)}

          {viewMode === "original" && currentArticle.content && (
            <FormattedArticleContent
              content={currentArticle.content}
              source={currentArticle.source}
              sourceUrl={currentArticle.sourceUrl}
            />
          )}

          {viewMode === "split" && currentArticle.content && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Formatted Original Article */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
                <FormattedArticleContent
                  content={currentArticle.content}
                  source={currentArticle.source}
                  sourceUrl={currentArticle.sourceUrl}
                />
              </div>

              {/* Right Column: AI Summary Cards */}
              <div className="lg:col-span-7">
                {renderSummaryGrid(true)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Original Reporting Link */}
      <SourceLink url={currentArticle.sourceUrl} sourceName={currentArticle.source} />
    </article>
  );
}
