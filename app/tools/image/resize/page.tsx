"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Image as ImageIcon,
  Maximize2,
  Percent,
  Layers,
  Lock,
  Unlock,
  Download,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  FileArchive,
  Check,
  Settings2,
  Eye,
  Crop,
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
  resizeImageBatch,
  MAX_CANVAS_DIMENSION,
  type ResizeMode,
  type FitStrategy,
  type ImageResizeBatchResult,
} from "@/src/components/tools/processors/image/resize-image";
import {
  RESIZE_PRESETS,
  type ResizePreset,
} from "@/src/components/tools/processors/image/resize-presets";
import {
  inspectImageFile,
  type ImageInspection,
} from "@/src/components/tools/processors/image/compress-image";
import { formatBytes, triggerDownload } from "@/src/components/tools/processors/other/other-utils";

const imageResizeMetadata: ToolMetadata = {
  id: "image-resize",
  name: "Image Resizer",
  description:
    "Resize JPG, PNG, and WebP images by exact pixel dimensions, percentages, or popular social media presets without stretching or visual distortion.",
  category: "Image",
  categoryHref: "/tools?category=Image",
  icon: ImageIcon,
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
      title: "Choose resize method",
      description:
        "Resize by custom pixel width & height (with aspect ratio lock), scale by percentage, or select social media presets.",
    },
    {
      step: 3,
      title: "Resize and download",
      description:
        "Click Resize Images to process offline in your browser. Download individual images or a single ZIP archive.",
    },
  ],
  features: [
    {
      title: "3 Flexible Resizing Modes",
      description:
        "Specify exact pixel dimensions with intelligent aspect ratio preservation, scale by exact percentages, or use curated social media presets.",
      icon: Maximize2,
    },
    {
      title: "100% In-Browser Privacy",
      description:
        "All resampling and scaling operations execute strictly inside your local browser memory. No photos are ever uploaded to cloud servers.",
      icon: ShieldCheck,
    },
    {
      title: "Aspect Ratio Lock & Smart Fit",
      description:
        "Lock proportions to avoid accidental distortion. Choose between Fit (contain within frame), Cover (center crop), or exact Stretch.",
      icon: Crop,
    },
  ],
  faqs: [
    {
      question: "How does the aspect ratio lock work?",
      answer:
        "When the aspect ratio lock is enabled, changing the width will automatically recalculate the height (and vice versa) using the original proportions of your image, completely preventing stretching.",
    },
    {
      question: "What is the difference between 'Fit' and 'Cover' for presets?",
      answer:
        "'Fit' (contain) scales your image to fit entirely inside the target dimensions without cropping anything. 'Cover' fills the entire preset canvas (e.g. 1080×1080 for Instagram) and center-crops excess edges for a clean, full-bleed post.",
    },
    {
      question: "What is the maximum resolution I can resize to?",
      answer:
        "Our engine supports dimensions up to 16,384 pixels on each side, conforming to modern browser canvas hardware limitations.",
    },
    {
      question: "Will image transparency be preserved?",
      answer:
        "Yes! PNG and WebP images retain their alpha channel transparency. If you choose JPEG as the output format, transparent areas are cleanly backed with solid white.",
    },
  ],
  privacyNote:
    "iUseDaily resizes images entirely within your browser memory. No photos, files, or dimensions are ever sent over the internet.",
};

export default function ImageResizePage() {
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [inspections, setInspections] = useState<Map<string, ImageInspection>>(new Map());

  // Resizing Mode & Configuration
  const [mode, setMode] = useState<ResizeMode>("custom");

  // Custom Dimensions Mode
  const [customWidth, setCustomWidth] = useState<string>("1200");
  const [customHeight, setCustomHeight] = useState<string>("800");
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [fitStrategy, setFitStrategy] = useState<FitStrategy>("fit");

  // Percentage Mode
  const [percentage, setPercentage] = useState<number>(50);

  // Preset Mode
  const [selectedPresetId, setSelectedPresetId] = useState<string>("instagram-square");

  // Output format & quality
  const [outputFormat, setOutputFormat] = useState<"original" | "image/jpeg" | "image/png" | "image/webp">("original");
  const [quality, setQuality] = useState<number>(90);

  // Processing & State
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<ImageResizeBatchResult | null>(null);
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

  // First image aspect ratio helper for live custom inputs
  const firstImageRatio = useMemo(() => {
    if (files.length === 0) return 1.5;
    const first = files[0];
    if (first.dimensions && first.dimensions.height > 0) {
      return first.dimensions.width / first.dimensions.height;
    }
    return 1.5;
  }, [files]);

  // Handle file uploads & asynchronous inspection
  const handleFilesSelected = async (newIncomingFiles: File[]) => {
    if (newIncomingFiles.length === 0) return;

    setIsReadingFiles(true);
    setErrorMessage(null);

    const newToolFiles: ToolFile[] = [];
    const newInspections = new Map(inspections);

    for (let i = 0; i < newIncomingFiles.length; i++) {
      const file = newIncomingFiles[i];
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const previewUrl = registerUrl(URL.createObjectURL(file));

      const inspection = await inspectImageFile(file);
      newInspections.set(file.name, inspection);

      // Initialize default custom width/height from the first image
      if (files.length === 0 && i === 0 && inspection.isValid) {
        setCustomWidth(String(inspection.width));
        setCustomHeight(String(inspection.height));
      }

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

  // Synchronized dimension inputs when aspect ratio is locked
  const handleWidthChange = (valStr: string) => {
    setCustomWidth(valStr);
    const num = parseFloat(valStr);
    if (maintainAspectRatio && !isNaN(num) && num > 0 && firstImageRatio > 0) {
      const computedH = Math.round(num / firstImageRatio);
      setCustomHeight(String(computedH));
    }
  };

  const handleHeightChange = (valStr: string) => {
    setCustomHeight(valStr);
    const num = parseFloat(valStr);
    if (maintainAspectRatio && !isNaN(num) && num > 0 && firstImageRatio > 0) {
      const computedW = Math.round(num * firstImageRatio);
      setCustomWidth(String(computedW));
    }
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

  // Reconfigure settings
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

  const isConvertingTransparentToJpeg =
    hasAnyTransparentImages && outputFormat === "image/jpeg";

  // Selected preset details
  const selectedPreset: ResizePreset = useMemo(() => {
    return (
      RESIZE_PRESETS.find((p) => p.id === selectedPresetId) || RESIZE_PRESETS[0]
    );
  }, [selectedPresetId]);

  // Validation
  const validFiles = files.filter((f) => f.status === "ready");

  const validationError = useMemo(() => {
    if (validFiles.length === 0) return null;

    if (mode === "custom") {
      const w = parseFloat(customWidth);
      const h = parseFloat(customHeight);

      if ((!customWidth || isNaN(w) || w <= 0) && (!customHeight || isNaN(h) || h <= 0)) {
        return "Please enter a valid width or height greater than 0 pixels.";
      }
      if (w > MAX_CANVAS_DIMENSION || h > MAX_CANVAS_DIMENSION) {
        return `Requested dimensions cannot exceed the browser canvas limit of ${MAX_CANVAS_DIMENSION.toLocaleString()} px.`;
      }
    }

    if (mode === "percentage") {
      if (!percentage || percentage <= 0 || percentage > 1000) {
        return "Percentage must be between 1% and 1,000%.";
      }
    }

    return null;
  }, [validFiles.length, mode, customWidth, customHeight, percentage]);

  const canResize =
    validFiles.length > 0 &&
    !validationError &&
    status !== "processing" &&
    !isReadingFiles;

  // Execute Batch Resize
  const handleResizeImages = async () => {
    if (!canResize) return;

    setStatus("processing");
    setProgress(5);
    setStatusMessage(`Preparing ${validFiles.length} images for resizing...`);
    setErrorMessage(null);

    try {
      const rawFiles = validFiles.map((vf) => vf.file);
      const res = await resizeImageBatch(
        rawFiles,
        {
          mode,
          customWidth: customWidth ? parseFloat(customWidth) : undefined,
          customHeight: customHeight ? parseFloat(customHeight) : undefined,
          maintainAspectRatio,
          fitStrategy,
          percentage,
          presetId: selectedPresetId,
          outputFormat,
          quality,
          onProgress: (pct, current, total, msg) => {
            setProgress(pct);
            setStatusMessage(msg);
          },
        },
        inspections
      );

      // Register generated URLs for lifecycle cleanup
      res.items.forEach((item) => {
        registerUrl(item.resizedPreviewUrl);
      });
      if (res.zipUrl) {
        registerUrl(res.zipUrl);
      }

      setBatchResult(res);
      setStatus("success");
      setProgress(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image resizing failed.";
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
                    Resizing Complete!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Resized {batchResult.items.length}{" "}
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
                  <span>Resize Again</span>
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
                <span className="text-[11px] text-muted-foreground">Resized Total Size</span>
                <p className="text-sm font-bold text-primary">
                  {formatBytes(batchResult.totalResizedSize)}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Resize Method</span>
                <p className="text-sm font-bold capitalize text-foreground">
                  {mode}
                </p>
              </div>
            </div>
          </div>

          {/* Results List: Individual Image Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground">
              Resized Images ({batchResult.items.length})
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
                          name: item.resizedName,
                          size: item.resizedSize,
                          formattedSize: item.resizedFormattedSize,
                          extension: item.outputFormat.toLowerCase(),
                          type: `image/${item.outputFormat.toLowerCase()}`,
                          status: "ready",
                          previewUrl: item.resizedPreviewUrl,
                          dimensions: {
                            width: item.resizedWidth,
                            height: item.resizedHeight,
                          },
                        })
                      }
                      className="group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40"
                      title="Click to view full preview"
                    >
                      <Image
                        src={item.resizedPreviewUrl}
                        alt={item.resizedName}
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
                          {item.resizedName}
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

                      {/* Dimension transformation ribbon */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="font-mono text-muted-foreground">
                          {item.originalWidth} × {item.originalHeight} px
                        </span>
                        <span className="text-primary font-bold">→</span>
                        <span className="font-mono font-bold text-foreground">
                          {item.resizedWidth} × {item.resizedHeight} px
                        </span>
                        <span>•</span>
                        <span>{item.resizedFormattedSize}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Individual Download */}
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => triggerDownload(item.downloadUrl, item.resizedName)}
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
          accept={imageResizeMetadata.accept}
          multiple={true}
          maxSizeMB={imageResizeMetadata.maxFileSizeMB}
          maxFiles={imageResizeMetadata.maxFiles}
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
                  <span className="font-bold">Transparency Loss Warning</span>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    One or more uploaded PNG/WebP images contain transparent areas. Converting to JPEG will fill transparent pixels with solid white. Keep format as <strong>Original</strong>, <strong>WebP</strong>, or <strong>PNG</strong> to preserve transparent layers.
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
            {files.length < (imageResizeMetadata.maxFiles ?? 30) && (
              <div className="pt-2">
                <FileUpload
                  accept={imageResizeMetadata.accept}
                  multiple={true}
                  maxSizeMB={imageResizeMetadata.maxFileSizeMB}
                  maxFiles={imageResizeMetadata.maxFiles ?? 30}
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

          {/* Validation Error Alert */}
          {validationError && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Processing Error Alert */}
          {errorMessage && (
            <ToolError
              message={errorMessage}
              onRetry={handleResizeImages}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* Real Live Processing Progress Bar */}
          {status === "processing" && (
            <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4 animate-spin text-primary" />
                  {statusMessage || "Resizing images..."}
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
    <ToolSidebar title="Resize Settings">
      {/* 1. Resize Mode Selector Tabs */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Resize Method
        </label>
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-muted/60 p-1">
          {[
            { id: "custom", label: "Custom", icon: Maximize2 },
            { id: "percentage", label: "Percentage", icon: Percent },
            { id: "preset", label: "Presets", icon: Layers },
          ].map((tab) => {
            const isSelected = mode === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id as ResizeMode)}
                disabled={status === "processing"}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Mode-Specific Controls */}
      {mode === "custom" && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Dimensions Inputs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Target Dimensions</span>
              {/* Aspect Ratio Lock Toggle */}
              <button
                type="button"
                onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                title={maintainAspectRatio ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  maintainAspectRatio
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {maintainAspectRatio ? (
                  <>
                    <Lock className="h-3 w-3" />
                    <span>Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3" />
                    <span>Unlocked</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Width (px)</label>
                <input
                  type="number"
                  min="1"
                  max={MAX_CANVAS_DIMENSION}
                  value={customWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  disabled={status === "processing"}
                  placeholder="Width"
                  className="h-9 w-full rounded-xl border border-border bg-background px-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Height (px)</label>
                <input
                  type="number"
                  min="1"
                  max={MAX_CANVAS_DIMENSION}
                  value={customHeight}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  disabled={status === "processing"}
                  placeholder="Height"
                  className="h-9 w-full rounded-xl border border-border bg-background px-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground">
              {maintainAspectRatio
                ? "Changing width or height automatically scales the opposite dimension proportionally."
                : "Dimensions can be edited independently (may stretch image)."
              }
            </p>
          </div>

          {/* Fit Strategy */}
          {maintainAspectRatio && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Fit Strategy
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "fit", label: "Fit (Contain)" },
                  { id: "cover", label: "Cover (Crop)" },
                  { id: "stretch", label: "Stretch" },
                ].map((strat) => (
                  <button
                    key={strat.id}
                    type="button"
                    onClick={() => setFitStrategy(strat.id as FitStrategy)}
                    disabled={status === "processing"}
                    className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                      fitStrategy === strat.id
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {strat.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "percentage" && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-foreground">Scaling Factor</label>
            <span className="font-mono font-bold text-primary">{percentage}%</span>
          </div>

          {/* Preset percentage chips */}
          <div className="grid grid-cols-3 gap-1.5">
            {[25, 50, 75, 100, 150, 200].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setPercentage(pct)}
                disabled={status === "processing"}
                className={`rounded-xl border py-1.5 text-xs font-semibold transition-colors ${
                  percentage === pct
                    ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/20"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Custom Percentage Input & Slider */}
          <div className="space-y-2 pt-1">
            <input
              type="range"
              min="10"
              max="300"
              step="5"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              disabled={status === "processing"}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Custom:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                  disabled={status === "processing"}
                  className="h-7 w-16 rounded-md border border-border bg-background px-2 text-right font-mono text-xs text-foreground"
                />
                <span>%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === "preset" && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Choose Preset
            </label>
            <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {RESIZE_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPresetId(preset.id)}
                    disabled={status === "processing"}
                    className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {preset.description}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-primary">
                      {preset.width}×{preset.height}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Fit Strategy */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground">
              Preset Fit Method
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "cover", label: "Cover (Fill)" },
                { id: "fit", label: "Fit (Contain)" },
                { id: "stretch", label: "Stretch" },
              ].map((strat) => (
                <button
                  key={strat.id}
                  type="button"
                  onClick={() => setFitStrategy(strat.id as FitStrategy)}
                  disabled={status === "processing"}
                  className={`rounded-lg border px-1.5 py-1 text-[11px] font-medium transition-colors ${
                    fitStrategy === strat.id
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {strat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border" />

      {/* 3. Output Format Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">
          Output Format
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "original", label: "Original" },
            { id: "image/webp", label: "WebP" },
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
                className={`flex items-center justify-between rounded-xl border p-2 text-xs font-semibold transition-all ${
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
      </div>

      {/* 4. Quality Slider (for lossy formats) */}
      {(outputFormat === "image/jpeg" || outputFormat === "image/webp" || outputFormat === "original") && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">Output Quality</span>
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
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
          />
        </div>
      )}

      <div className="border-t border-border" />

      {/* 5. Summary Box */}
      <div className="space-y-2 rounded-xl bg-muted/50 p-3.5 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Images selected</span>
          <span className="font-semibold text-foreground">
            {validFiles.length} {validFiles.length === 1 ? "file" : "files"}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Target target size</span>
          <span className="font-mono font-semibold text-foreground">
            {mode === "preset"
              ? `${selectedPreset.width} × ${selectedPreset.height} px`
              : mode === "percentage"
              ? `${percentage}% scale`
              : `${customWidth || "?"} × ${customHeight || "?"} px`}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Fit mode</span>
          <span className="font-semibold capitalize text-foreground">
            {fitStrategy}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Processing engine</span>
          <span className="font-semibold text-primary">In-Browser Canvas API</span>
        </div>
      </div>

      {/* Primary Action Button */}
      {status !== "success" && (
        <div className="pt-2">
          <ProcessingButton
            label={validFiles.length > 1 ? `Resize ${validFiles.length} Images` : "Resize Image"}
            loadingLabel="Resizing images..."
            isProcessing={status === "processing"}
            progress={progress}
            disabled={!canResize}
            onClick={handleResizeImages}
            icon={ImageIcon}
          />
          {validFiles.length === 0 ? (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Select one or more images to begin
            </p>
          ) : validationError ? (
            <p className="mt-2 text-center text-[11px] text-destructive">
              {validationError}
            </p>
          ) : (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Ready to resize {validFiles.length} {validFiles.length === 1 ? "image" : "images"} offline
            </p>
          )}
        </div>
      )}
    </ToolSidebar>
  );

  return (
    <ToolPageLayout
      tool={imageResizeMetadata}
      workspaceContent={workspaceContent}
      sidebarContent={sidebarContent}
    />
  );
}
