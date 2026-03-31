"use client";

import clsx from "clsx";
import { QUERY_CATEGORIES, type QueryCategory } from "@/types";

interface CategoryFilterProps {
  selected: QueryCategory | "All";
  onSelect: (category: QueryCategory | "All") => void;
}

export default function CategoryFilter({
  selected,
  onSelect,
}: CategoryFilterProps) {
  const categories: (QueryCategory | "All")[] = ["All", ...QUERY_CATEGORIES];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={clsx(
            "rounded-full px-3 py-1 text-sm font-medium transition-colors",
            selected === cat
              ? "bg-[var(--color-brand)] text-black"
              : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)]"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
