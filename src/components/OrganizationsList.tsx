import React from "react";
import { OrganizationItem } from "@/types/news";

interface OrganizationsListProps {
  organizations: OrganizationItem[];
  className?: string;
}

export function OrganizationsList({
  organizations,
  className = "",
}: OrganizationsListProps) {
  if (!organizations || organizations.length === 0) return null;

  return (
    <section
      className={`border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 flex flex-col hover:border-[#383838] transition-colors ${className}`}
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1f1f1f]">
        <h3 className="font-mono text-xs uppercase tracking-widest text-[#a3a3a3] font-semibold">
          ENTITIES &amp; ORGANIZATIONS
        </h3>
        <span className="font-mono text-[10px] text-[#555555] uppercase">
          {organizations.length} ENTITIES
        </span>
      </div>

      <div className="space-y-2.5 flex-1">
        {organizations.map((org, idx) => (
          <div
            key={idx}
            className="border border-[#1e1e1e] bg-[#111111] p-2.5 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-xs">{org.name}</span>
              {org.type && (
                <span className="font-mono text-[9px] text-[#888888] uppercase px-1 py-0.5 border border-[#2a2a2a] bg-[#141414]">
                  {org.type}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#888888] leading-tight">
              {org.role || org.involvement}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
