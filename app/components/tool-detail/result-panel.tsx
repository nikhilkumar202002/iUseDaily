"use client";

import React, { useState } from "react";
import { CheckCircle2, Download, Copy, Check, RotateCcw, FileText } from "lucide-react";
import type { ProcessingResult } from "./types";

interface ResultPanelProps {
  result: ProcessingResult;
  onReset: () => void;
  title?: string;
  subtitle?: string;
  downloadButtonLabel?: string;
  resetButtonLabel?: string;
}

export function ResultPanel({
  result,
  onReset,
  title = "Ready for download",
  subtitle = "Your file has been successfully processed.",
  downloadButtonLabel = "Download File",
  resetButtonLabel = "Start over",
}: ResultPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (result.textOutput) {
      navigator.clipboard.writeText(result.textOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center sm:p-10 animate-in fade-in zoom-in-95 duration-200">
      {/* Success Badge */}
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
        <CheckCircle2 className="h-7 w-7" />
      </div>

      <h3 className="mt-4 text-xl font-bold text-foreground sm:text-2xl">
        {title}
      </h3>

      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
        {subtitle}
      </p>

      {/* Result Information Box */}
      <div className="mx-auto mt-6 max-w-md rounded-xl border border-border bg-card p-4 text-left shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-blue text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {result.fileName}
              </p>
              <p className="text-xs text-muted-foreground">
                {result.formattedSize}
                {result.itemCount ? ` • ${result.itemCount} pages/items` : ""}
              </p>
            </div>
          </div>

          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            Success
          </span>
        </div>

        {/* Text output preview if text-based */}
        {result.textOutput && (
          <div className="mt-3 max-h-36 overflow-y-auto rounded-lg bg-muted/50 p-3 font-mono text-xs text-foreground">
            {result.textOutput}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {result.downloadUrl && (
          <a
            href={result.downloadUrl}
            download={result.fileName}
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:opacity-95"
          >
            <Download className="h-4 w-4" />
            <span>{downloadButtonLabel}</span>
          </a>
        )}

        {result.textOutput && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:opacity-95"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied to clipboard" : "Copy output"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <RotateCcw className="h-4 w-4" />
          <span>{resetButtonLabel}</span>
        </button>
      </div>
    </div>
  );
}

export default ResultPanel;
