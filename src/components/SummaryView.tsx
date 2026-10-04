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
import { FormattedMarkdownText } from "./FormattedMarkdownText";

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
  const [toastStatus, setToastStatus] = useState<"idle" | "generating" | "completed">("idle");
  const hasTriggeredRef = useRef(false);
  const summarySectionRef = useRef<HTMLDivElement>(null);
  const skeletonRef = useRef<HTMLDivElement>(null);

  const isTech = currentArticle.category === "technology";
  const summary = currentArticle.summary;
  const isSummaryReady = Boolean(summary && currentArticle.summaryStatus === "completed");

  const handleGenerateSummary = async (force: boolean = false) => {
    try {
      setIsSummarizing(true);
      setErrorMsg(null);
      setToastStatus("generating");

      const res = await fetch(`/api/news/${currentArticle._id}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRetry: force }),
      });

      const data = await res.json();
      if (res.ok && data.article) {
        setCurrentArticle(data.article);
        setViewMode("summary");
        setToastStatus("completed");

        // Automatically navigate / smooth scroll down to the generated summary
        setTimeout(() => {
          summarySectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 250);

        // Auto-dismiss the completed toast after 5 seconds
        setTimeout(() => {
          setToastStatus("idle");
        }, 5000);
      } else {
        setErrorMsg(data.error || "Failed to generate summary");
        setToastStatus("idle");
      }
    } catch {
      setErrorMsg("Network error when communicating with summary server.");
      setToastStatus("idle");
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
            : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
        }
      >
        {/* Row 1: Overview (8 cols) & Key Takeaways (4 cols) */}
        {summary.overview && (
          <SummarySection
            label="OVERVIEW"
            badge="EXECUTIVE SYNTHESIS"
            className={
              !isSplit && summary.key_takeaways && summary.key_takeaways.length > 0
                ? "lg:col-span-8"
                : "lg:col-span-12"
            }
          >
            <div className="space-y-3.5">
              {summary.overview
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((para, idx) => (
                  <p key={idx}>
                    <FormattedMarkdownText text={para.trim()} />
                  </p>
                ))}
            </div>
          </SummarySection>
        )}

        {summary.key_takeaways && summary.key_takeaways.length > 0 && (
          <KeyTakeaways
            takeaways={summary.key_takeaways}
            className={!isSplit && summary.overview ? "lg:col-span-4" : "lg:col-span-12"}
          />
        )}

        {/* Row 2: What Happened (7 cols - Wide Chronology) & Background (5 cols - Context Sidebar) */}
        {summary.what_happened && (
          <SummarySection
            label="WHAT HAPPENED"
            badge="CHRONOLOGY &amp; EVENT"
            className={!isSplit && summary.background ? "lg:col-span-7" : "lg:col-span-12"}
          >
            <div className="space-y-3">
              {summary.what_happened
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((para, idx) => (
                  <p key={idx}>
                    <FormattedMarkdownText text={para.trim()} />
                  </p>
                ))}
            </div>
          </SummarySection>
        )}

        {summary.background && (
          <SummarySection
            label="BACKGROUND"
            badge="CONTEXT &amp; HISTORY"
            className={!isSplit && summary.what_happened ? "lg:col-span-5" : "lg:col-span-12"}
          >
            <div className="space-y-3">
              {summary.background
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((para, idx) => (
                  <p key={idx}>
                    <FormattedMarkdownText text={para.trim()} />
                  </p>
                ))}
            </div>
          </SummarySection>
        )}

        {/* Row 3: Conceptual Depth (7 cols) & Specifics / Data (5 cols) */}
        {techSummary && techSummary.technology_explained && (
          <SummarySection
            label="TECHNOLOGY EXPLAINED"
            badge="ARCHITECTURE &amp; MECHANISM"
            className={
              !isSplit && techSummary.key_details?.length > 0
                ? "lg:col-span-7"
                : "lg:col-span-12"
            }
          >
            <div className="space-y-3">
              {techSummary.technology_explained
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((para, idx) => (
                  <p key={idx}>
                    <FormattedMarkdownText text={para.trim()} />
                  </p>
                ))}
            </div>
          </SummarySection>
        )}

        {techSummary && techSummary.key_details?.length > 0 && (
          <SummarySection
            label="KEY DETAILS"
            badge="TECHNICAL SPECIFICS"
            className={
              !isSplit && techSummary.technology_explained
                ? "lg:col-span-5"
                : "lg:col-span-12"
            }
          >
            <ul className="space-y-2.5">
              {techSummary.key_details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono text-xs text-[#666666] shrink-0 pt-1">&bull;</span>
                  <span>
                    <FormattedMarkdownText text={detail} />
                  </span>
                </li>
              ))}
            </ul>
          </SummarySection>
        )}

        {bizSummary && bizSummary.regulatory_context && (
          <SummarySection
            label="REGULATORY CONTEXT"
            badge="RBI / SEBI / GOVT"
            className={
              !isSplit && bizSummary.business_details?.length > 0
                ? "lg:col-span-7"
                : "lg:col-span-12"
            }
          >
            <div className="space-y-3">
              {bizSummary.regulatory_context
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((para, idx) => (
                  <p key={idx}>
                    <FormattedMarkdownText text={para.trim()} />
                  </p>
                ))}
            </div>
          </SummarySection>
        )}

        {bizSummary && bizSummary.business_details?.length > 0 && (
          <SummarySection
            label="BUSINESS DETAILS"
            badge="TRANSACTION DATA"
            className={
              !isSplit && bizSummary.regulatory_context
                ? "lg:col-span-5"
                : "lg:col-span-12"
            }
          >
            <ul className="space-y-2.5">
              {bizSummary.business_details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono text-xs text-[#666666] shrink-0 pt-1">&bull;</span>
                  <span>
                    <FormattedMarkdownText text={detail} />
                  </span>
                </li>
              ))}
            </ul>
          </SummarySection>
        )}

        {/* Row 4: Strategic Impact & Significance (1 Column Full Width - Feature Section) */}
        {summary.impact && (
          <SummarySection
            label="IMPACT &amp; SIGNIFICANCE"
            badge="STRATEGIC IMPLICATIONS"
            className="col-span-1 lg:col-span-12 border-[#333333] bg-[#0c0c0c]"
          >
            <div className="space-y-3">
              {summary.impact
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((para, idx) => (
                  <p key={idx}>
                    <FormattedMarkdownText text={para.trim()} />
                  </p>
                ))}
            </div>
          </SummarySection>
        )}

        {/* Row 5: Financial Metrics (5 cols) & Market Context (7 cols) */}
        {bizSummary && bizSummary.financial_details?.length > 0 && (
          <FinancialDetails
            details={bizSummary.financial_details}
            className={
              !isSplit && bizSummary.market_economic_context
                ? "lg:col-span-5"
                : "lg:col-span-12"
            }
          />
        )}

        {bizSummary && bizSummary.market_economic_context && (
          <SummarySection
            label="MARKET CONTEXT"
            badge="MACRO IMPACT"
            className={
              !isSplit && bizSummary.financial_details?.length > 0
                ? "lg:col-span-7"
                : "lg:col-span-12"
            }
          >
            <div className="space-y-3">
              {bizSummary.market_economic_context
                .split(/\n\s*\n/)
                .filter((p) => p.trim())
                .map((para, idx) => (
                  <p key={idx}>
                    <FormattedMarkdownText text={para.trim()} />
                  </p>
                ))}
            </div>
          </SummarySection>
        )}

        {/* Row 6: Statements & Direct Quotes (1 Column Full Width) */}
        {summary.statements_and_claims && summary.statements_and_claims.length > 0 && (
          <SummarySection
            label="STATEMENTS &amp; CLAIMS"
            badge="DIRECT QUOTES"
            className="col-span-1 lg:col-span-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.statements_and_claims.map((claim, idx) => (
                <blockquote
                  key={idx}
                  className="border-l-2 border-[#555555] bg-[#0d0d0d] p-3 italic text-xs sm:text-sm text-[#cccccc]"
                >
                  &ldquo;
                  <FormattedMarkdownText text={claim} />
                  &rdquo;
                </blockquote>
              ))}
            </div>
          </SummarySection>
        )}

        {/* Row 7: Entities & People (Balanced 2-Column Split: 6 cols + 6 cols) */}
        {summary.companies_and_organizations &&
          summary.companies_and_organizations.length > 0 && (
            <OrganizationsList
              organizations={summary.companies_and_organizations}
              className={
                !isSplit && summary.people && summary.people.length > 0
                  ? "lg:col-span-6"
                  : "lg:col-span-12"
              }
            />
          )}

        {summary.people && summary.people.length > 0 && (
          <PeopleList
            people={summary.people}
            className={
              !isSplit &&
              summary.companies_and_organizations &&
              summary.companies_and_organizations.length > 0
                ? "lg:col-span-6"
                : "lg:col-span-12"
            }
          />
        )}

        {/* Row 8: Forward Outlook & Risks (Balanced 2-Column Split: 6 cols + 6 cols) */}
        {bizSummary && bizSummary.risks_and_uncertainties?.length > 0 && (
          <SummarySection
            label="RISKS &amp; UNCERTAINTIES"
            badge="VULNERABILITIES"
            className={
              !isSplit && summary.future_developments?.length > 0
                ? "lg:col-span-6"
                : "lg:col-span-12"
            }
          >
            <ul className="space-y-2">
              {bizSummary.risks_and_uncertainties.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-xs text-[#666666] shrink-0 pt-0.5">&bull;</span>
                  <span>
                    <FormattedMarkdownText text={risk} />
                  </span>
                </li>
              ))}
            </ul>
          </SummarySection>
        )}

        {summary.future_developments && summary.future_developments.length > 0 && (
          <SummarySection
            label="FUTURE DEVELOPMENTS"
            badge="OUTLOOK"
            className={
              !isSplit && (bizSummary?.risks_and_uncertainties?.length || 0) > 0
                ? "lg:col-span-6"
                : "lg:col-span-12"
            }
          >
            <ul className="space-y-2">
              {summary.future_developments.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-xs text-[#666666] shrink-0 pt-0.5">&bull;</span>
                  <span>
                    <FormattedMarkdownText text={item} />
                  </span>
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

      {/* ORIGINAL REPORTING FIRST: Available immediately to read while summary is preparing */}
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

      {/* THEN AI SUMMARY SKELETON WHILE SUMMARIZING */}
      {isSummarizing && (
        <div ref={skeletonRef} id="ai-summary-skeleton" className="space-y-6 scroll-mt-20">
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
              "An in-depth summary has not been generated for this article yet. You can read the original reporting above."}
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

      {/* VIEW SWITCHER TOOLBAR & SUMMARY (When summary IS ready) */}
      {isSummaryReady && (
        <section ref={summarySectionRef} id="ai-summary-section" className="space-y-8 scroll-mt-20">
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

          {/* ACTIVE CONTENT VIEW */}
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
        </section>
      )}

      {/* Original Reporting Link */}
      <SourceLink url={currentArticle.sourceUrl} sourceName={currentArticle.source} />

      {/* FLOATING AI GENERATION POPUP / TOAST */}
      {toastStatus !== "idle" && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-4 sm:right-8 z-50 max-w-[92vw] sm:max-w-md w-full bg-[#0a0a0a]/95 backdrop-blur-md border border-[#333333] shadow-[0_16px_48px_rgba(0,0,0,0.85)] p-4 sm:p-5 transition-all duration-300"
        >
          {toastStatus === "generating" ? (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping mt-1.5 shrink-0" />
                <div className="space-y-1">
                  <div className="font-mono text-xs text-white uppercase tracking-wider font-semibold">
                    ✦ AI SUMMARY IN PROGRESS
                  </div>
                  <p className="text-xs text-[#999999] leading-relaxed">
                    Synthesizing executive intelligence from original reporting. Navigating automatically once generated.
                  </p>
                  <div className="pt-1.5">
                    <button
                      onClick={() => {
                        skeletonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-[#333333] bg-[#141414] hover:bg-white hover:text-black text-[#cccccc] transition-colors"
                    >
                      VIEW SKELETON ↓
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setToastStatus("idle")}
                className="text-[#666666] hover:text-white text-xs font-mono p-1 shrink-0"
                aria-label="Dismiss notice"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-white text-xs font-mono font-bold shrink-0">
                  ✓
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-xs text-white uppercase tracking-wider font-semibold">
                    ✦ AI SUMMARY READY
                  </div>
                  <p className="text-xs text-[#cccccc] leading-relaxed">
                    Executive summary successfully generated. Navigating to summary section...
                  </p>
                  <div className="pt-1.5">
                    <button
                      onClick={() => {
                        summarySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 border border-white bg-white text-black font-semibold hover:bg-transparent hover:text-white transition-colors"
                    >
                      JUMP TO SUMMARY ↑
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setToastStatus("idle")}
                className="text-[#666666] hover:text-white text-xs font-mono p-1 shrink-0"
                aria-label="Dismiss notice"
              >
                ✕
              </button>
            </div>
          )}
        </aside>
      )}
    </article>
  );
}
