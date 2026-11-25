"use client";

import React from "react";
import { ToolsSearch } from "./tools-search";

interface ToolsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}

export function ToolsHeader({
  searchQuery,
  onSearchChange,
  onClearSearch,
}: ToolsHeaderProps) {
  return (
    <div className="relative py-12 text-center sm:py-16">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Everyday tools, all in one place.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Simple, powerful and free online tools to make your everyday tasks easier.
        </p>

        {/* Search Field */}
        <div className="mt-8">
          <ToolsSearch
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onClearSearch={onClearSearch}
          />
        </div>
      </div>
    </div>
  );
}

export default ToolsHeader;
