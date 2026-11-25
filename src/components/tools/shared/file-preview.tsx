"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { X, FileText, Download, Layers, Maximize2 } from "lucide-react";
import type { ToolFile } from "./types";

export interface FilePreviewProps {
  file: ToolFile | null;
  onClose: () => void;
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!file) return null;

  const isImage = file.type.startsWith("image/") && file.previewUrl;
  const isPdf = file.extension.toLowerCase() === "pdf";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${file.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-blue text-primary">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-foreground">
                {file.name}
              </h3>
              <p className="text-xs text-muted-foreground">{file.formattedSize}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-1 items-center justify-center overflow-auto p-6">
          {isImage && file.previewUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative max-h-[50vh] max-w-full overflow-hidden rounded-2xl border border-border">
                <Image
                  src={file.previewUrl}
                  alt={file.name}
                  width={600}
                  height={400}
                  unoptimized
                  className="max-h-[50vh] w-auto object-contain"
                />
              </div>
              {file.dimensions && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Maximize2 className="h-3 w-3 text-primary" />
                  {file.dimensions.width} × {file.dimensions.height} px
                </span>
              )}
            </div>
          ) : isPdf ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-blue text-primary shadow-sm">
                <FileText className="h-8 w-8" />
              </div>
              <h4 className="mt-4 text-base font-semibold text-foreground">
                PDF Document Ready
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Verified client-side via pdf-lib
              </p>
              {file.pageCount !== undefined && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                  <Layers className="h-4 w-4" />
                  <span>{file.pageCount} Pages total</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Preview not available for this file type.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-3">
          <span className="text-[11px] text-muted-foreground">
            Processed locally in your browser
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Close
            </button>
            {file.previewUrl && (
              <a
                href={file.previewUrl}
                download={file.name}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilePreview;
