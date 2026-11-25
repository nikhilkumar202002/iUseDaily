"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  FileText,
  FileImage,
  FileCode,
  File as FileGeneric,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Layers,
  Maximize2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { ToolFile } from "./types";

export interface FileListProps {
  files: ToolFile[];
  onRemoveFile: (id: string) => void;
  onClearAll?: () => void;
  onReorderFiles?: (fromIndex: number, toIndex: number) => void;
  onPreviewFile?: (file: ToolFile) => void;
  disabled?: boolean;
  title?: string;
  allowReorder?: boolean;
}

export function FileList({
  files,
  onRemoveFile,
  onClearAll,
  onReorderFiles,
  onPreviewFile,
  disabled = false,
  title,
  allowReorder = true,
}: FileListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (files.length === 0) return null;

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const formattedTotal =
    totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(totalBytes / 1024).toFixed(0)} KB`;

  const getFileIcon = (file: ToolFile) => {
    const ext = file.extension.toLowerCase();
    if (ext === "pdf") return FileText;
    if (["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext)) return FileImage;
    if (["js", "ts", "json", "html", "css"].includes(ext)) return FileCode;
    return FileGeneric;
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (disabled || !allowReorder) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (disabled || !allowReorder || draggedIndex === null || draggedIndex === index) {
      return;
    }
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (disabled || !allowReorder || draggedIndex === null || draggedIndex === targetIndex) {
      return;
    }
    onReorderFiles?.(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="w-full space-y-3">
      {/* Header bar with summary and clear all button */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">
            {title || `${files.length} ${files.length === 1 ? "file" : "files"} selected`}
          </span>
          <span className="text-muted-foreground">({formattedTotal})</span>
        </div>

        {onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            disabled={disabled}
            className="font-medium text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Reorderable file cards list */}
      <div className="space-y-2">
        {files.map((file, index) => {
          const Icon = getFileIcon(file);
          const isFirst = index === 0;
          const isLast = index === files.length - 1;
          const isDragging = draggedIndex === index;

          return (
            <div
              key={file.id}
              draggable={allowReorder && !disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-all duration-150 hover:border-primary/40 hover:shadow-md ${
                isDragging ? "opacity-40 border-primary border-dashed scale-[0.98]" : ""
              }`}
            >
              {/* Left Group: Drag handle, Index, Icon/Thumbnail, File Meta */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* Reorder Drag Handle */}
                {allowReorder && files.length > 1 && (
                  <div
                    aria-label="Drag to reorder"
                    className="hidden cursor-grab text-muted-foreground/50 transition-colors group-hover:text-muted-foreground active:cursor-grabbing sm:flex"
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>
                )}

                {/* Index Pill */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-mono font-semibold text-muted-foreground">
                  {index + 1}
                </span>

                {/* File Thumbnail or Icon */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-blue text-primary">
                  {file.previewUrl && file.type.startsWith("image/") ? (
                    <Image
                      src={file.previewUrl}
                      alt={file.name}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                {/* File details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-semibold text-foreground sm:text-sm">
                      {file.name}
                    </p>
                    <span className="hidden shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline-block">
                      {file.extension.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{file.formattedSize}</span>

                    {/* PDF page count badge */}
                    {file.pageCount !== undefined && file.pageCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                          <Layers className="h-3 w-3 text-primary" />
                          {file.pageCount} {file.pageCount === 1 ? "page" : "pages"}
                        </span>
                      </>
                    )}

                    {/* Image dimensions badge */}
                    {file.dimensions && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                          <Maximize2 className="h-3 w-3 text-primary" />
                          {file.dimensions.width} × {file.dimensions.height}
                        </span>
                      </>
                    )}

                    {/* Status Pill */}
                    {file.status === "reading" && (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        Reading...
                      </span>
                    )}
                    {file.status === "ready" && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Ready
                      </span>
                    )}
                    {file.status === "error" && (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <AlertCircle className="h-2.5 w-2.5" />
                        {file.error || "Error"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Action Group */}
              <div className="flex shrink-0 items-center gap-1">
                {/* Preview Button */}
                {onPreviewFile && (
                  <button
                    type="button"
                    onClick={() => onPreviewFile(file)}
                    disabled={disabled}
                    aria-label={`Preview ${file.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}

                {/* Arrow Reorder Controls (for mobile or precision clicking) */}
                {allowReorder && files.length > 1 && (
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onReorderFiles?.(index, index - 1)}
                      disabled={isFirst || disabled}
                      aria-label="Move up"
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onReorderFiles?.(index, index + 1)}
                      disabled={isLast || disabled}
                      aria-label="Move down"
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Remove File Button */}
                <button
                  type="button"
                  onClick={() => onRemoveFile(file.id)}
                  disabled={disabled}
                  aria-label={`Remove ${file.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
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
