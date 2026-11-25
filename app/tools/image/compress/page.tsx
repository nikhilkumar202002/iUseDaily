"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  FileImage,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Download,
  RotateCcw,
  AlertTriangle,
  Archive,
  Eye,
  Settings2,
  FileArchive,
  Check,
} from "lucide-react";
import {
  ToolPageLayout,
  ToolSidebar,
  type ToolMetadata,
} from "@/app/components/tool-detail";
import {
  FileUpload,
  FileList,
  FilePreview,
  ProcessingButton,
  ToolError,
  type ToolFile,
  type ProcessingStatus,
} from "@/src/components/tools/shared";
import {
  compressImageBatch,
  inspectImageFile,
  type ImageCompressionBatchResult,
  type ImageInspection,
} from "@/src/components/tools/processors/image/compress-image";
import { formatBytes, triggerDownload } from "@/src/components/tools/processors/other/other-utils";

const imageCompressMetadata: ToolMetadata = {
  id: "image-compress",
  name: "Image Compressor",
  description:
    "Compress JPG, PNG, and WebP images by up to 80% with real-time quality control, custom dimension limits, and optional ZIP bulk download.",
  category: "Image",
  categoryHref: "/tools?category=Image",
  icon: FileImage,
  badge: "Popular",
  accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
  maxFiles: 30,
  maxFileSizeMB: 25,
  instructions: [
    {
      step: 1,
      title: "Upload your images",
      description:
        "Select one or multiple JPG, PNG, or WebP images from your device or drop them into the workspace.",
    },
    {
      step: 2,
      title: "Configure compression & format",
      description:
        "Select your desired compression quality, optional target file size in KB, output format, and max dimensions.",
    },
    {
      step: 3,
      title: "Compress and download",
      description:
        "Click Compress Images. Inspect before-and-after sizes and download individual files or a consolidated ZIP archive.",
    },
  ],
  features: [
    {
      title: "100% In-Browser Privacy",
      description:
        "Your photos and graphics are processed locally within your device browser memory. Nothing is ever sent to a remote server.",
      icon: ShieldCheck,
    },
    {
      title: "Intelligent Transparency Support",
      description:
        "Preserves alpha channel transparency for PNG and WebP, and protects transparent images with clean background handling if converted to JPEG.",
      icon: Sparkles,
    },
    {
      title: "Batch Compression & ZIP Download",
      description:
        "Compress dozens of high-resolution images in parallel and download them all at once in a lightweight ZIP bundle.",
      icon: Archive,
    },
  ],
  faqs: [
    {
      question: "How does PNG compression differ from JPEG and WebP?",
      answer:
        "PNG is a lossless format designed for crisp vector graphics, text, and transparent layers. Reducing the quality slider has the largest effect on lossy formats like JPEG and WebP. For PNG files, our compressor optimizes color indexing and deflate streams, or you can convert PNG to WebP for massive file size savings while keeping transparent backgrounds intact.",
    },
    {
      question: "What happens to transparent backgrounds if I select JPEG?",
      answer:
        "Because the JPEG specification has no concept of alpha transparency, transparent pixels will naturally be filled with a solid white background. If you want to keep transparency, keep the format as WebP or PNG.",
    },
    {
      question: "Can I compress images without changing their pixel dimensions?",
      answer:
        "Yes! By default, 'Maintain Original Dimensions' is checked, which ensures your photos retain their exact original width and height while shrinking file weight.",
    },
    {
      question: "Is there a limit to how many images I can compress at once?",
      answer:
        "You can upload up to 30 images (up to 25 MB each) in a single session. They are processed efficiently one-by-one to avoid freezing your browser tab.",
    },
  ],
  privacyNote:
    "iUseDaily compresses images entirely in local browser memory. No photos, files, or metadata are ever transmitted to any external server.",
};

export default function ImageCompressPage() {
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [inspections, setInspections] = useState<Map<string, ImageInspection>>(new Map());

  // Compression Options
  const [quality, setQuality] = useState<number>(80);
  const [useTargetSize, setUseTargetSize] = useState<boolean>(false);
  const [targetMaxKB, setTargetMaxKB] = useState<number>(200);
  const [maintainDimensions, setMaintainDimensions] = useState<boolean>(true);
  const [maxWidth, setMaxWidth] = useState<number>(1920);
  const [maxHeight, setMaxHeight] = useState<number>(1080);
  const [outputFormat, setOutputFormat] = useState<"original" | "image/jpeg" | "image/png" | "image/webp">("original");

  // Processing & State
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<ImageCompressionBatchResult | null>(null);
  const [previewFile, setPreviewFile] = useState<ToolFile | null>(null);
  const [isReadingFiles, setIsReadingFiles] = useState<boolean>(false);

  // Lifecycle Object URL tracking
  const activeUrlsRef = useRef<string[]>([]);

  const registerUrl = (url: string) => {
    activeUrlsRef.current.push(url);
    return url;
  };

  const revokeAllUrls = () => {
    activeUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore revocation errors
      }
    });
    activeUrlsRef.current = [];
  };

  useEffect(() => {
    return () => {
      revokeAllUrls();
    };
  }, []);

  // Handle file uploads & asynchronous inspection
  const handleFilesSelected = async (newIncomingFiles: File[]) => {
    if (newIncomingFiles.length === 0) return;

    setIsReadingFiles(true);
    setErrorMessage(null);

    const newToolFiles: ToolFile[] = [];
    const newInspections = new Map(inspections);

    for (const file of newIncomingFiles) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const previewUrl = registerUrl(URL.createObjectURL(file));

      const inspection = await inspectImageFile(file);
      newInspections.set(file.name, inspection);

      newToolFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        formattedSize: formatBytes(file.size),
        extension: ext,
        type: file.type || `image/${ext}`,
        status: inspection.isValid ? "ready" : "error",
        error: inspection.error,
        previewUrl,
        dimensions: inspection.isValid
          ? { width: inspection.width, height: inspection.height }
          : undefined,
      });
    }

    setInspections(newInspections);
    setFiles((prev) => [...prev, ...newToolFiles]);
    setIsReadingFiles(false);
  };

  // Remove individual file
  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.previewUrl) {
        try {
          URL.revokeObjectURL(fileToRemove.previewUrl);
        } catch {
          // Ignore
        }
      }
      return prev.filter((f) => f.id !== id);
    });

    if (files.length <= 1) {
      handleReset();
    }
  };

  // Clear all files
  const handleClearAll = () => {
    revokeAllUrls();
    setFiles([]);
    setInspections(new Map());
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setBatchResult(null);
    setErrorMessage(null);
  };

  // Reset tool
  const handleReset = () => {
    revokeAllUrls();
    setFiles([]);
    setInspections(new Map());
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setBatchResult(null);
    setErrorMessage(null);
  };

  // Re-compress (keep files, return to settings)
  const handleReconfigure = () => {
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setBatchResult(null);
    setErrorMessage(null);
  };

  // Detect if any uploaded image contains transparency
  const hasAnyTransparentImages = useMemo(() => {
    return Array.from(inspections.values()).some((info) => info.hasTransparency);
  }, [inspections]);

  const isConvertingTransparentToJpeg =
    hasAnyTransparentImages && outputFormat === "image/jpeg";

  // Reorder files
  const handleReorderFiles = (fromIndex: number, toIndex: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  // Valid files
  const validFiles = files.filter((f) => f.status === "ready");
  const canCompress = validFiles.length > 0 && status !== "processing" && !isReadingFiles;

  // Execute batch compression
  const handleCompressImages = async () => {
    if (!canCompress) return;

    setStatus("processing");
    setProgress(5);
    setStatusMessage(`Preparing ${validFiles.length} images for compression...`);
    setErrorMessage(null);

    try {
      const rawFiles = validFiles.map((vf) => vf.file);
      const res = await compressImageBatch(
        rawFiles,
        {
          quality,
          targetMaxKB: useTargetSize ? targetMaxKB : undefined,
          maintainDimensions,
          maxWidth: !maintainDimensions ? maxWidth : undefined,
          maxHeight: !maintainDimensions ? maxHeight : undefined,
          outputFormat,
          onProgress: (pct, current, total, msg) => {
            setProgress(pct);
            setStatusMessage(msg);
          },
        },
        inspections
      );

      // Register generated URLs for lifecycle cleanup
      res.items.forEach((item) => {
        registerUrl(item.compressedPreviewUrl);
      });
      if (res.zipUrl) {
        registerUrl(res.zipUrl);
      }

      setBatchResult(res);
      setStatus("success");
      setProgress(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image compression failed.";
      setErrorMessage(msg);
      setStatus("error");
      setProgress(undefined);
    }
  };

  // Workspace Main Content (Left Card)
  const workspaceContent = (
    <div className="flex h-full flex-1 flex-col space-y-6">
      {status === "success" && batchResult ? (
        /* Results View */
        <div className="flex h-full flex-1 flex-col space-y-6 animate-in fade-in duration-200">
          {/* Header Summary Banner */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Compression Complete!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Processed {batchResult.items.length}{" "}
                    {batchResult.items.length === 1 ? "image" : "images"} offline in your browser.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {batchResult.zipUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      triggerDownload(batchResult.zipUrl!, batchResult.zipFileName!)
                    }
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:opacity-95"
                  >
                    <FileArchive className="h-4 w-4" />
                    <span>Download All (ZIP)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleReconfigure}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span>Adjust Settings</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Start Again</span>
                </button>
              </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/80 pt-4 sm:grid-cols-4">
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Original Total</span>
                <p className="text-sm font-bold text-foreground">
                  {formatBytes(batchResult.totalOriginalSize)}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">New Total Size</span>
                <p className="text-sm font-bold text-primary">
                  {formatBytes(batchResult.totalCompressedSize)}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Bytes Saved</span>
                <p className="text-sm font-bold text-foreground">
                  {formatBytes(batchResult.totalSavedBytes)}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Reduction</span>
                <div className="flex items-center gap-1">
                  {batchResult.isOverallSmaller ? (
                    <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      -{batchResult.totalReductionPercentage}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      Already optimized
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Results List: Individual Image Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground">
              Compressed Images ({batchResult.items.length})
            </h4>

            <div className="space-y-3">
              {batchResult.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left: Thumbnail & comparison */}
                  <div className="flex min-w-0 items-center gap-3.5">
                    {/* Thumbnail preview */}
                    <div
                      onClick={() =>
                        setPreviewFile({
                          id: item.id,
                          file: item.originalFile,
                          name: item.compressedName,
                          size: item.compressedSize,
                          formattedSize: item.compressedFormattedSize,
                          extension: item.outputFormat.toLowerCase(),
                          type: `image/${item.outputFormat.toLowerCase()}`,
                          status: "ready",
                          previewUrl: item.compressedPreviewUrl,
                          dimensions: {
                            width: item.compressedWidth,
                            height: item.compressedHeight,
                          },
                        })
                      }
                      className="group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40"
                      title="Click to view full preview"
                    >
                      <Image
                        src={item.compressedPreviewUrl}
                        alt={item.compressedName}
                        width={64}
                        height={64}
                        unoptimized
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                    </div>

                    {/* Metadata text */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h5 className="truncate text-xs font-bold text-foreground max-w-[220px] sm:max-w-[300px]">
                          {item.compressedName}
                        </h5>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                          {item.outputFormat}
                        </span>
                        {item.convertedFromTransparent && (
                          <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                            White background
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span>
                          Original: <span className="line-through">{item.originalFormattedSize}</span>
                        </span>
                        <span className="font-semibold text-foreground">
                          New: {item.compressedFormattedSize}
                        </span>
                        <span>•</span>
                        <span>
                          {item.compressedWidth} × {item.compressedHeight} px
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Savings badge & download */}
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div>
                      {item.isSmaller ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          -{item.reductionPercentage}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                          {item.reductionPercentage < 0
                            ? `+${Math.abs(item.reductionPercentage)}%`
                            : "0% (Optimal)"}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => triggerDownload(item.downloadUrl, item.compressedName)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : files.length === 0 ? (
        /* Empty Upload Zone */
        <FileUpload
          accept={imageCompressMetadata.accept}
          multiple={true}
          maxSizeMB={imageCompressMetadata.maxFileSizeMB}
          maxFiles={imageCompressMetadata.maxFiles}
          onFilesSelected={handleFilesSelected}
          disabled={status === "processing"}
          isReading={isReadingFiles}
          title="Drop your images here"
          supportingText="or browse to select from your device"
          acceptedTypesLabel="JPG, PNG, or WebP (up to 30 files, 25MB each)"
          className="flex-1"
        />
      ) : (
        /* Active File List & Reorder Workspace */
        <div className="flex flex-1 flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Header with count and Clear All */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Selected Images ({files.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={status === "processing"}
                className="text-xs font-semibold text-destructive hover:underline disabled:opacity-50"
              >
                Clear all
              </button>
            </div>

            {/* Transparent to JPEG Warning Banner */}
            {isConvertingTransparentToJpeg && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 animate-in fade-in duration-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Transparency Loss Notice</span>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    One or more uploaded PNG/WebP images contain transparent pixels. Converting to JPEG will fill transparent areas with a solid white background. To preserve transparency, keep format as <strong>Original</strong>, <strong>WebP</strong>, or <strong>PNG</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* File List Component */}
            <FileList
              files={files}
              onRemoveFile={handleRemoveFile}
              onClearAll={handleClearAll}
              onReorderFiles={handleReorderFiles}
              onPreviewFile={(f) => setPreviewFile(f)}
              disabled={status === "processing"}
              allowReorder={true}
            />

            {/* Additional Files Dropzone if under max limit */}
            {files.length < (imageCompressMetadata.maxFiles ?? 30) && (
              <div className="pt-2">
                <FileUpload
                  accept={imageCompressMetadata.accept}
                  multiple={true}
                  maxSizeMB={imageCompressMetadata.maxFileSizeMB}
                  maxFiles={imageCompressMetadata.maxFiles ?? 30}
                  currentFileCount={files.length}
                  onFilesSelected={handleFilesSelected}
                  disabled={status === "processing"}
                  isReading={isReadingFiles}
                  title="Add more images"
                  supportingText="Drop additional JPG, PNG, or WebP files"
                  className="py-4"
                />
              </div>
            )}
          </div>

          {/* Processing Error Alert */}
          {errorMessage && (
            <ToolError
              message={errorMessage}
              onRetry={handleCompressImages}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* Real Live Processing Progress Bar */}
          {status === "processing" && (
            <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4 animate-spin text-primary" />
                  {statusMessage || "Optimizing images..."}
                </span>
                {progress !== undefined && (
                  <span className="font-mono text-muted-foreground">{progress}%</span>
                )}
              </div>
              {progress !== undefined && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal File Preview */}
      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );

  // Configuration Sidebar (Right Card)
  const sidebarContent = (
    <ToolSidebar title="Compression Options">
      {/* 1. Quality Slider */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-foreground">Image Quality</label>
          <span className="font-mono font-bold text-primary">{quality}%</span>
        </div>

        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          disabled={status === "processing"}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary disabled:opacity-50"
        />

        {/* Quality Presets */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[
            { label: "Low", val: 60 },
            { label: "Good", val: 80 },
            { label: "High", val: 90 },
            { label: "Max", val: 98 },
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => setQuality(preset.val)}
              disabled={status === "processing"}
              className={`rounded-lg border px-1.5 py-1 text-[11px] font-medium transition-colors ${
                quality === preset.val
                  ? "border-primary bg-primary/10 text-primary font-bold"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          80% delivers significant file size reduction with virtually no perceptible visual loss.
        </p>
      </div>

      <div className="border-t border-border" />

      {/* 2. Output Format Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">
          Output Format
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "original", label: "Original" },
            { id: "image/webp", label: "WebP (Best)" },
            { id: "image/jpeg", label: "JPEG" },
            { id: "image/png", label: "PNG" },
          ].map((fmt) => {
            const isSelected = outputFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() =>
                  setOutputFormat(
                    fmt.id as "original" | "image/jpeg" | "image/png" | "image/webp"
                  )
                }
                disabled={status === "processing"}
                className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{fmt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">
          WebP provides up to 30% more compression than JPEG and retains transparency.
        </p>
      </div>

      <div className="border-t border-border" />

      {/* 3. Dimensions Settings */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={maintainDimensions}
            onChange={(e) => setMaintainDimensions(e.target.checked)}
            disabled={status === "processing"}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-xs font-semibold text-foreground">
            Maintain Original Dimensions
          </span>
        </label>

        {!maintainDimensions && (
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-3 animate-in fade-in duration-200">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Max Width (px)
              </label>
              <input
                type="number"
                min="100"
                max="8000"
                step="50"
                value={maxWidth}
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                disabled={status === "processing"}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs font-mono text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Max Height (px)
              </label>
              <input
                type="number"
                min="100"
                max="8000"
                step="50"
                value={maxHeight}
                onChange={(e) => setMaxHeight(Number(e.target.value))}
                disabled={status === "processing"}
                className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs font-mono text-foreground"
              />
            </div>
            <span className="col-span-2 text-[10px] text-muted-foreground">
              Images will scale down while keeping their original aspect ratio.
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-border" />

      {/* 4. Target Max File Size (Optional) */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useTargetSize}
            onChange={(e) => setUseTargetSize(e.target.checked)}
            disabled={status === "processing"}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-xs font-semibold text-foreground">
            Target Max Size Limit
          </span>
        </label>

        {useTargetSize && (
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 animate-in fade-in duration-200">
            <input
              type="number"
              min="20"
              max="50000"
              step="50"
              value={targetMaxKB}
              onChange={(e) => setTargetMaxKB(Number(e.target.value))}
              disabled={status === "processing"}
              className="h-8 w-24 rounded-lg border border-border bg-background px-2 text-xs font-mono text-foreground"
            />
            <span className="text-xs font-semibold text-foreground">KB</span>
            <span className="text-[11px] text-muted-foreground">
              ({(targetMaxKB / 1024).toFixed(1)} MB target)
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-border" />

      {/* Summary Box */}
      <div className="space-y-2 rounded-xl bg-muted/50 p-3.5 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Images selected</span>
          <span className="font-semibold text-foreground">
            {validFiles.length} {validFiles.length === 1 ? "file" : "files"}
          </span>
        </div>
        {validFiles.length > 0 && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Total input size</span>
            <span className="font-semibold text-foreground">
              {formatBytes(validFiles.reduce((acc, f) => acc + f.size, 0))}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Compression target</span>
          <span className="font-semibold text-foreground">Quality {quality}%</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Processing mode</span>
          <span className="font-semibold text-primary">In-Browser (Canvas / WASM)</span>
        </div>
      </div>

      {/* Primary Action Button */}
      {status !== "success" && (
        <div className="pt-2">
          <ProcessingButton
            label={validFiles.length > 1 ? `Compress ${validFiles.length} Images` : "Compress Image"}
            loadingLabel="Compressing images..."
            isProcessing={status === "processing"}
            progress={progress}
            disabled={!canCompress}
            onClick={handleCompressImages}
            icon={FileImage}
          />
          {validFiles.length === 0 ? (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Select one or more images to begin
            </p>
          ) : (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Ready to optimize {validFiles.length} {validFiles.length === 1 ? "image" : "images"} offline
            </p>
          )}
        </div>
      )}
    </ToolSidebar>
  );

  return (
    <ToolPageLayout
      tool={imageCompressMetadata}
      workspaceContent={workspaceContent}
      sidebarContent={sidebarContent}
    />
  );
}
