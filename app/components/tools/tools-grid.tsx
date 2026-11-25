"use client";

import React from "react";
import { SearchX, RotateCcw } from "lucide-react";
import { ToolCard } from "./tool-card";
import type { Tool } from "@/app/config/tools";

interface ToolsGridProps {
  tools: Tool[];
  totalCount: number;
  selectedCategoryName: string;
  searchQuery: string;
  onResetFilters: () => void;
}

export function ToolsGrid({
  tools: displayedTools,
  totalCount,
  selectedCategoryName,
  searchQuery,
  onResetFilters,
}: ToolsGridProps) {
  const isFiltered = searchQuery.trim().length > 0 || selectedCategoryName !== "All Tools";

  return (
    <section className="mb-20">
      {/* Section Header with Tool Count */}
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {searchQuery.trim() ? "Search results" : selectedCategoryName}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            {searchQuery.trim() ? (
              <>
                Showing {displayedTools.length} result{displayedTools.length === 1 ? "" : "s"} for{" "}
                <span className="font-semibold text-foreground">&quot;{searchQuery}&quot;</span>
              </>
            ) : (
              <>
                Showing {displayedTools.length} of {totalCount} total tools
              </>
            )}
          </p>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-primary transition-opacity hover:opacity-80 sm:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Tools Grid or Empty State */}
      {displayedTools.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <SearchX className="h-7 w-7" />
          </div>

          <h3 className="mt-4 text-base font-bold text-foreground">
            No tools found
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
            We couldn&apos;t find any tools matching your criteria. Try adjusting your search or clearing the active category.
          </p>

          <button
            type="button"
            onClick={onResetFilters}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear filters</span>
          </button>
        </div>
      )}
    </section>
  );
}

export default ToolsGrid;
