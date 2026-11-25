"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface ToolLoadingProps {
  label?: string;
  description?: string;
  progress?: number;
  className?: string;
}

export function ToolLoading({
  label = "Processing...",
  description = "Please wait while your files are being handled in your browser.",
  progress,
  className = "",
}: ToolLoadingProps) {
  const hasProgress = progress !== undefined && progress >= 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-10 text-center shadow-sm ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-blue text-primary shadow-sm animate-pulse">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>

      <h3 className="mt-4 text-base font-bold text-foreground sm:text-lg">
        {label}
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
        {description}
      </p>

      {hasProgress && (
        <div className="mt-6 w-full max-w-xs space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-primary">Progress</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ToolLoading;
