"use client";

import { useState, useMemo } from "react";
import type { QueryCategory } from "@/types";
import { QUERIES } from "@/data/queries";
import CategoryFilter from "@/components/ui/CategoryFilter";
import QueryCard from "@/components/query/QueryCard";

export default function ExplorerPage() {
  const [selectedCategory, setSelectedCategory] = useState<
    QueryCategory | "All"
  >("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return QUERIES.filter((q) => {
      if (selectedCategory !== "All" && q.category !== selectedCategory) {
        return false;
      }
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        return (
          q.title.toLowerCase().includes(lower) ||
          q.description.toLowerCase().includes(lower) ||
          q.category.toLowerCase().includes(lower)
        );
      }
      return true;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Query Explorer</h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">
            Browse {QUERIES.length} example queries. Each includes runnable SQL, curl, TypeScript, and Python snippets.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries..."
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pl-10 pr-4 text-sm placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
          />
        </div>

        {/* Category filter */}
        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Results count */}
        <p className="text-sm text-[var(--color-text-secondary)]">
          Showing {filtered.length} of {QUERIES.length} queries
        </p>

        {/* Query cards */}
        <div className="space-y-3">
          {filtered.map((query) => (
            <QueryCard
              key={query.id}
              query={query}
              isExpanded={expandedId === query.id}
              onToggle={() =>
                setExpandedId(expandedId === query.id ? null : query.id)
              }
            />
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
              No queries match your search. Try a different term or category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
