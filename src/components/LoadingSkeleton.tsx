import React from "react";

export function LoadingSkeletonCard() {
  return (
    <div className="border border-[#242424] bg-[#0a0a0a] p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-16 bg-[#1f1f1f]" />
        <div className="h-3 w-20 bg-[#1f1f1f]" />
      </div>
      <div className="space-y-2 py-1">
        <div className="h-5 w-full bg-[#1f1f1f]" />
        <div className="h-5 w-3/4 bg-[#1f1f1f]" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-[#161616]" />
        <div className="h-3 w-5/6 bg-[#161616]" />
        <div className="h-3 w-2/3 bg-[#161616]" />
      </div>
      <div className="pt-4 border-t border-[#1f1f1f] flex justify-between">
        <div className="h-3 w-20 bg-[#1f1f1f]" />
        <div className="h-3 w-24 bg-[#1f1f1f]" />
      </div>
    </div>
  );
}

export function LoadingSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <LoadingSkeletonCard key={i} />
      ))}
    </div>
  );
}
