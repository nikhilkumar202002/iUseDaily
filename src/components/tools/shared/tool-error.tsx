"use client";

import React from "react";
import { AlertCircle, RefreshCw, X } from "lucide-react";

export interface ToolErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ToolError({
  title = "Processing Error",
  message,
  onRetry,
  onDismiss,
  className = "",
}: ToolErrorProps) {
  return (
    <div
      role="alert"
      className={`rounded-2xl border border-destructive/20 bg-destructive/10 p-5 shadow-sm text-foreground animate-in fade-in duration-200 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground shadow-sm">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-destructive">{title}</h4>
            <p className="text-xs leading-relaxed text-muted-foreground">{message}</p>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {onRetry && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ToolError;
