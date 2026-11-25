"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X, ArrowUpRight } from "lucide-react";
import { tools, type Tool } from "@/app/config/tools";

interface ToolsSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}

export function ToolsSearch({
  searchQuery,
  onSearchChange,
  onClearSearch,
}: ToolsSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener: ⌘K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) &&
        document.activeElement !== inputRef.current
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close suggestions dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute top 5 matching suggestions while typing
  const suggestions: Tool[] =
    searchQuery.trim().length > 0
      ? tools
          .filter(
            (t) =>
              t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.category.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5)
      : [];

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-2xl">
      {/* Search Input Box */}
      <div className="group relative flex h-14 w-full items-center rounded-2xl border border-border bg-card px-4 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary" />

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="What do you need to get done?"
          className="w-full bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground sm:text-base"
        />

        {/* Clear Button */}
        {searchQuery.trim().length > 0 && (
          <button
            type="button"
            onClick={() => {
              onClearSearch();
              setShowSuggestions(false);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Live Suggestions Dropdown while typing */}
      {showSuggestions && searchQuery.trim().length > 0 && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Suggestions
          </div>

          <div className="space-y-1">
            {suggestions.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  onClick={() => setShowSuggestions(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-blue text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {tool.name}
                      </p>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {tool.category}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ToolsSearch;
