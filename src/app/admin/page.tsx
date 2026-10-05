"use client";

import React, { useState, useEffect } from "react";
import { NewsStats, ArticleDocument } from "@/types/news";
import Link from "next/link";

export default function AdminPage() {
  const [stats, setStats] = useState<NewsStats | null>(null);
  const [articles, setArticles] = useState<ArticleDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "articles" | "health">("overview");

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsRes, articlesRes] = await Promise.all([
        fetch("/api/stats"),
        fetch(`/api/news?limit=50${filterStatus !== "all" ? `&status=${filterStatus}` : ""}`),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (articlesRes.ok) {
        const data = await articlesRes.json();
        setArticles(data.articles || []);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    let ignore = false;
    const fetchAdminData = async () => {
      try {
        const [statsRes, articlesRes] = await Promise.all([
          fetch("/api/stats"),
          fetch(`/api/news?limit=50${filterStatus !== "all" ? `&status=${filterStatus}` : ""}`),
        ]);

        if (!ignore && statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (!ignore && articlesRes.ok) {
          const data = await articlesRes.json();
          setArticles(data.articles || []);
        }
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchAdminData();

    return () => {
      ignore = true;
    };
  }, [filterStatus]);

  const handleSyncFeeds = async (retryFailed = false) => {
    try {
      setIsSyncing(true);
      setSyncMessage(retryFailed ? "Retrying failed summaries..." : "Syncing RSS feeds...");
      const res = await fetch(`/api/news/sync${retryFailed ? "?retryFailed=true" : ""}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(
          `Sync successful: ${data.sync?.newArticlesFound ?? 0} new articles ingested.`
        );
        await loadData();
      } else {
        setSyncMessage(`Error: ${data.error || "Sync failed"}`);
      }
    } catch {
      setSyncMessage("Network error during sync.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleRetryArticle = async (id: string) => {
    try {
      const res = await fetch(`/api/news/${id}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRetry: true }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Retry failed:", err);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      const res = await fetch(`/api/news/${id}`, { method: "DELETE" });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a._id !== id));
        await loadData();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Admin Header */}
      <div className="border-b border-[#242424] pb-6">
        <div className="flex items-center justify-between text-xs font-mono text-[#666666] tracking-widest uppercase mb-2">
          <span>OPERATIONS DASHBOARD</span>
          <span>SYSTEM CONTROLS</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
              ADMIN CONTROL PANEL
            </h1>
            <p className="text-sm text-[#888888] mt-1 font-mono">
              Monitor RSS pipelines, Gemini AI worker state, and article ingestions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSyncFeeds(false)}
              disabled={isSyncing}
              className="px-4 py-2 bg-white text-black font-mono text-xs font-bold uppercase hover:bg-[#cccccc] transition-colors disabled:opacity-50"
            >
              {isSyncing ? "SYNCING..." : "SYNC FEEDS NOW"}
            </button>
            <button
              onClick={() => handleSyncFeeds(true)}
              disabled={isSyncing}
              className="px-4 py-2 border border-[#333333] text-white font-mono text-xs uppercase hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
            >
              RETRY FAILED
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className="mt-4 p-3 bg-[#111111] border border-[#333333] text-xs font-mono text-[#00ff66]">
            {syncMessage}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-[#242424] pb-2 font-mono text-xs">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2 px-1 uppercase tracking-wider transition-colors ${
            activeTab === "overview"
              ? "text-white border-b-2 border-white font-bold"
              : "text-[#666666] hover:text-white"
          }`}
        >
          Overview &amp; Stats
        </button>
        <button
          onClick={() => setActiveTab("articles")}
          className={`pb-2 px-1 uppercase tracking-wider transition-colors ${
            activeTab === "articles"
              ? "text-white border-b-2 border-white font-bold"
              : "text-[#666666] hover:text-white"
          }`}
        >
          Article Registry ({stats?.total ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("health")}
          className={`pb-2 px-1 uppercase tracking-wider transition-colors ${
            activeTab === "health"
              ? "text-white border-b-2 border-white font-bold"
              : "text-[#666666] hover:text-white"
          }`}
        >
          System Health
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0a0a0a] border border-[#242424] p-4">
              <span className="font-mono text-[10px] text-[#666666] uppercase block">TOTAL ARTICLES</span>
              <span className="font-mono text-3xl font-bold text-white mt-2 block">
                {stats?.total ?? 0}
              </span>
            </div>
            <div className="bg-[#0a0a0a] border border-[#242424] p-4">
              <span className="font-mono text-[10px] text-[#00ff66] uppercase block">COMPLETED SUMMARIES</span>
              <span className="font-mono text-3xl font-bold text-[#00ff66] mt-2 block">
                {stats?.byStatus.completed ?? 0}
              </span>
            </div>
            <div className="bg-[#0a0a0a] border border-[#242424] p-4">
              <span className="font-mono text-[10px] text-[#ffaa00] uppercase block">PENDING / PROCESSING</span>
              <span className="font-mono text-3xl font-bold text-[#ffaa00] mt-2 block">
                {(stats?.byStatus.pending ?? 0) + (stats?.byStatus.processing ?? 0)}
              </span>
            </div>
            <div className="bg-[#0a0a0a] border border-[#242424] p-4">
              <span className="font-mono text-[10px] text-[#ff3333] uppercase block">FAILED SUMMARIES</span>
              <span className="font-mono text-3xl font-bold text-[#ff3333] mt-2 block">
                {stats?.byStatus.failed ?? 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0a0a0a] border border-[#242424] p-5">
              <h3 className="font-mono text-xs uppercase text-[#888888] mb-4">CATEGORIES BREAKDOWN</h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-2 border-b border-[#1a1a1a]">
                  <span className="text-[#aaaaaa]">TECHNOLOGY</span>
                  <span className="text-white font-bold">{stats?.byCategory.technology ?? 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#1a1a1a]">
                  <span className="text-[#aaaaaa]">BUSINESS</span>
                  <span className="text-white font-bold">{stats?.byCategory.business ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#242424] p-5">
              <h3 className="font-mono text-xs uppercase text-[#888888] mb-4">INGESTION TIMELINE</h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-2 border-b border-[#1a1a1a]">
                  <span className="text-[#aaaaaa]">LAST SYNC TIME</span>
                  <span className="text-white">
                    {stats?.lastSyncedAt
                      ? new Date(stats.lastSyncedAt).toLocaleString()
                      : "Never"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#1a1a1a]">
                  <span className="text-[#aaaaaa]">STUCK JOBS AUTO-RECOVERY</span>
                  <span className="text-[#00ff66]">ACTIVE (&lt;5 min timeout)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Articles Tab */}
      {activeTab === "articles" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[#666666] mr-2">FILTER BY STATUS:</span>
            {["all", "pending", "processing", "completed", "failed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1 uppercase transition-colors border ${
                  filterStatus === status
                    ? "bg-white text-black border-white font-bold"
                    : "border-[#242424] text-[#888888] hover:text-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="bg-[#0a0a0a] border border-[#242424] overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#141414] border-b border-[#242424] text-[#888888]">
                <tr>
                  <th className="p-3">ARTICLE TITLE</th>
                  <th className="p-3">CATEGORY</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">RETRIES</th>
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {articles.map((art) => (
                  <tr key={art._id} className="hover:bg-[#111111] transition-colors">
                    <td className="p-3 max-w-md">
                      <Link
                        href={`/article/${art._id}`}
                        className="text-white hover:underline line-clamp-1 font-sans font-medium"
                      >
                        {art.summary?.headline || art.title}
                      </Link>
                      <span className="text-[10px] text-[#666666] block truncate">
                        {art.sourceUrl}
                      </span>
                      {art.summaryError && (
                        <span className="text-[10px] text-[#ff3333] block truncate">
                          Err: {art.summaryError}
                        </span>
                      )}
                    </td>
                    <td className="p-3 uppercase text-[#888888]">{art.category}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold ${
                          art.summaryStatus === "completed"
                            ? "bg-[#00ff66]/10 text-[#00ff66]"
                            : art.summaryStatus === "processing"
                            ? "bg-[#ffaa00]/10 text-[#ffaa00]"
                            : art.summaryStatus === "failed"
                            ? "bg-[#ff3333]/10 text-[#ff3333]"
                            : "bg-[#888888]/10 text-[#aaaaaa]"
                        }`}
                      >
                        {art.summaryStatus}
                      </span>
                    </td>
                    <td className="p-3 text-[#666666]">{art.retryCount ?? 0}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleRetryArticle(art._id)}
                        className="px-2 py-1 border border-[#333333] text-[#aaaaaa] hover:text-white uppercase text-[10px]"
                      >
                        RETRY
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(art._id)}
                        className="px-2 py-1 border border-[#ff3333]/30 text-[#ff6666] hover:bg-[#ff3333]/10 uppercase text-[10px]"
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))}
                {articles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#666666]">
                      {isLoading ? "LOADING ARTICLES..." : "NO ARTICLES FOUND MATCHING FILTER."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Health Tab */}
      {activeTab === "health" && (
        <div className="bg-[#0a0a0a] border border-[#242424] p-6 space-y-4 font-mono text-xs">
          <h3 className="text-white text-sm uppercase font-bold pb-2 border-b border-[#242424]">
            SYSTEM HEALTH &amp; PROTECTIONS
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-[#242424] bg-[#000000] space-y-2">
              <span className="text-[#888888] block uppercase">SSRF PROTECTION</span>
              <p className="text-[#00ff66]">ACTIVE</p>
              <p className="text-[11px] text-[#666666]">
                DNS resolution validation, loopback/private IP blocking, manual redirect enforcement,
                max 3 redirects, domain whitelist.
              </p>
            </div>

            <div className="p-4 border border-[#242424] bg-[#000000] space-y-2">
              <span className="text-[#888888] block uppercase">ATOMIC PROCESSING LOCK</span>
              <p className="text-[#00ff66]">ACTIVE</p>
              <p className="text-[11px] text-[#666666]">
                MongoDB atomic findOneAndUpdate prevents duplicate Gemini requests. Auto-clears stuck
                locks after 5 minutes.
              </p>
            </div>

            <div className="p-4 border border-[#242424] bg-[#000000] space-y-2">
              <span className="text-[#888888] block uppercase">GEMINI RESILIENCE</span>
              <p className="text-[#00ff66]">ACTIVE</p>
              <p className="text-[11px] text-[#666666]">
                Concurrency queue limit (3), exponential backoff with random jitter, 429/500/503 quota
                handling, prompt injection sanitization.
              </p>
            </div>

            <div className="p-4 border border-[#242424] bg-[#000000] space-y-2">
              <span className="text-[#888888] block uppercase">API RATE LIMITING</span>
              <p className="text-[#00ff66]">ACTIVE</p>
              <p className="text-[11px] text-[#666666]">
                10 requests/min per IP on summarize endpoint. CRON_SECRET enforcement on sync and delete
                endpoints.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
