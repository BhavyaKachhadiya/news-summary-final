import React from "react";

interface FormattedMarkdownTextProps {
  text: string;
  className?: string;
  stripLeadingNumber?: boolean;
  highlightClass?: string;
}

/**
 * Renders text containing Markdown formatting such as **bold**, *italic*, and `code`
 * into clean React elements with proper typography and warm amber/gold highlighting.
 */
export function FormattedMarkdownText({
  text,
  className = "",
  stripLeadingNumber = false,
  highlightClass = "text-[#facc15] font-semibold",
}: FormattedMarkdownTextProps) {
  if (!text) return null;

  let processedText = text;
  if (stripLeadingNumber) {
    processedText = processedText
      .replace(/^\d+[\.\)]\s*/, "")
      .replace(/^[-*•]\s*/, "");
  }

  // Matches tokens: **bold** | *italic* | `code`
  const parts = processedText.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          return (
            <strong key={idx} className={highlightClass}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
          return (
            <em key={idx} className="italic text-[#d4d4d4]">
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
          return (
            <code
              key={idx}
              className="font-mono text-xs bg-[#1a1a1a] px-1 py-0.5 border border-[#2a2a2a] text-white"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </span>
  );
}
