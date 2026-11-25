"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, File, AlertCircle } from "lucide-react";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesSelected: (files: File[]) => void;
  title?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  accept = "*",
  multiple = true,
  maxSizeMB = 50,
  onFilesSelected,
  title = "Drop your files here",
  description = "or click to browse from your device",
  disabled = false,
  className = "",
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndDispatch = (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const validFiles: File[] = [];
    const maxBytes = maxSizeMB * 1024 * 1024;

    Array.from(incomingFiles).forEach((file) => {
      if (file.size > maxBytes) {
        setErrorMessage(`"${file.name}" exceeds the maximum allowed size of ${maxSizeMB}MB.`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndDispatch(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndDispatch(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div className={`flex h-full w-full flex-1 flex-col ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`group relative flex h-full min-h-[320px] flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 sm:p-12 ${
          disabled
            ? "cursor-not-allowed opacity-50 bg-muted/20 border-border"
            : isDragOver
            ? "border-primary bg-primary/5 ring-4 ring-primary/10"
            : "border-border bg-card/50 hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        {/* Upload Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-blue text-primary transition-transform duration-200 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
          <UploadCloud className="h-7 w-7" />
        </div>

        {/* Texts */}
        <h3 className="mt-4 text-base font-semibold text-foreground sm:text-lg">
          {title}
        </h3>

        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          {description}
        </p>

        {/* Browse Button */}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:opacity-95"
        >
          <File className="h-4 w-4" />
          <span>Browse files</span>
        </button>

        {/* Restrictions info */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground">
          <span>Max file size: {maxSizeMB}MB</span>
          <span className="hidden sm:inline">•</span>
          <span>Fast in-browser processing</span>
        </div>
      </div>

      {/* Validation Error Message */}
      {errorMessage && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
