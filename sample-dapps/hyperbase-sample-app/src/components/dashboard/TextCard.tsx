"use client";

import ReactMarkdown from "react-markdown";

interface TextCardProps {
  content: string;
  cardType: "text" | "heading";
  editing?: boolean;
  onChange?: (content: string) => void;
}

export default function TextCard({ content, cardType, editing, onChange }: TextCardProps) {
  if (editing) {
    return (
      <div className="h-full p-3">
        <textarea
          value={content}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full h-full bg-transparent resize-none outline-none font-mono ${
            cardType === "heading"
              ? "text-xl font-bold"
              : "text-sm"
          }`}
          placeholder={cardType === "heading" ? "Heading..." : "Write markdown..."}
        />
      </div>
    );
  }

  if (cardType === "heading") {
    return (
      <div className="h-full flex items-center px-5 py-3">
        <h2 className="text-2xl font-bold tracking-display leading-tight">{content}</h2>
      </div>
    );
  }

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="prose-card">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
