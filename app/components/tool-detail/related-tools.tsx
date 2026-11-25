"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { tools, type Tool, type ToolCategory } from "@/app/config/tools";

interface RelatedToolsProps {
  currentToolId: string;
  category: ToolCategory;
  limit?: number;
}

export function RelatedTools({
  currentToolId,
  category,
  limit = 4,
}: RelatedToolsProps) {
  // Find related tools within the same category, excluding the current tool
  const relatedList: Tool[] = tools
    .filter((t) => t.id !== currentToolId && t.category === category)
    .slice(0, limit);

  // Fallback to other popular tools if category has fewer than limit
  const finalTools: Tool[] =
    relatedList.length >= limit
      ? relatedList
      : [
          ...relatedList,
          ...tools.filter(
            (t) =>
              t.id !== currentToolId &&
              !relatedList.some((r) => r.id === t.id)
          ),
        ].slice(0, limit);

  if (finalTools.length === 0) return null;

  return (
    <section aria-label="Related tools" className="mt-16 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Related Tools
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore other productivity tools you might find useful.
          </p>
        </div>
        <Link
          href={`/tools?category=${category}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
        >
          View all {category} tools
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {finalTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              href={tool.href}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-blue text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground group-hover:text-primary">
                  {tool.name}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {tool.description}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-1.5 pt-2">
                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {tool.category}
                </span>
                {(tool.popular || tool.featured) && (
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {tool.popular ? "Popular" : "Featured"}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default RelatedTools;
