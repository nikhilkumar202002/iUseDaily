"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  RefreshCw,
  FileImage,
  CheckCircle2,
  ShieldCheck,
  Download,
  AlertTriangle,
  FileArchive,
  Check,
  Settings2,
  Palette,
  Eye,
  RotateCcw,
  Sparkles,
  Info,
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
  convertImageBatch,
  inspectConvertibleImage,
  type SupportedOutputFormat,
  type ImageConvertBatchResult,
  type ImageInspection,
} from "@/src/components/tools/processors/image/convert-image";
import { formatBytes, triggerDownload } from "@/src/components/tools/processors/other/other-utils";

const imageConvertMetadata: ToolMetadata = {
  id: "image-convert",
  name: "Image Converter",
  description:
    "Convert JPG, PNG, WebP, BMP, and GIF images between formats locally in your browser with transparency preservation and quality controls.",
  category: "Image",
  categoryHref: "/tools?category=Image",
  icon: RefreshCw,
  badge: "Popular",
  accept: ".jpg,.jpeg,.png,.webp,.bmp,.gif,image/jpeg,image/png,image/webp,image/bmp,image/gif",
  maxFiles: 30,
  maxFileSizeMB: 25,
  instructions: [
    {
      step: 1,
      title: "Upload your images",
      description:
        "Select one or multiple JPG, PNG, WebP, BMP, or GIF files from your device or drop them into the workspace.",
    },
    {
      step: 2,
      title: "Choose output format & quality",
      description:
        "Select your target export format (JPG, PNG, WebP), adjust quality, and set background color for JPEG exports.",
    },
    {
      step: 3,
      title: "Convert and download",
      description:
        "Click Convert Images. Download individual converted files or a consolidated ZIP archive.",
    },
  ],
  features: [
    {
      title: "Fast In-Browser Conversion",
      description:
        "Decodes and re-encodes images strictly within your browser using the HTML5 Canvas API. No files are uploaded to any server.",
      icon: ShieldCheck,
    },
    {
      title: "Intelligent Transparency Support",
      description:
        "Preserves alpha channel transparency for PNG and WebP, or composites transparent areas onto clean solid backgrounds for JPEG.",
      icon: Sparkles,
    },
    {
      title: "Batch Processing & ZIP Download",
      description:
        "Convert dozens of mixed-format images simultaneously and download them in a single compressed ZIP bundle.",
      icon: RefreshCw,
    },
  ],
  faqs: [
    {
      question: "Which formats can I convert between?",
      answer:
        "You can upload JPG, PNG, WebP, BMP, and GIF files, and export them into standard JPG, PNG, or WebP formats recognized across all web browsers and operating systems.",
    },
    {
      question: "How are animated GIFs handled during conversion?",
      answer:
        "Because JPG, PNG, and standard WebP exports are static formats, animated GIFs will have their high-resolution first frame extracted and converted cleanly into the selected format.",
    },
    {
      question: "What happens to transparent backgrounds when converting to JPG?",
      answer:
        "Because the JPEG specification does not support alpha channel transparency, transparent areas are filled with your chosen background color (default: clean white). To preserve transparency, select PNG or WebP as the output format.",
    },
    {
      question: "Why might a converted PNG file be larger than an original JPG?",
      answer:
        "PNG uses lossless compression to preserve 100% of pixel detail, whereas JPEG uses lossy compression. Converting a photographic JPEG to PNG will often increase file size because PNG encodes every pixel with exact precision.",
    },
  ],
  privacyNote:
    "iUseDaily converts images entirely in local browser memory. No photos, files, or metadata are ever transmitted over the network.",
};

const BACKGROUND_COLORS = [
  { label: "White", value: "#FFFFFF", colorClass: "bg-white border-border" },
  { label: "Black", value: "#000000", colorClass: "bg-black border-neutral-700" },
  { label: "Slate", value: "#F1F5F9", colorClass: "bg-slate-100 border-slate-300" },
];

export default function ImageConvertPage() {
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [inspections, setInspections] = useState<
    Map<string, ImageInspection & { isGif?: boolean; formatLabel?: string }>
  >(new Map());

  // Conversion Settings
  const [outputFormat, setOutputFormat] = useState<SupportedOutputFormat>("image/webp");
  const [quality, setQuality] = useState<number>(92);
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");

  // Processing & State
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<ImageConvertBatchResult | null>(null);
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
        // Ignore
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

      const inspection = await inspectConvertibleImage(file);
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

  // Re-configure
  const handleReconfigure = () => {
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setBatchResult(null);
    setErrorMessage(null);
  };

  // Reorder files
  const handleReorderFiles = (fromIndex: number, toIndex: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  // Detect transparent images converted to JPEG
  const hasAnyTransparentImages = useMemo(() => {
    return Array.from(inspections.values()).some((info) => info.hasTransparency);
  }, [inspections]);

  // Detect any GIF files uploaded
  const hasAnyGifImages = useMemo(() => {
    return Array.from(inspections.values()).some((info) => info.isGif);
  }, [inspections]);

  const isConvertingTransparentToJpeg =
    hasAnyTransparentImages && outputFormat === "image/jpeg";

  // Valid files
  const validFiles = files.filter((f) => f.status === "ready");
  const canConvert = validFiles.length > 0 && status !== "processing" && !isReadingFiles;

  // Execute batch conversion
  const handleConvertImages = async () => {
    if (!canConvert) return;

    setStatus("processing");
    setProgress(5);
    setStatusMessage(`Preparing ${validFiles.length} images for conversion...`);
    setErrorMessage(null);

    try {
      const rawFiles = validFiles.map((vf) => vf.file);
      const res = await convertImageBatch(
        rawFiles,
        {
          outputFormat,
          quality,
          backgroundColor:
            outputFormat === "image/jpeg" ? backgroundColor : undefined,
          onProgress: (pct, current, total, msg) => {
            setProgress(pct);
            setStatusMessage(msg);
          },
        },
        inspections
      );

      // Register generated URLs for lifecycle cleanup
      res.items.forEach((item) => {
        registerUrl(item.convertedPreviewUrl);
      });
      if (res.zipUrl) {
        registerUrl(res.zipUrl);
      }

      setBatchResult(res);
      setStatus("success");
      setProgress(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image conversion failed.";
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
                    Conversion Complete!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Converted {batchResult.items.length}{" "}
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
                  <span>Convert More</span>
                </button>
              </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/80 pt-4 sm:grid-cols-4">
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Processed</span>
                <p className="text-sm font-bold text-foreground">
                  {batchResult.items.length} {batchResult.items.length === 1 ? "file" : "files"}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Original Total Size</span>
                <p className="text-sm font-bold text-foreground">
                  {formatBytes(batchResult.totalOriginalSize)}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Converted Total Size</span>
                <p className="text-sm font-bold text-primary">
                  {formatBytes(batchResult.totalConvertedSize)}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Target Format</span>
                <p className="font-mono text-sm font-bold text-foreground">
                  {outputFormat === "image/png" ? "PNG" : outputFormat === "image/webp" ? "WEBP" : "JPEG"}
                </p>
              </div>
            </div>
          </div>

          {/* Results List: Individual Converted Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground">
              Converted Images ({batchResult.items.length})
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
                          name: item.convertedName,
                          size: item.convertedSize,
                          formattedSize: item.convertedFormattedSize,
                          extension: item.convertedFormat.toLowerCase(),
                          type: item.convertedMimeType,
                          status: "ready",
                          previewUrl: item.convertedPreviewUrl,
                          dimensions: {
                            width: item.convertedWidth,
                            height: item.convertedHeight,
                          },
                        })
                      }
                      className="group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40"
                      title="Click to view full preview"
                    >
                      <Image
                        src={item.convertedPreviewUrl}
                        alt={item.convertedName}
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
                        <h5 className="truncate text-xs font-bold text-foreground max-w-[200px] sm:max-w-[280px]">
                          {item.convertedName}
                        </h5>
                        <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                            {item.originalFormat}
                          </span>
                          <span className="text-primary">→</span>
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                            {item.convertedFormat}
                          </span>
                        </div>
                        {item.convertedFromTransparent && (
                          <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                            White background
                          </span>
                        )}
                        {item.isGifFirstFrame && (
                          <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                            First frame
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
                        <span>
                          Original: <span className="line-through">{item.originalFormattedSize}</span>
                        </span>
                        <span className="font-semibold text-foreground">
                          New: {item.convertedFormattedSize}
                        </span>
                        <span>•</span>
                        <span>
                          {item.convertedWidth} × {item.convertedHeight} px
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Size Comparison Pill & Download */}
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div>
                      {item.isSmaller ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          -{item.reductionPercentage}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {item.reductionPercentage < 0
                            ? `+${Math.abs(item.reductionPercentage)}%`
                            : "0% diff"}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => triggerDownload(item.downloadUrl, item.convertedName)}
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
          accept={imageConvertMetadata.accept}
          multiple={true}
          maxSizeMB={imageConvertMetadata.maxFileSizeMB}
          maxFiles={imageConvertMetadata.maxFiles}
          onFilesSelected={handleFilesSelected}
          disabled={status === "processing"}
          isReading={isReadingFiles}
          title="Drop your images here"
          supportingText="or browse to select from your device"
          acceptedTypesLabel="JPG, PNG, WebP, BMP, or GIF (up to 30 files, 25MB each)"
          className="flex-1"
        />
      ) : (
        /* Active File List & Options Workspace */
        <div className="flex flex-1 flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Header with count and Clear All */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileImage className="h-4 w-4 text-primary" />
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
                  <span className="font-bold">Transparency Notice</span>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    One or more uploaded images contain transparent pixels. Converting to JPEG will fill transparent areas with a solid background color. To preserve transparency, select <strong>WebP</strong> or <strong>PNG</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Animated GIF First Frame Info Banner */}
            {hasAnyGifImages && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-blue-800 dark:text-blue-300 animate-in fade-in duration-200">
                <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">GIF Format Notice</span>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Uploaded GIF files will have their high-resolution first frame converted into the selected static format.
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
            {files.length < (imageConvertMetadata.maxFiles ?? 30) && (
              <div className="pt-2">
                <FileUpload
                  accept={imageConvertMetadata.accept}
                  multiple={true}
                  maxSizeMB={imageConvertMetadata.maxFileSizeMB}
                  maxFiles={imageConvertMetadata.maxFiles ?? 30}
                  currentFileCount={files.length}
                  onFilesSelected={handleFilesSelected}
                  disabled={status === "processing"}
                  isReading={isReadingFiles}
                  title="Add more images"
                  supportingText="Drop additional JPG, PNG, WebP, BMP, or GIF files"
                  className="py-4"
                />
              </div>
            )}
          </div>

          {/* Processing Error Alert */}
          {errorMessage && (
            <ToolError
              message={errorMessage}
              onRetry={handleConvertImages}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* Real Live Processing Progress Bar */}
          {status === "processing" && (
            <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4 animate-spin text-primary" />
                  {statusMessage || "Converting images..."}
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
    <ToolSidebar title="Conversion Options">
      {/* 1. Target Format Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">
          Convert To Format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "image/webp", label: "WebP", desc: "Best balance" },
            { id: "image/png", label: "PNG", desc: "Lossless" },
            { id: "image/jpeg", label: "JPG", desc: "Compact" },
          ].map((fmt) => {
            const isSelected = outputFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setOutputFormat(fmt.id as SupportedOutputFormat)}
                disabled={status === "processing"}
                className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/20"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold">{fmt.label}</span>
                  {isSelected && <Check className="h-3 w-3 text-primary" />}
                </div>
                <span className="text-[10px] opacity-75">{fmt.desc}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {outputFormat === "image/webp"
            ? "WebP provides the smallest file size while keeping transparent layers."
            : outputFormat === "image/png"
            ? "PNG preserves maximum visual sharpness and transparency without loss."
            : "JPEG provides universal compatibility with adjustable lossy quality."}
        </p>
      </div>

      <div className="border-t border-border" />

      {/* 2. Quality Slider (for JPG and WebP) */}
      {(outputFormat === "image/jpeg" || outputFormat === "image/webp") && (
        <div className="space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Output Quality</span>
            <span className="font-mono font-bold text-primary">{quality}%</span>
          </div>

          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            disabled={status === "processing"}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary disabled:opacity-50"
          />

          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            {[
              { label: "Standard", val: 80 },
              { label: "High", val: 92 },
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
        </div>
      )}

      {/* 3. JPEG Background Color (active when JPG is selected) */}
      {outputFormat === "image/jpeg" && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Palette className="h-3.5 w-3.5 text-primary" />
              <span>Background Color</span>
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {backgroundColor}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {BACKGROUND_COLORS.map((bg) => {
              const isSelected = backgroundColor === bg.value;
              return (
                <button
                  key={bg.value}
                  type="button"
                  onClick={() => setBackgroundColor(bg.value)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] font-medium transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span
                    className={`h-3 w-3 rounded-full border ${bg.colorClass}`}
                  />
                  <span>{bg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-border" />

      {/* 4. Summary Box */}
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
          <span>Target format</span>
          <span className="font-mono font-semibold text-primary">
            {outputFormat === "image/png" ? "PNG" : outputFormat === "image/webp" ? "WEBP" : "JPEG"}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Processing mode</span>
          <span className="font-semibold text-foreground">100% In-Browser (Canvas API)</span>
        </div>
      </div>

      {/* Primary Action Button */}
      {status !== "success" && (
        <div className="pt-2">
          <ProcessingButton
            label={validFiles.length > 1 ? `Convert ${validFiles.length} Images` : "Convert Image"}
            loadingLabel="Converting images..."
            isProcessing={status === "processing"}
            progress={progress}
            disabled={!canConvert}
            onClick={handleConvertImages}
            icon={RefreshCw}
          />
          {validFiles.length === 0 ? (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Select one or more images to begin
            </p>
          ) : (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Ready to convert {validFiles.length} {validFiles.length === 1 ? "image" : "images"} offline
            </p>
          )}
        </div>
      )}
    </ToolSidebar>
  );

  return (
    <ToolPageLayout
      tool={imageConvertMetadata}
      workspaceContent={workspaceContent}
      sidebarContent={sidebarContent}
    />
  );
}
