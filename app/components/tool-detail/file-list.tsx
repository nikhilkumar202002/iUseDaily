"use client";

import React from "react";
import {
  FileText,
  FileImage,
  File,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
} from "lucide-react";
import type { UploadedFile } from "./types";

interface FileListProps {
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
  onMoveFile?: (fromIndex: number, toIndex: number) => void;
  onAddMoreClick?: () => void;
  disabled?: boolean;
}

export function FileList({
  files,
  onRemoveFile,
  onMoveFile,
  onAddMoreClick,
  disabled = false,
}: FileListProps) {
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return FileText;
    if (["png", "jpg", "jpeg", "webp", "svg"].includes(ext || "")) return FileImage;
    return File;
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const formattedTotalSize =
    totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(totalBytes / 1024).toFixed(0)} KB`;

  return (
    <div className="w-full">
      {/* Top summary row */}
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">
          {files.length} {files.length === 1 ? "file" : "files"} selected ({formattedTotalSize})
        </span>

        {onAddMoreClick && (
          <button
            type="button"
            onClick={onAddMoreClick}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 font-semibold text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add more files</span>
          </button>
        )}
      </div>

      {/* Files List */}
      <div className="space-y-2">
        {files.map((fileItem, index) => {
          const Icon = getFileIcon(fileItem.name);
          const isFirst = index === 0;
          const isLast = index === files.length - 1;

          return (
            <div
              key={fileItem.id}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:border-primary/30"
            >
              {/* Left: Icon, Number, Name, Size */}
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-mono font-semibold text-muted-foreground">
                  {index + 1}
                </span>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-blue text-primary">
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground sm:text-sm">
                    {fileItem.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {fileItem.formattedSize}
                  </p>
                </div>
              </div>

              {/* Right: Reorder & Remove Actions */}
              <div className="flex shrink-0 items-center gap-1 pl-2">
                {onMoveFile && files.length > 1 && (
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onMoveFile(index, index - 1)}
                      disabled={isFirst || disabled}
                      aria-label="Move file up"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveFile(index, index + 1)}
                      disabled={isLast || disabled}
                      aria-label="Move file down"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onRemoveFile(fileItem.id)}
                  disabled={disabled}
                  aria-label={`Remove ${fileItem.name}`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FileList;
