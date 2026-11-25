"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

interface ToolPageHeaderProps {
  icon: LucideIcon;
  name: string;
  description: string;
  badge?: string;
}

export function ToolPageHeader({
  icon: Icon,
  name,
  description,
  badge = "Free",
}: ToolPageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-blue text-primary shadow-sm ring-1 ring-primary/10">
          <Icon className="h-6 w-6" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {name}
            </h1>

            {badge && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {badge}
              </span>
            )}
          </div>

          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ToolPageHeader;
