"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FolderOpen, AlertCircle, Loader2 } from "lucide-react";

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  maxFiles?: number;
  currentFileCount?: number;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  isReading?: boolean;
  title?: string;
  supportingText?: string;
  acceptedTypesLabel?: string;
  className?: string;
}

export function FileUpload({
  accept = "*",
  multiple = true,
  maxSizeMB = 50,
  maxFiles = 20,
  currentFileCount = 0,
  onFilesSelected,
  disabled = false,
  isReading = false,
  title = "Drag and drop your files here",
  supportingText = "or browse files from your device",
  acceptedTypesLabel,
  className = "",
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (incomingList: FileList | File[]): File[] => {
    setErrorMessage(null);
    const valid: File[] = [];
    const incoming = Array.from(incomingList);
    const maxBytes = maxSizeMB * 1024 * 1024;

    // Check maximum files limit
    if (multiple && currentFileCount + incoming.length > maxFiles) {
      setErrorMessage(
        `You can only upload up to ${maxFiles} files in total. (${currentFileCount} already added, tried to add ${incoming.length}).`
      );
      return [];
    }

    if (!multiple && incoming.length > 1) {
      setErrorMessage("Only one file can be selected for this tool.");
      return [];
    }

    // Parse accepted extensions if provided (e.g. ".pdf, .png, image/*")
    const acceptedTokens = accept
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    for (const file of incoming) {
      // Validate file size
      if (file.size > maxBytes) {
        setErrorMessage(
          `"${file.name}" exceeds the maximum allowed size of ${maxSizeMB} MB.`
        );
        return [];
      }

      // Validate MIME/Extension if accept is not generic "*"
      if (accept !== "*" && acceptedTokens.length > 0) {
        const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const fileType = file.type.toLowerCase();

        const matches = acceptedTokens.some((token) => {
          if (token.startsWith(".")) {
            return fileExt === token;
          }
          if (token.endsWith("/*")) {
            const prefix = token.replace("/*", "");
            return fileType.startsWith(prefix);
          }
          return fileType === token;
        });

        if (!matches) {
          setErrorMessage(
            `"${file.name}" is not an accepted file format (${accept}).`
          );
          return [];
        }
      }

      valid.push(file);
    }

    return valid;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isReading) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled || isReading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
      e.target.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled && !isReading) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`flex h-full w-full flex-1 flex-col ${className}`}>
      <div
        role="button"
        tabIndex={disabled || isReading ? -1 : 0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        onClick={() => !disabled && !isReading && fileInputRef.current?.click()}
        aria-label="Upload files drop zone"
        className={`group relative flex h-full min-h-[300px] flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 sm:p-12 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          disabled
            ? "cursor-not-allowed border-border bg-muted/20 opacity-50"
            : isReading
            ? "cursor-wait border-primary/50 bg-primary/5"
            : isDragOver
            ? "border-primary bg-primary/5 ring-4 ring-primary/10 scale-[0.99]"
            : "border-border bg-card/50 hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled || isReading}
          className="hidden"
        />

        {/* Upload or Reading Icon */}
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all duration-200 ${
            isReading
              ? "bg-primary text-primary-foreground animate-pulse"
              : isDragOver
              ? "bg-primary text-primary-foreground scale-110"
              : "bg-surface-blue text-primary group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground"
          }`}
        >
          {isReading ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <UploadCloud className="h-7 w-7 transition-transform duration-200 group-hover:-translate-y-0.5" />
          )}
        </div>

        {/* State Titles & Descriptions */}
        <div className="mt-4 space-y-1.5">
          <h3 className="text-base font-semibold text-foreground sm:text-lg">
            {isReading
              ? "Reading uploaded files..."
              : isDragOver
              ? "Drop your files right here"
              : title}
          </h3>

          <p className="text-xs text-muted-foreground sm:text-sm">
            {isReading ? "Parsing document structure & pages" : supportingText}
          </p>
        </div>

        {/* Browse Button */}
        {!isReading && (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:opacity-95 active:scale-95"
          >
            <FolderOpen className="h-4 w-4" />
            <span>Browse Files</span>
          </button>
        )}

        {/* File restrictions & metadata info */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-muted-foreground">
          {acceptedTypesLabel ? (
            <span>{acceptedTypesLabel}</span>
          ) : (
            <span>{accept === "*" ? "All files" : accept.toUpperCase()}</span>
          )}
          <span>•</span>
          <span>Max {maxSizeMB} MB</span>
          {multiple && (
            <>
              <span>•</span>
              <span>Up to {maxFiles} files</span>
            </>
          )}
        </div>
      </div>

      {/* Error state message */}
      {errorMessage && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs font-medium text-destructive animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="shrink-0 text-destructive/80 hover:text-destructive hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
