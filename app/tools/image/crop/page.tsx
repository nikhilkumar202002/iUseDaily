"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Cropper, { type Area, type Point } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import {
  Scissors,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Download,
  AlertTriangle,
  Check,
  Crop,
  Settings2,
  Palette,
  Eye,
  RefreshCw,
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
  cropImageFile,
  ASPECT_RATIO_PRESETS,
  type CroppedImageResult,
  type CropAreaPixels,
} from "@/src/components/tools/processors/image/crop-image";
import {
  inspectImageFile,
  type ImageInspection,
} from "@/src/components/tools/processors/image/compress-image";
import { formatBytes, triggerDownload } from "@/src/components/tools/processors/other/other-utils";

const imageCropMetadata: ToolMetadata = {
  id: "image-crop",
  name: "Image Cropper",
  description:
    "Crop JPG, PNG, and WebP images to exact pixel dimensions with an interactive crop area, custom aspect ratios, zoom, and rotation controls.",
  category: "Image",
  categoryHref: "/tools?category=Image",
  icon: Scissors,
  badge: "Popular",
  accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
  maxFiles: 1,
  maxFileSizeMB: 25,
  instructions: [
    {
      step: 1,
      title: "Upload your image",
      description:
        "Select your JPG, PNG, or WebP photo from your device or drag and drop it into the workspace.",
    },
    {
      step: 2,
      title: "Adjust crop selection & angle",
      description:
        "Drag and scale the crop frame, choose your aspect ratio (Free, 1:1, 16:9, etc.), and fine-tune zoom and rotation.",
    },
    {
      step: 3,
      title: "Extract and download",
      description:
        "Click Crop Image. The selected pixel region is extracted locally via Canvas API into your chosen format.",
    },
  ],
  features: [
    {
      title: "Interactive Visual Cropping",
      description:
        "Smooth touch and mouse-driven crop frame powered by react-easy-crop with live pixel dimensions and rule-of-thirds grid.",
      icon: Crop,
    },
    {
      title: "100% Client-Side Privacy",
      description:
        "Your image is cropped strictly within your browser using the HTML5 Canvas API. No photos are ever uploaded or stored externally.",
      icon: ShieldCheck,
    },
    {
      title: "Rotation & Transparency Support",
      description:
        "Fine-tune angle orientation, preserve alpha transparency for PNG and WebP, or specify custom background colors for JPEG.",
      icon: Scissors,
    },
  ],
  faqs: [
    {
      question: "Are crop coordinates extracted at full original resolution?",
      answer:
        "Yes! The interactive canvas editor accurately scales coordinates to match your image's original natural pixel dimensions, ensuring maximum visual sharpness.",
    },
    {
      question: "How does transparent PNG background cropping work?",
      answer:
        "When exporting as PNG or WebP, transparency is 100% preserved. If you export as JPEG, you can choose a custom background color (default: white) to avoid unsightly black borders.",
    },
    {
      question: "Can I crop freely without any fixed aspect ratio?",
      answer:
        "Yes! Select the 'Free' aspect ratio option to freely drag and resize any width and height independently.",
    },
    {
      question: "What image formats are supported?",
      answer:
        "You can upload JPG, JPEG, PNG, and WebP files up to 25 MB in size.",
    },
  ],
  privacyNote:
    "iUseDaily crops images entirely inside your local browser memory. No photos are ever transmitted over the network.",
};

const BACKGROUND_COLORS = [
  { label: "White", value: "#FFFFFF", colorClass: "bg-white border-border" },
  { label: "Black", value: "#000000", colorClass: "bg-black border-neutral-700" },
  { label: "Slate", value: "#F1F5F9", colorClass: "bg-slate-100 border-slate-300" },
  { label: "Transparent", value: "transparent", colorClass: "bg-transparent border-dashed border-muted-foreground/50" },
];

export default function ImageCropPage() {
  const [file, setFile] = useState<ToolFile | null>(null);
  const [inspection, setInspection] = useState<ImageInspection | null>(null);

  // Interactive Cropper States
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [selectedRatioId, setSelectedRatioId] = useState<string>("free");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropAreaPixels | null>(null);

  // Output Settings
  const [outputFormat, setOutputFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [quality, setQuality] = useState<number>(90);
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [outputBaseName, setOutputBaseName] = useState<string>("cropped-image");

  // Processing & Lifecycle
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cropResult, setCropResult] = useState<CroppedImageResult | null>(null);
  const [previewFile, setPreviewFile] = useState<ToolFile | null>(null);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);

  // Object URL lifecycle tracking
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

  // Handle file selection
  const handleFilesSelected = async (incomingFiles: File[]) => {
    if (incomingFiles.length === 0) return;
    const selectedFile = incomingFiles[0];

    setIsReadingFile(true);
    setErrorMessage(null);

    const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const previewUrl = registerUrl(URL.createObjectURL(selectedFile));

    const info = await inspectImageFile(selectedFile);
    setInspection(info);

    const initialToolFile: ToolFile = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file: selectedFile,
      name: selectedFile.name,
      size: selectedFile.size,
      formattedSize: formatBytes(selectedFile.size),
      extension: ext,
      type: selectedFile.type || `image/${ext}`,
      status: info.isValid ? "ready" : "error",
      error: info.error,
      previewUrl,
      dimensions: info.isValid
        ? { width: info.width, height: info.height }
        : undefined,
    };

    setFile(initialToolFile);
    setOutputBaseName(`${selectedFile.name.replace(/\.[^/.]+$/, "")}_cropped`);

    // Match output format intelligently
    if (selectedFile.type === "image/png" || ext === "png") {
      setOutputFormat("image/png");
    } else if (selectedFile.type === "image/webp" || ext === "webp") {
      setOutputFormat("image/webp");
    } else {
      setOutputFormat("image/jpeg");
    }

    // Reset crop controls
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCropResult(null);
    setStatus("idle");
    setIsReadingFile(false);
  };

  // Remove / replace active image
  const handleRemoveFile = () => {
    revokeAllUrls();
    setFile(null);
    setInspection(null);
    setCropResult(null);
    setStatus("idle");
    setStatusMessage("");
    setErrorMessage(null);
  };

  // Full reset
  const handleReset = () => {
    revokeAllUrls();
    setFile(null);
    setInspection(null);
    setCropResult(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setSelectedRatioId("free");
    setStatus("idle");
    setStatusMessage("");
    setErrorMessage(null);
  };

  // Reset crop view without losing the image
  const handleResetCropArea = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  // Re-adjust crop
  const handleReconfigure = () => {
    setStatus("idle");
    setCropResult(null);
  };

  // Callback when crop area changes in react-easy-crop
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Compute selected aspect ratio numeric value
  const selectedRatioValue = useMemo(() => {
    const preset = ASPECT_RATIO_PRESETS.find((p) => p.id === selectedRatioId);
    return preset?.value;
  }, [selectedRatioId]);

  // Rotate shortcut helpers
  const handleRotateCw = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateCcw = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const canCrop =
    file &&
    file.status === "ready" &&
    croppedAreaPixels &&
    croppedAreaPixels.width > 0 &&
    croppedAreaPixels.height > 0 &&
    status !== "processing";

  // Execute Canvas Crop
  const handleExecuteCrop = async () => {
    if (!file || !canCrop || !croppedAreaPixels) return;

    setStatus("processing");
    setStatusMessage("Extracting cropped pixels from image...");
    setErrorMessage(null);

    try {
      const result = await cropImageFile(
        file.file,
        {
          cropAreaPixels: croppedAreaPixels,
          rotation,
          outputFormat,
          quality,
          backgroundColor:
            outputFormat === "image/jpeg" ? backgroundColor : undefined,
          outputFilename: outputBaseName,
        },
        inspection || undefined
      );

      registerUrl(result.previewUrl);
      setCropResult(result);
      setStatus("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to crop image.";
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  // Workspace Main Content (Left Card)
  const workspaceContent = (
    <div className="flex h-full flex-1 flex-col space-y-6">
      {status === "success" && cropResult ? (
        /* Result Preview View */
        <div className="flex h-full flex-1 flex-col space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Image Cropped Successfully!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Rendered at {cropResult.width} × {cropResult.height} px ({cropResult.formattedSize})
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerDownload(cropResult.downloadUrl, cropResult.fileName)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:opacity-95"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Cropped Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleReconfigure}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span>Adjust Crop</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Crop Another Image</span>
                </button>
              </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/80 pt-4 sm:grid-cols-4">
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Original Dimensions</span>
                <p className="font-mono text-xs font-bold text-foreground">
                  {file?.dimensions ? `${file.dimensions.width} × ${file.dimensions.height} px` : "—"}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Cropped Dimensions</span>
                <p className="font-mono text-xs font-bold text-primary">
                  {cropResult.width} × {cropResult.height} px
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Original Size</span>
                <p className="text-xs font-bold text-foreground">
                  {file?.formattedSize}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground">Output Format & Size</span>
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                    {cropResult.format}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {cropResult.formattedSize}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* High-Resolution Cropped Preview Showcase */}
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-muted/20 p-6 shadow-inner">
            <div
              onClick={() =>
                setPreviewFile({
                  id: "cropped",
                  file: file?.file || ({} as File),
                  name: cropResult.fileName,
                  size: cropResult.fileSize,
                  formattedSize: cropResult.formattedSize,
                  extension: cropResult.format.toLowerCase(),
                  type: `image/${cropResult.format.toLowerCase()}`,
                  status: "ready",
                  previewUrl: cropResult.previewUrl,
                  dimensions: { width: cropResult.width, height: cropResult.height },
                })
              }
              className="group relative max-h-[500px] max-w-full cursor-pointer overflow-hidden rounded-xl border border-border shadow-md"
              title="Click to view full screen preview"
            >
              <Image
                src={cropResult.previewUrl}
                alt={cropResult.fileName}
                width={cropResult.width}
                height={cropResult.height}
                unoptimized
                className="max-h-[500px] w-auto object-contain transition-transform group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Eye className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Click preview to inspect full resolution modal
            </p>
          </div>
        </div>
      ) : !file ? (
        /* Empty Upload Zone */
        <FileUpload
          accept={imageCropMetadata.accept}
          multiple={false}
          maxSizeMB={imageCropMetadata.maxFileSizeMB}
          maxFiles={1}
          onFilesSelected={handleFilesSelected}
          disabled={status === "processing"}
          isReading={isReadingFile}
          title="Drop your image here"
          supportingText="or browse to select from your device"
          acceptedTypesLabel="Single JPG, PNG, or WebP image up to 25 MB"
          className="flex-1"
        />
      ) : (
        /* Interactive Crop Workspace */
        <div className="flex flex-1 flex-col justify-between space-y-4">
          {/* Active File Header */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-blue text-primary">
                <Scissors className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-xs font-bold text-foreground">
                    {file.name}
                  </h4>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {file.extension.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{file.formattedSize}</span>
                  {file.dimensions && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-foreground font-medium">
                        {file.dimensions.width} × {file.dimensions.height} px
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetCropArea}
                title="Reset zoom and rotation"
                className="flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset View</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveFile}
                title="Replace image"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Interactive React-Easy-Crop Canvas Area */}
          <div className="relative min-h-[380px] sm:min-h-[460px] w-full overflow-hidden rounded-2xl border border-border bg-neutral-950 shadow-inner">
            {file.previewUrl && (
              <Cropper
                image={file.previewUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={selectedRatioValue}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                showGrid={true}
                zoomSpeed={0.5}
                minZoom={1}
                maxZoom={3}
              />
            )}

            {/* Live output dimensions badge overlay */}
            {croppedAreaPixels && (
              <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-lg bg-black/75 px-2.5 py-1 text-[11px] font-mono font-medium text-white backdrop-blur-md">
                <Crop className="h-3 w-3 text-primary" />
                <span>
                  {croppedAreaPixels.width} × {croppedAreaPixels.height} px
                </span>
              </div>
            )}
          </div>

          {/* Canvas Interactive Controls: Aspect Ratio + Zoom + Rotation */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            {/* Aspect Ratio Selector Pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {ASPECT_RATIO_PRESETS.map((ratio) => {
                  const isSelected = selectedRatioId === ratio.id;
                  return (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setSelectedRatioId(ratio.id)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/20"
                          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className="text-xs font-bold">{ratio.label}</span>
                      <span className="text-[10px] opacity-75">{ratio.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zoom and Rotate Toolbars */}
            <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
              {/* Zoom Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    <ZoomIn className="h-3.5 w-3.5" />
                    <span>Zoom</span>
                  </span>
                  <span className="font-mono text-primary font-bold">
                    {zoom.toFixed(2)}x
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ZoomOut className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                  />
                  <ZoomIn className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </div>
              </div>

              {/* Rotation Slider & Shortcut Buttons */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Rotation</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRotateCcw}
                      title="Rotate 90° CCW"
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-mono text-primary font-bold w-10 text-right">
                      {rotation}°
                    </span>
                    <button
                      type="button"
                      onClick={handleRotateCw}
                      title="Rotate 90° CW"
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Processing Error Alert */}
          {errorMessage && (
            <ToolError
              message={errorMessage}
              onRetry={handleExecuteCrop}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* Processing Status Bar */}
          {status === "processing" && (
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-4 shadow-sm text-xs font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4 animate-spin text-primary" />
              <span>{statusMessage || "Rendering cropped pixel coordinates..."}</span>
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
    <ToolSidebar title="Crop Export Options">
      {/* 1. Output Format Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">
          Export Format
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: "image/png", label: "PNG" },
            { id: "image/jpeg", label: "JPEG" },
            { id: "image/webp", label: "WebP" },
          ].map((fmt) => {
            const isSelected = outputFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() =>
                  setOutputFormat(fmt.id as "image/png" | "image/jpeg" | "image/webp")
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
          {outputFormat === "image/png"
            ? "PNG preserves alpha transparency with lossless clarity."
            : outputFormat === "image/webp"
            ? "WebP provides excellent lossy compression and preserves transparency."
            : "JPEG provides high photographic compression without transparency."}
        </p>
      </div>

      <div className="border-t border-border" />

      {/* 2. Quality Slider (for JPEG / WebP) */}
      {(outputFormat === "image/jpeg" || outputFormat === "image/webp") && (
        <div className="space-y-2 animate-in fade-in duration-200">
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
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
          />
        </div>
      )}

      {/* 3. JPEG Background Color (active when JPEG is selected) */}
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

          <div className="grid grid-cols-4 gap-1.5">
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

          {inspection?.hasTransparency && (
            <div className="flex items-start gap-1.5 rounded-lg bg-amber-500/10 p-2 text-[10px] text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                Transparent areas will be rendered against the selected solid background color.
              </span>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border" />

      {/* 4. Output Filename */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Output Filename
        </label>
        <input
          type="text"
          value={outputBaseName}
          onChange={(e) => setOutputBaseName(e.target.value)}
          disabled={status === "processing" || !file}
          placeholder="cropped-image"
          className="h-9 w-full rounded-xl border border-border bg-background px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
      </div>

      <div className="border-t border-border" />

      {/* 5. Summary Box */}
      <div className="space-y-2 rounded-xl bg-muted/50 p-3.5 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Source image</span>
          <span className="font-semibold text-foreground">
            {file ? file.name : "None"}
          </span>
        </div>
        {file?.dimensions && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Source dimensions</span>
            <span className="font-mono font-semibold text-foreground">
              {file.dimensions.width} × {file.dimensions.height} px
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Target crop size</span>
          <span className="font-mono font-semibold text-primary">
            {croppedAreaPixels
              ? `${croppedAreaPixels.width} × ${croppedAreaPixels.height} px`
              : "Calculating..."}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Aspect ratio</span>
          <span className="font-semibold text-foreground">
            {ASPECT_RATIO_PRESETS.find((p) => p.id === selectedRatioId)?.label}
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
            label="Crop Image"
            loadingLabel="Cropping image..."
            isProcessing={status === "processing"}
            disabled={!canCrop}
            onClick={handleExecuteCrop}
            icon={Scissors}
          />
          {!file ? (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Select an image to begin cropping
            </p>
          ) : (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Ready to extract {croppedAreaPixels ? `${croppedAreaPixels.width}×${croppedAreaPixels.height} px` : "crop"} locally
            </p>
          )}
        </div>
      )}
    </ToolSidebar>
  );

  return (
    <ToolPageLayout
      tool={imageCropMetadata}
      workspaceContent={workspaceContent}
      sidebarContent={sidebarContent}
    />
  );
}
