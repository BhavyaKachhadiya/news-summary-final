import React from "react";
import Link from "next/link";

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = "NO NEWS FOUND",
  message = "There are no articles matching your current filter.",
  actionText = "VIEW ALL STORIES",
  actionHref = "/",
  onAction,
}: EmptyStateProps) {
  return (
    <div className="border border-[#242424] bg-[#0a0a0a] p-12 text-center my-8 max-w-lg mx-auto">
      <h3 className="font-mono text-sm uppercase text-white font-semibold tracking-wider mb-2">
        {title}
      </h3>
      <p className="text-xs text-[#888888] mb-6 leading-relaxed max-w-sm mx-auto">
        {message}
      </p>

      {onAction ? (
        <button
          onClick={onAction}
          className="font-mono text-xs uppercase px-4 py-2 border border-[#333333] bg-[#141414] hover:bg-white hover:text-black text-white transition-colors"
        >
          [ {actionText} ]
        </button>
      ) : actionHref ? (
        <Link
          href={actionHref}
          className="inline-block font-mono text-xs uppercase px-4 py-2 border border-[#333333] bg-[#141414] hover:bg-white hover:text-black text-white transition-colors"
        >
          [ {actionText} ]
        </Link>
      ) : null}
    </div>
  );
}
