"use client";

import React from "react";
import { Loader2, ArrowRight, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ProcessingButtonProps {
  label: string;
  loadingLabel?: string;
  isProcessing: boolean;
  progress?: number; // 0 - 100 if actual progress exists
  disabled?: boolean;
  onClick: () => void;
  onCancel?: () => void;
  icon?: LucideIcon;
  className?: string;
}

export function ProcessingButton({
  label,
  loadingLabel = "Processing...",
  isProcessing,
  progress,
  disabled = false,
  onClick,
  onCancel,
  icon: Icon = ArrowRight,
  className = "",
}: ProcessingButtonProps) {
  const hasRealProgress = progress !== undefined && progress >= 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || isProcessing}
          aria-busy={isProcessing}
          className={`group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-150 hover:opacity-95 hover:shadow-md hover:shadow-primary/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${className}`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span>
                {hasRealProgress
                  ? `${loadingLabel} (${Math.round(progress)}%)`
                  : loadingLabel}
              </span>
            </>
          ) : (
            <>
              <span>{label}</span>
              <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        {isProcessing && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            title="Cancel processing"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Actual progress bar (only rendered when real progress exists) */}
      {isProcessing && hasRealProgress && (
        <div className="space-y-1 animate-in fade-in duration-200">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-200"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProcessingButton;
