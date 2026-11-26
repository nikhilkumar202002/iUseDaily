"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Download,
  AlertTriangle,
  FileArchive,
  Check,
  Settings2,
  Palette,
  Eye,
  RefreshCw,
  Sparkles,
  Copy,
} from "lucide-react";
import {
  ToolPageLayout,
  ToolSidebar,
  type ToolMetadata,
} from "@/app/components/tool-detail";
import {
  FileUpload,
  FilePreview,
  ProcessingButton,
  ToolError,
  type ToolFile,
  type ProcessingStatus,
} from "@/src/components/tools/shared";
import {
  rotateImageBatch,
  calculateRotatedDimensions,
  type ImageTransformSettings,
  type ImageRotateBatchResult,
} from "@/src/components/tools/processors/image/rotate-image";
import {
  inspectImageFile,
  type ImageInspection,
} from "@/src/components/tools/processors/image/compress-image";
import { formatBytes, triggerDownload } from "@/src/components/tools/processors/other/other-utils";

const imageRotateMetadata: ToolMetadata = {
  id: "image-rotate",
  name: "Image Rotator",
  description:
    "Rotate and flip JPG, PNG, and WebP images by 90°, 180°, or mirror horizontally and vertically with instant live preview and batch support.",
  category: "Image",
  categoryHref: "/tools?category=Image",
  icon: RotateCw,
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
      title: "Rotate and flip",
      description:
        "Rotate by 90° clockwise/counter-clockwise, 180°, or flip horizontally and vertically with instant live visual feedback.",
    },
    {
      step: 3,
      title: "Process and download",
      description:
        "Click Rotate Images to transform the pixels using the Canvas API. Download individual files or a ZIP archive.",
    },
  ],
  features: [
    {
      title: "Composable Transformations",
      description:
        "Combine multiple 90° and 180° rotations with horizontal and vertical flips without resetting previous adjustments.",
      icon: RotateCw,
    },
    {
      title: "Independent Batch Controls",
      description:
        "Adjust each image individually or apply the current orientation settings across all uploaded images with a single click.",
      icon: Sparkles,
    },
    {
      title: "100% In-Browser Canvas API",
      description:
        "Pixels are genuinely transformed and re-encoded locally inside your browser memory. No photos are ever uploaded to remote servers.",
      icon: ShieldCheck,
    },
  ],
  faqs: [
    {
      question: "Does rotating an image by 90° change its pixel dimensions?",
      answer:
        "Yes! Rotating an image by 90° or 270° swaps its width and height (e.g. a 1920 × 1080 landscape photo becomes 1080 × 1920 portrait) without stretching or distortion.",
    },
    {
      question: "Are rotations and flips combined properly?",
      answer:
        "Yes! You can rotate an image 90° right and then mirror it horizontally. The Canvas transformation matrix calculates the exact coordinates to preserve pixel fidelity.",
    },
    {
      question: "How does transparent PNG background handling work?",
      answer:
        "When exporting to PNG or WebP, transparency is fully preserved. If you choose JPEG, transparent areas are cleanly composited over your chosen background color.",
    },
    {
      question: "Can I rotate multiple photos with different orientations in one batch?",
      answer:
        "Yes! Each uploaded image maintains its own independent rotation angle and flip settings. You can edit each image separately before batch downloading.",
    },
  ],
  privacyNote:
    "iUseDaily transforms your images entirely inside your local browser memory. No photos or data are ever transmitted to external servers.",
};

const BACKGROUND_COLORS = [
  { label: "White", value: "#FFFFFF", colorClass: "bg-white border-border" },
  { label: "Black", value: "#000000", colorClass: "bg-black border-neutral-700" },
  { label: "Slate", value: "#F1F5F9", colorClass: "bg-slate-100 border-slate-300" },
];

export default function ImageRotatePage() {
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [inspections, setInspections] = useState<Map<string, ImageInspection>>(new Map());

  // Active Selected Image for Main Stage
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  // Per-Image Transform Settings: Map<file.id, ImageTransformSettings>
  const [transformsMap, setTransformsMap] = useState<Record<string, ImageTransformSettings>>({});

  // Output Settings
  const [outputFormat, setOutputFormat] = useState<"original" | "image/png" | "image/jpeg" | "image/webp">("original");
  const [quality, setQuality] = useState<number>(92);
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");

  // Processing & State
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<ImageRotateBatchResult | null>(null);
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
    const newTransforms: Record<string, ImageTransformSettings> = { ...transformsMap };

    for (const file of newIncomingFiles) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const previewUrl = registerUrl(URL.createObjectURL(file));

      const inspection = await inspectImageFile(file);
      newInspections.set(file.name, inspection);

      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      newTransforms[id] = {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
      };

      newToolFiles.push({
        id,
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
    setTransformsMap(newTransforms);
    setFiles((prev) => {
      const updated = [...prev, ...newToolFiles];
      if (!activeFileId && updated.length > 0) {
        setActiveFileId(updated[0].id);
      }
      return updated;
    });

    setIsReadingFiles(false);
  };

  // Active File Reference
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || files[0] || null;
  }, [files, activeFileId]);

  // Active Image Settings
  const activeTransforms: ImageTransformSettings = useMemo(() => {
    if (!activeFile) {
      return { rotation: 0, flipHorizontal: false, flipVertical: false };
    }
    return (
      transformsMap[activeFile.id] || {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
      }
    );
  }, [activeFile, transformsMap]);

  // Update settings for active image
  const updateActiveTransform = (
    updater: (prev: ImageTransformSettings) => ImageTransformSettings
  ) => {
    if (!activeFile) return;
    setTransformsMap((prev) => ({
      ...prev,
      [activeFile.id]: updater(prev[activeFile.id] || {
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
      }),
    }));
  };

  // Specific transform actions
  const handleRotateRight90 = () => {
    updateActiveTransform((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const handleRotateLeft90 = () => {
    updateActiveTransform((prev) => ({
      ...prev,
      rotation: (prev.rotation - 90 + 360) % 360,
    }));
  };

  const handleRotate180 = () => {
    updateActiveTransform((prev) => ({
      ...prev,
      rotation: (prev.rotation + 180) % 360,
    }));
  };

  const handleToggleFlipH = () => {
    updateActiveTransform((prev) => ({
      ...prev,
      flipHorizontal: !prev.flipHorizontal,
    }));
  };

  const handleToggleFlipV = () => {
    updateActiveTransform((prev) => ({
      ...prev,
      flipVertical: !prev.flipVertical,
    }));
  };

  const handleResetActiveTransforms = () => {
    updateActiveTransform(() => ({
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    }));
  };

  // Apply current active settings to all uploaded images
  const handleApplyToAll = () => {
    if (!activeFile) return;
    const current = activeTransforms;
    const updated: Record<string, ImageTransformSettings> = {};
    files.forEach((f) => {
      updated[f.id] = { ...current };
    });
    setTransformsMap(updated);
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
      const remaining = prev.filter((f) => f.id !== id);
      if (activeFileId === id) {
        setActiveFileId(remaining[0]?.id || null);
      }
      return remaining;
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
    setTransformsMap({});
    setActiveFileId(null);
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
    setTransformsMap({});
    setActiveFileId(null);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setBatchResult(null);
    setErrorMessage(null);
  };

  // Re-adjust settings
  const handleReconfigure = () => {
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setBatchResult(null);
    setErrorMessage(null);
  };

  // Detect transparent images converted to JPEG
  const hasAnyTransparentImages = useMemo(() => {
    return Array.from(inspections.values()).some((info) => info.hasTransparency);
  }, [inspections]);

  const isConvertingTransparentToJpeg =
    hasAnyTransparentImages && outputFormat === "image/jpeg";

  // Active Transformed Dimensions
  const activeDimensions = useMemo(() => {
    if (!activeFile?.dimensions) return null;
    return calculateRotatedDimensions(
      activeFile.dimensions.width,
      activeFile.dimensions.height,
      activeTransforms.rotation
    );
  }, [activeFile, activeTransforms.rotation]);

  // Valid files
  const validFiles = files.filter((f) => f.status === "ready");
  const canRotate = validFiles.length > 0 && status !== "processing" && !isReadingFiles;

  // Execute batch rotation
  const handleRotateImages = async () => {
    if (!canRotate) return;

    setStatus("processing");
    setProgress(5);
    setStatusMessage(`Preparing ${validFiles.length} images for transformation...`);
    setErrorMessage(null);

    try {
      const rawFiles = validFiles.map((vf) => vf.file);

      // Build per-file settings map keyed by file name
      const nameSettingsMap = new Map<string, ImageTransformSettings>();
      validFiles.forEach((f) => {
        const trans = transformsMap[f.id] || {
          rotation: 0,
          flipHorizontal: false,
          flipVertical: false,
        };
        nameSettingsMap.set(f.file.name, trans);
      });

      const res = await rotateImageBatch(
        rawFiles,
        nameSettingsMap,
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
        registerUrl(item.rotatedPreviewUrl);
      });
      if (res.zipUrl) {
        registerUrl(res.zipUrl);
      }

      setBatchResult(res);
      setStatus("success");
      setProgress(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image transformation failed.";
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
                    Transformation Complete!
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
                  <span>Adjust Transforms</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Rotate More</span>
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
                <span className="text-[11px] text-muted-foreground">Output Total Size</span>
                <p className="text-sm font-bold text-primary">
                  {formatBytes(batchResult.totalRotatedSize)}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Format</span>
                <p className="font-mono text-sm font-bold text-foreground">
                  {outputFormat === "original" ? "Original" : outputFormat.replace("image/", "").toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Results List: Individual Transformed Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground">
              Transformed Images ({batchResult.items.length})
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
                          name: item.rotatedName,
                          size: item.rotatedSize,
                          formattedSize: item.rotatedFormattedSize,
                          extension: item.rotatedFormat.toLowerCase(),
                          type: item.rotatedMimeType,
                          status: "ready",
                          previewUrl: item.rotatedPreviewUrl,
                          dimensions: {
                            width: item.rotatedWidth,
                            height: item.rotatedHeight,
                          },
                        })
                      }
                      className="group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40"
                      title="Click to view full preview"
                    >
                      <Image
                        src={item.rotatedPreviewUrl}
                        alt={item.rotatedName}
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
                          {item.rotatedName}
                        </h5>
                        <div className="flex flex-wrap items-center gap-1 font-mono text-[10px]">
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary font-bold">
                            {item.rotation}°
                          </span>
                          {item.flipHorizontal && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground font-semibold">
                              Flip H
                            </span>
                          )}
                          {item.flipVertical && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground font-semibold">
                              Flip V
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="font-mono">
                          {item.originalWidth} × {item.originalHeight} px → {item.rotatedWidth} × {item.rotatedHeight} px
                        </span>
                        <span>•</span>
                        <span>{item.rotatedFormattedSize}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Individual Download */}
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => triggerDownload(item.downloadUrl, item.rotatedName)}
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
          accept={imageRotateMetadata.accept}
          multiple={true}
          maxSizeMB={imageRotateMetadata.maxFileSizeMB}
          maxFiles={imageRotateMetadata.maxFiles}
          onFilesSelected={handleFilesSelected}
          disabled={status === "processing"}
          isReading={isReadingFiles}
          title="Drop your images here"
          supportingText="or browse to select from your device"
          acceptedTypesLabel="JPG, PNG, or WebP (up to 30 files, 25MB each)"
          className="flex-1"
        />
      ) : (
        /* Active Interactive Transformation Workspace */
        <div className="flex flex-1 flex-col justify-between space-y-4">
          {/* Active File Header */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-blue text-primary">
                <RotateCw className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-xs font-bold text-foreground">
                    {activeFile?.name}
                  </h4>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {activeFile?.extension.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{activeFile?.formattedSize}</span>
                  {activeDimensions && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-foreground font-medium">
                        {activeDimensions.width} × {activeDimensions.height} px
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetActiveTransforms}
                title="Reset orientation for this image"
                className="flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset Image</span>
              </button>

              <button
                type="button"
                onClick={() => activeFile && handleRemoveFile(activeFile.id)}
                title="Remove this image"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {files.length > 1 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  title="Remove all images"
                  className="flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-[11px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Live Transformation Stage */}
          <div className="relative flex min-h-[360px] sm:min-h-[440px] w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-neutral-950 p-6 shadow-inner">
            {activeFile?.previewUrl ? (
              <div
                className="relative max-h-[380px] max-w-[90%] transition-transform duration-300 ease-out"
                style={{
                  transform: `rotate(${activeTransforms.rotation}deg) scaleX(${
                    activeTransforms.flipHorizontal ? -1 : 1
                  }) scaleY(${activeTransforms.flipVertical ? -1 : 1})`,
                }}
              >
                <Image
                  src={activeFile.previewUrl}
                  alt={activeFile.name}
                  width={activeFile.dimensions?.width || 600}
                  height={activeFile.dimensions?.height || 400}
                  unoptimized
                  className="max-h-[340px] w-auto rounded-lg object-contain shadow-2xl"
                />
              </div>
            ) : null}

            {/* Live orientation badge overlay */}
            <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2 rounded-lg bg-black/75 px-3 py-1.5 text-[11px] font-mono text-white backdrop-blur-md">
              <span className="font-bold text-primary">
                {activeTransforms.rotation}°
              </span>
              {activeTransforms.flipHorizontal && (
                <span className="text-muted-foreground">| Flipped H</span>
              )}
              {activeTransforms.flipVertical && (
                <span className="text-muted-foreground">| Flipped V</span>
              )}
              {activeDimensions && (
                <span className="border-l border-white/20 pl-2 text-white/90">
                  {activeDimensions.width} × {activeDimensions.height} px
                </span>
              )}
            </div>
          </div>

          {/* Action Toolbar: Rotate 90° L/R, 180°, Flip H/V */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Orientation Controls
              </span>
              <span className="text-[11px] text-muted-foreground">
                Instant Canvas Preview
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {/* Rotate Left 90 */}
              <button
                type="button"
                onClick={handleRotateLeft90}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background p-2.5 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-95"
              >
                <RotateCcw className="h-4 w-4 text-primary" />
                <span>-90° Left</span>
              </button>

              {/* Rotate Right 90 */}
              <button
                type="button"
                onClick={handleRotateRight90}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background p-2.5 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-95"
              >
                <RotateCw className="h-4 w-4 text-primary" />
                <span>+90° Right</span>
              </button>

              {/* Rotate 180 */}
              <button
                type="button"
                onClick={handleRotate180}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background p-2.5 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-95"
              >
                <RefreshCw className="h-4 w-4 text-primary" />
                <span>180°</span>
              </button>

              {/* Flip Horizontal */}
              <button
                type="button"
                onClick={handleToggleFlipH}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all active:scale-95 ${
                  activeTransforms.flipHorizontal
                    ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/20"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <FlipHorizontal className="h-4 w-4" />
                <span>Flip Horiz</span>
              </button>

              {/* Flip Vertical */}
              <button
                type="button"
                onClick={handleToggleFlipV}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all active:scale-95 ${
                  activeTransforms.flipVertical
                    ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/20"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <FlipVertical className="h-4 w-4" />
                <span>Flip Vert</span>
              </button>
            </div>
          </div>

          {/* Multi-Image Thumbnail Selector (when > 1 image uploaded) */}
          {files.length > 1 && (
            <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    Uploaded Images ({files.length})
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Click to edit orientation individually
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleApplyToAll}
                  className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                  title="Copy active orientation to all images"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Apply settings to all</span>
                </button>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1">
                {files.map((f, idx) => {
                  const isActive = f.id === activeFileId;
                  const t = transformsMap[f.id] || {
                    rotation: 0,
                    flipHorizontal: false,
                    flipVertical: false,
                  };
                  return (
                    <div
                      key={f.id}
                      onClick={() => setActiveFileId(f.id)}
                      className={`group relative flex h-20 w-24 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border p-1 transition-all ${
                        isActive
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm"
                          : "border-border bg-muted/20 hover:border-primary/50"
                      }`}
                    >
                      <div
                        className="relative h-12 w-full transition-transform duration-200"
                        style={{
                          transform: `rotate(${t.rotation}deg) scaleX(${
                            t.flipHorizontal ? -1 : 1
                          }) scaleY(${t.flipVertical ? -1 : 1})`,
                        }}
                      >
                        {f.previewUrl ? (
                          <Image
                            src={f.previewUrl}
                            alt={f.name}
                            width={48}
                            height={48}
                            unoptimized
                            className="h-full w-full object-contain"
                          />
                        ) : null}
                      </div>

                      <div className="mt-1 flex w-full items-center justify-between px-1 text-[9px] font-mono">
                        <span className="truncate text-muted-foreground max-w-[45px]">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-primary">{t.rotation}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add more images dropzone */}
          {files.length < (imageRotateMetadata.maxFiles ?? 30) && (
            <div className="pt-1">
              <FileUpload
                accept={imageRotateMetadata.accept}
                multiple={true}
                maxSizeMB={imageRotateMetadata.maxFileSizeMB}
                maxFiles={imageRotateMetadata.maxFiles ?? 30}
                currentFileCount={files.length}
                onFilesSelected={handleFilesSelected}
                disabled={status === "processing"}
                isReading={isReadingFiles}
                title="Add more images"
                supportingText="Drop additional JPG, PNG, or WebP files"
                className="py-3"
              />
            </div>
          )}

          {/* Processing Error Alert */}
          {errorMessage && (
            <ToolError
              message={errorMessage}
              onRetry={handleRotateImages}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* Processing Status Bar */}
          {status === "processing" && (
            <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4 animate-spin text-primary" />
                  {statusMessage || "Transforming images on Canvas..."}
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
    <ToolSidebar title="Rotation & Export Options">
      {/* 1. Active Image Orientation Summary */}
      <div className="space-y-2 rounded-xl bg-muted/40 p-3.5 text-xs">
        <span className="font-bold text-foreground">Current Image Orientation</span>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <span className="text-[11px] text-muted-foreground">Angle</span>
            <p className="font-mono font-bold text-primary">
              {activeTransforms.rotation}°
            </p>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground">Flip</span>
            <p className="font-mono font-medium text-foreground">
              {activeTransforms.flipHorizontal && activeTransforms.flipVertical
                ? "Both H + V"
                : activeTransforms.flipHorizontal
                ? "Horizontal"
                : activeTransforms.flipVertical
                ? "Vertical"
                : "None"}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* 2. Target Format Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">
          Export Format
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: "original", label: "Original" },
            { id: "image/webp", label: "WebP" },
            { id: "image/png", label: "PNG" },
            { id: "image/jpeg", label: "JPEG" },
          ].map((fmt) => {
            const isSelected = outputFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() =>
                  setOutputFormat(
                    fmt.id as "original" | "image/png" | "image/jpeg" | "image/webp"
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
      </div>

      {/* 3. Quality Slider (for JPG and WebP) */}
      {(outputFormat === "image/jpeg" || outputFormat === "image/webp" || outputFormat === "original") && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Export Quality</span>
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
        </div>
      )}

      {/* 4. JPEG Background Color (active when JPG is selected) */}
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

          {isConvertingTransparentToJpeg && (
            <div className="flex items-start gap-1.5 rounded-lg bg-amber-500/10 p-2 text-[10px] text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                Transparent areas will be filled with the selected background color.
              </span>
            </div>
          )}
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
        {validFiles.length > 0 && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Total input size</span>
            <span className="font-semibold text-foreground">
              {formatBytes(validFiles.reduce((acc, f) => acc + f.size, 0))}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Processing mode</span>
          <span className="font-semibold text-primary">In-Browser Canvas API</span>
        </div>
      </div>

      {/* Primary Action Button */}
      {status !== "success" && (
        <div className="pt-2">
          <ProcessingButton
            label={validFiles.length > 1 ? `Rotate ${validFiles.length} Images` : "Rotate Image"}
            loadingLabel="Rotating images..."
            isProcessing={status === "processing"}
            progress={progress}
            disabled={!canRotate}
            onClick={handleRotateImages}
            icon={RotateCw}
          />
          {validFiles.length === 0 ? (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Select one or more images to begin
            </p>
          ) : (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Ready to transform {validFiles.length} {validFiles.length === 1 ? "image" : "images"} offline
            </p>
          )}
        </div>
      )}
    </ToolSidebar>
  );

  return (
    <ToolPageLayout
      tool={imageRotateMetadata}
      workspaceContent={workspaceContent}
      sidebarContent={sidebarContent}
    />
  );
}
