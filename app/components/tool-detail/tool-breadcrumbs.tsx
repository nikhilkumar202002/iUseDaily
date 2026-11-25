"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { BreadcrumbItem } from "./types";

interface ToolBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function ToolBreadcrumbs({ items }: ToolBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
        {/* Home icon link */}
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 transition-colors hover:text-foreground"
            aria-label="Home"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.label} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default ToolBreadcrumbs;
