"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { tools, categories, type Tool } from "@/app/config/tools";
import { ToolsHeader } from "@/app/components/tools/tools-header";
import { ToolsCategories } from "@/app/components/tools/tools-categories";
import { PopularTools } from "@/app/components/tools/popular-tools";
import { ToolsGrid } from "@/app/components/tools/tools-grid";

function ToolsDirectoryContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const initialCategory = searchParams.get("category") ?? "all";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Calculate tool count for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: tools.length,
    };

    categories.forEach((cat) => {
      if (cat.id !== "all") {
        counts[cat.id] = tools.filter((t) => t.category === cat.id).length;
      }
    });

    return counts;
  }, []);

  // Filter tools based on search query and category
  const filteredTools = useMemo(() => {
    return tools.filter((tool: Tool) => {
      const matchesCategory =
        selectedCategory === "all" || tool.category === selectedCategory;

      const trimmed = searchQuery.trim().toLowerCase();
      const matchesSearch =
        trimmed.length === 0 ||
        tool.name.toLowerCase().includes(trimmed) ||
        tool.description.toLowerCase().includes(trimmed) ||
        tool.category.toLowerCase().includes(trimmed);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);
  const selectedCategoryName = selectedCategoryObj ? selectedCategoryObj.name : "All Tools";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  // Only show popular tools when no search is active and all tools category is selected
  const isDefaultView = searchQuery.trim().length === 0 && selectedCategory === "all";

  return (
    <div className="min-h-screen px-4 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Hero Section & Search */}
        <ToolsHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery("")}
        />

        {/* Category Navigation Pills */}
        <div className="mb-10">
          <ToolsCategories
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
          />
        </div>

        {/* Featured Tools (Visible on default browsing state) */}
        {isDefaultView && <PopularTools />}

        {/* All Tools Grid with Live Filter and Count */}
        <ToolsGrid
          tools={filteredTools}
          totalCount={tools.length}
          selectedCategoryName={selectedCategoryName}
          searchQuery={searchQuery}
          onResetFilters={handleResetFilters}
        />
      </div>
    </div>
  );
}

export default function ToolsDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ToolsDirectoryContent />
    </Suspense>
  );
}
