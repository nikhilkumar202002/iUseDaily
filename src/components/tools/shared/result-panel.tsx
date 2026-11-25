"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Download,
  Copy,
  Check,
  RotateCcw,
  FileText,
  Layers,
} from "lucide-react";
import type { ProcessingResult } from "./types";
import { triggerDownload } from "../processors/other/other-utils";

export interface ResultPanelProps {
  result: ProcessingResult;
  onReset: () => void;
  title?: string;
  subtitle?: string;
  downloadLabel?: string;
  resetLabel?: string;
}

export function ResultPanel({
  result,
  onReset,
  title = "Ready for download",
  subtitle = "Your file has been successfully processed.",
  downloadLabel = "Download File",
  resetLabel = "Start over",
}: ResultPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (result.textOutput) {
      navigator.clipboard.writeText(result.textOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (result.downloadUrl) {
      triggerDownload(result.downloadUrl, result.fileName);
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center sm:p-10 animate-in fade-in zoom-in-95 duration-200">
      {/* Success Badge */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
        <CheckCircle2 className="h-7 w-7" />
      </div>

      <h3 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h3>

      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
        {subtitle}
      </p>

      {/* Output Details Box */}
      {result.outputFiles && result.outputFiles.length > 1 ? (
        <div className="mx-auto mt-6 w-full max-w-lg space-y-3 text-left">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-semibold text-foreground">
              Generated Files ({result.outputFiles.length})
            </span>
            <span className="text-muted-foreground">{result.formattedSize}</span>
          </div>

          <div className="max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-border bg-card p-3 shadow-sm">
            {result.outputFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 p-2.5 transition-colors hover:bg-muted/60"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-mono font-semibold text-muted-foreground">
                    {idx + 1}
                  </span>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-blue text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {file.formattedSize} • {file.pageCount} {file.pageCount === 1 ? "page" : "pages"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => triggerDownload(file.downloadUrl, file.name)}
                  aria-label={`Download ${file.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-foreground shadow-xs transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-6 w-full max-w-md rounded-2xl border border-border bg-card p-4 text-left shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-blue text-primary">
                <FileText className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {result.fileName}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{result.formattedSize}</span>
                  {result.pageCount !== undefined && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <Layers className="h-3 w-3 text-primary" />
                        {result.pageCount} pages
                      </span>
                    </>
                  )}
                  {result.itemCount !== undefined && (
                    <>
                      <span>•</span>
                      <span>{result.itemCount} files</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Text output preview if present */}
          {result.textOutput && (
            <div className="mt-3 max-h-36 overflow-auto rounded-xl bg-muted/50 p-3 font-mono text-xs text-foreground">
              {result.textOutput}
            </div>
          )}

          {/* Image output preview if present */}
          {result.previewUrl && (
            <div className="relative mt-3 flex justify-center overflow-hidden rounded-xl border border-border">
              <Image
                src={result.previewUrl}
                alt={result.fileName}
                width={400}
                height={200}
                unoptimized
                className="max-h-36 w-auto object-contain"
              />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {result.downloadUrl && (
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:opacity-95 active:scale-95 sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span>{downloadLabel}</span>
          </button>
        )}

        {result.textOutput && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:opacity-95 sm:w-auto"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied" : "Copy output"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted active:scale-95 sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" />
          <span>{resetLabel}</span>
        </button>
      </div>
    </div>
  );
}

export default ResultPanel;
