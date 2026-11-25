"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FilePlus,
  Sparkles,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Layout,
  Maximize2,
  Crop,
  AlertTriangle,
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
  ResultPanel,
  ToolError,
  type ToolFile,
  type ProcessingStatus,
  type ProcessingResult,
} from "@/src/components/tools/shared";
import {
  convertImagesToPdf,
  inspectImageFile,
  type PageSizeOption,
  type PageOrientationOption,
  type ImageFitOption,
  type MarginOption,
} from "@/src/components/tools/processors/pdf/image-to-pdf";
import { formatBytes } from "@/src/components/tools/processors/other/other-utils";

const imageToPdfMetadata: ToolMetadata = {
  id: "image-to-pdf",
  name: "Image to PDF",
  description:
    "Convert multiple JPG, PNG, and WebP images into a single professional PDF document with custom margins, orientation, and page sizing.",
  category: "PDF",
  categoryHref: "/tools?category=PDF",
  icon: FilePlus,
  badge: "Popular",
  accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
  maxFiles: 30,
  maxFileSizeMB: 25,
  instructions: [
    {
      step: 1,
      title: "Upload your images",
      description:
        "Select and upload one or multiple JPG, PNG, or WebP images, or simply drag and drop them into the workspace.",
    },
    {
      step: 2,
      title: "Configure layout & margins",
      description:
        "Arrange image order with drag-and-drop, choose your preferred page size (A4, Letter, or Fit to Image), orientation, and margins.",
    },
    {
      step: 3,
      title: "Convert & download",
      description:
        "Click Convert to PDF. Your images are compiled into a unified PDF document directly in your browser.",
    },
  ],
  features: [
    {
      title: "Flexible Page Layouts",
      description:
        "Choose between standard A4, US Letter, or auto-fitting to original image dimensions with custom margins.",
      icon: Layout,
    },
    {
      title: "100% In-Browser Privacy",
      description:
        "Your photos and sensitive documents are processed locally inside your browser memory. Nothing is uploaded to cloud servers.",
      icon: ShieldCheck,
    },
    {
      title: "Multi-Format Support",
      description:
        "Seamlessly combines JPG, PNG (with transparent background handling), and WebP into crisp vector-embedded PDF pages.",
      icon: Sparkles,
    },
  ],
  faqs: [
    {
      question: "Will the original quality of my images be preserved?",
      answer:
        "Yes! iUseDaily embeds JPEG and PNG streams directly into the PDF without lossy re-compression, preserving the full resolution and crispness of your original photos.",
    },
    {
      question: "How does transparent PNG handling work?",
      answer:
        "Transparent areas in PNG graphics are rendered over a clean white background, ensuring your charts, logos, and illustrations look neat and legible on every PDF reader.",
    },
    {
      question: "Can I reorder my images before creating the PDF?",
      answer:
        "Yes! Use the drag handle or the up/down arrow buttons next to each image in the file list to set the exact sequence of pages in your final PDF document.",
    },
    {
      question: "What is the difference between 'Contain' and 'Cover' fitting?",
      answer:
        "'Contain' scales the entire image so it fits within your page margins without any cropping. 'Cover' fills the entire page area, cropping excess edges to avoid any white borders.",
    },
  ],
  privacyNote:
    "iUseDaily converts your images into PDF documents entirely within your browser memory. No photos or personal documents are stored or uploaded externally.",
};

export default function ImageToPdfPage() {
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeOption>("a4");
  const [orientation, setOrientation] = useState<PageOrientationOption>("auto");
  const [fit, setFit] = useState<ImageFitOption>("contain");
  const [margin, setMargin] = useState<MarginOption>("small");
  const [customMarginPt, setCustomMarginPt] = useState<number>(36);
  const [outputName, setOutputName] = useState<string>("images-document.pdf");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [previewFile, setPreviewFile] = useState<ToolFile | null>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);

  // Active object URL lifecycle tracking
  const activeUrlsRef = useRef<string[]>([]);

  const revokeAllActiveUrls = () => {
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
      revokeAllActiveUrls();
    };
  }, []);

  // Handle image files selection and dimension extraction
  const handleFilesSelected = async (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setIsReadingFiles(true);
    setErrorMessage(null);

    const initialFormatted: ToolFile[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      formattedSize: formatBytes(file.size),
      extension: file.name.split(".").pop()?.toLowerCase() || "img",
      type: file.type || "image/jpeg",
      status: "reading",
    }));

    setFiles((prev) => [...prev, ...initialFormatted]);
    setStatus("idle");

    // Asynchronously inspect dimensions and preview URLs
    const inspectedFiles = await Promise.all(
      initialFormatted.map(async (toolFile) => {
        try {
          const inspected = await inspectImageFile(toolFile.file);
          activeUrlsRef.current.push(inspected.previewUrl);
          return {
            ...toolFile,
            previewUrl: inspected.previewUrl,
            dimensions: { width: inspected.width, height: inspected.height },
            status: "ready" as const,
          };
        } catch {
          return {
            ...toolFile,
            status: "error" as const,
            error: "Failed to decode image file",
          };
        }
      })
    );

    setFiles((prev) =>
      prev.map((f) => {
        const found = inspectedFiles.find((u) => u.id === f.id);
        return found || f;
      })
    );

    setIsReadingFiles(false);
  };

  // Reorder file position
  const handleReorderFiles = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= files.length ||
      toIndex >= files.length
    ) {
      return;
    }
    setFiles((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  // Remove a single file
  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Clear all files
  const handleClearAll = () => {
    revokeAllActiveUrls();
    setFiles([]);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setResult(null);
    setErrorMessage(null);
  };

  // Reset tool
  const handleReset = () => {
    revokeAllActiveUrls();
    setFiles([]);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setResult(null);
    setErrorMessage(null);
  };

  const validFiles = files.filter((f) => f.status === "ready");
  const hasErrorFiles = files.some((f) => f.status === "error");
  const totalSizeBytes = validFiles.reduce((acc, f) => acc + f.size, 0);
  const totalFormattedSize = formatBytes(totalSizeBytes);

  const isProcessing = status === "processing";
  const canConvert = validFiles.length > 0 && !hasErrorFiles && !isProcessing && !isReadingFiles;

  // Execute Image to PDF conversion
  const handleConvert = async () => {
    if (!canConvert) return;

    setStatus("processing");
    setProgress(5);
    setStatusMessage("Initializing PDF document...");
    setErrorMessage(null);

    try {
      const nativeFiles = validFiles.map((f) => f.file);
      const conversionResult = await convertImagesToPdf(nativeFiles, {
        pageSize,
        orientation,
        fit,
        margin,
        customMarginPt,
        outputFilename: outputName,
        onProgress: (percent, stepMessage) => {
          setProgress(percent);
          setStatusMessage(stepMessage);
        },
      });

      if (conversionResult.downloadUrl) {
        activeUrlsRef.current.push(conversionResult.downloadUrl);
      }

      setResult(conversionResult);
      setStatus("success");
      setProgress(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to convert images to PDF.";
      setErrorMessage(msg);
      setStatus("error");
      setProgress(undefined);
    }
  };

  // Workspace Main Content (Left Card)
  const workspaceContent = (
    <div className="flex h-full flex-1 flex-col space-y-6">
      {status === "success" && result ? (
        <ResultPanel
          result={result}
          onReset={handleReset}
          title="PDF Created Successfully!"
          subtitle={`Your ${result.itemCount} images have been combined into a unified ${result.pageCount}-page PDF document.`}
          downloadLabel="Download Created PDF"
          resetLabel="Convert more images"
        />
      ) : (
        <>
          {/* File Upload Zone */}
          <FileUpload
            accept={imageToPdfMetadata.accept}
            multiple={true}
            maxSizeMB={imageToPdfMetadata.maxFileSizeMB}
            maxFiles={imageToPdfMetadata.maxFiles}
            currentFileCount={files.length}
            onFilesSelected={handleFilesSelected}
            disabled={isProcessing}
            isReading={isReadingFiles}
            title="Drop your images here"
            supportingText="or browse to select from your device"
            acceptedTypesLabel="JPG, PNG, WebP up to 25 MB each"
            className="flex-1"
          />

          {/* Uploaded File List with Thumbnails & Dimensions */}
          {files.length > 0 && (
            <FileList
              files={files}
              onReorderFiles={handleReorderFiles}
              onRemoveFile={handleRemoveFile}
              onClearAll={handleClearAll}
              onPreviewFile={(f) => setPreviewFile(f)}
              disabled={isProcessing}
              title={`${files.length} ${files.length === 1 ? "image" : "images"} selected`}
            />
          )}

          {/* Warning when invalid files are present */}
          {hasErrorFiles && (
            <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                One or more images could not be decoded. Please remove them before creating your PDF.
              </span>
            </div>
          )}

          {/* Processing Error Message */}
          {errorMessage && (
            <ToolError
              message={errorMessage}
              onRetry={handleConvert}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* Real In-Progress Status Bar */}
          {isProcessing && (
            <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4 animate-spin text-primary" />
                  {statusMessage || "Creating PDF document..."}
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
        </>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );

  // Configuration Sidebar (Right Card)
  const sidebarContent = (
    <ToolSidebar title="PDF Layout Settings">
      {/* 1. Page Size */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Page Size
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "a4", label: "A4", hint: "Standard" },
              { id: "letter", label: "Letter", hint: "US Format" },
              { id: "fit", label: "Fit Image", hint: "Original" },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setPageSize(s.id)}
              disabled={isProcessing}
              className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                pageSize === s.id
                  ? "border-primary bg-background font-bold text-primary shadow-xs ring-1 ring-primary/20"
                  : "border-border bg-background/50 font-medium text-muted-foreground hover:bg-background hover:text-foreground"
              }`}
            >
              <span className="text-xs">{s.label}</span>
              <span className="text-[10px] text-muted-foreground">{s.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Orientation (only relevant if not "fit") */}
      {pageSize !== "fit" && (
        <div className="space-y-1.5 animate-in fade-in duration-150">
          <label className="text-xs font-semibold text-foreground">
            Orientation
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: "auto", label: "Auto" },
                { id: "portrait", label: "Portrait" },
                { id: "landscape", label: "Landscape" },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setOrientation(o.id)}
                disabled={isProcessing}
                className={`rounded-xl border py-2 px-2 text-xs transition-all ${
                  orientation === o.id
                    ? "border-primary bg-background font-bold text-primary shadow-xs ring-1 ring-primary/20"
                    : "border-border bg-background/50 font-medium text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Image Fitting */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Image Fitting
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFit("contain")}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-3 text-xs transition-all ${
              fit === "contain"
                ? "border-primary bg-background font-bold text-primary shadow-xs ring-1 ring-primary/20"
                : "border-border bg-background/50 font-medium text-muted-foreground hover:bg-background hover:text-foreground"
            }`}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>Contain (No crop)</span>
          </button>

          <button
            type="button"
            onClick={() => setFit("cover")}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 px-3 text-xs transition-all ${
              fit === "cover"
                ? "border-primary bg-background font-bold text-primary shadow-xs ring-1 ring-primary/20"
                : "border-border bg-background/50 font-medium text-muted-foreground hover:bg-background hover:text-foreground"
            }`}
          >
            <Crop className="h-3.5 w-3.5" />
            <span>Cover (Fill page)</span>
          </button>
        </div>
      </div>

      {/* 4. Margins */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Page Margin
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "none", label: "No Margin" },
              { id: "small", label: "Small (18pt)" },
              { id: "custom", label: "Custom" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMargin(m.id)}
              disabled={isProcessing}
              className={`rounded-xl border py-2 px-2 text-xs transition-all ${
                margin === m.id
                  ? "border-primary bg-background font-bold text-primary shadow-xs ring-1 ring-primary/20"
                  : "border-border bg-background/50 font-medium text-muted-foreground hover:bg-background hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {margin === "custom" && (
          <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
            <span className="text-xs text-muted-foreground">Margin size:</span>
            <input
              type="number"
              min={0}
              max={150}
              value={customMarginPt}
              onChange={(e) => setCustomMarginPt(Number(e.target.value) || 0)}
              disabled={isProcessing}
              className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
            <span className="text-xs text-muted-foreground">pt</span>
          </div>
        )}
      </div>

      {/* Output Filename Field */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs font-semibold text-foreground">
          Output Filename
        </label>
        <input
          type="text"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          disabled={isProcessing || files.length === 0}
          placeholder="images-document.pdf"
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
      </div>

      <div className="my-1 border-t border-border" />

      {/* Summary Box */}
      <div className="space-y-2 rounded-xl bg-muted/50 p-3.5 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Images selected</span>
          <span className="font-semibold text-foreground">{validFiles.length}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Total image size</span>
          <span className="font-semibold text-foreground">
            {validFiles.length > 0 ? totalFormattedSize : "0 B"}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Page format</span>
          <span className="font-semibold text-foreground uppercase">
            {pageSize === "fit" ? "Fit to Image" : `${pageSize} (${orientation})`}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Processing engine</span>
          <span className="font-semibold text-primary">In-Browser (pdf-lib)</span>
        </div>
      </div>

      {/* Primary Action Button */}
      {status !== "success" && (
        <ProcessingButton
          label={`Convert ${validFiles.length > 0 ? `${validFiles.length} Images to PDF` : "to PDF"}`}
          loadingLabel="Creating PDF..."
          isProcessing={isProcessing}
          progress={progress}
          disabled={!canConvert}
          onClick={handleConvert}
        />
      )}

      {/* Reassuring note */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span>Lossless vector and image embedding</span>
      </div>
    </ToolSidebar>
  );

  return (
    <ToolPageLayout
      tool={imageToPdfMetadata}
      workspaceContent={workspaceContent}
      sidebarContent={sidebarContent}
    />
  );
}
