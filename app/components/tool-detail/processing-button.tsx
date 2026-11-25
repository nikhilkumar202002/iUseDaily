"use client";

import React from "react";
import { Loader2, ArrowRight } from "lucide-react";

interface ProcessingButtonProps {
  label: string;
  loadingLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}

export function ProcessingButton({
  label,
  loadingLabel = "Processing...",
  isLoading = false,
  disabled = false,
  onClick,
  className = "",
}: ProcessingButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`group relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-150 hover:opacity-95 hover:shadow-md hover:shadow-primary/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

export default ProcessingButton;
