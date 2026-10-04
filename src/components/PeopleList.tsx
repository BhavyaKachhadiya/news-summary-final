import React from "react";
import { PersonItem } from "@/types/news";

interface PeopleListProps {
  people: PersonItem[];
  className?: string;
}

export function PeopleList({ people, className = "" }: PeopleListProps) {
  if (!people || people.length === 0) return null;

  return (
    <section
      className={`border border-[#242424] bg-[#0a0a0a] p-5 sm:p-6 flex flex-col hover:border-[#383838] transition-colors ${className}`}
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1f1f1f]">
        <h3 className="font-mono text-xs uppercase tracking-widest text-[#a3a3a3] font-semibold">
          PEOPLE MENTIONED
        </h3>
        <span className="font-mono text-[10px] text-[#555555] uppercase">
          {people.length} FIGURES
        </span>
      </div>

      <div className="space-y-3 flex-1">
        {people.map((person, idx) => (
          <div
            key={idx}
            className="border-l-2 border-[#333333] pl-3 py-0.5 space-y-0.5"
          >
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="font-semibold text-white text-xs sm:text-sm">
                {person.name}
              </span>
              {person.role && (
                <span className="font-mono text-[10px] text-[#888888]">
                  &mdash; {person.role}
                </span>
              )}
            </div>
            {person.involvement && (
              <p className="text-[11px] text-[#999999] leading-relaxed">
                {person.involvement}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
