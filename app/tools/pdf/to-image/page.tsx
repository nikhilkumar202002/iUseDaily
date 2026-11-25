"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileImage,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  FileText,
  Trash2,
  ShieldCheck,
  FolderArchive,
  AlertTriangle,
  Info,
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
  ResultPanel,
  ToolError,
  type ToolFile,
  type ProcessingStatus,
  type ProcessingResult,
} from "@/src/components/tools/shared";
import {
  convertPdfToImages,
  QUALITY_PROFILES,
  type ImageOutputFormat,
  type ImageQualityTier,
  type PageSelectionMode,
} from "@/src/components/tools/processors/pdf/pdf-to-image";
import { validateAndInspectPdf } from "@/src/components/tools/processors/pdf/merge-pdf";
import { parsePageSelection } from "@/src/components/tools/processors/pdf/split-pdf";
import { formatBytes } from "@/src/components/tools/processors/other/other-utils";

const pdfToImageMetadata: ToolMetadata = {
  id: "pdf-to-image",
  name: "PDF to Image",
  description:
    "Convert PDF document pages into high-resolution PNG or JPG image files with custom DPI and instant ZIP downloading.",
  category: "PDF",
  categoryHref: "/tools?category=PDF",
  icon: FileImage,
  badge: "Popular",
  accept: ".pdf,application/pdf",
  maxFiles: 1,
  maxFileSizeMB: 50,
  instructions: [
    {
      step: 1,
      title: "Upload your PDF file",
      description:
        "Select your PDF document from your device or drag and drop it into the workspace.",
    },
    {
      step: 2,
      title: "Choose format & quality",
      description:
        "Select PNG (lossless) or JPG, choose your preferred DPI quality level (up to 300 DPI), and select all or specific pages.",
    },
    {
      step: 3,
      title: "Convert & download",
      description:
        "Click Convert to Images to render pages via HTML5 Canvas. Download images individually or as a single ZIP archive.",
    },
  ],
  features: [
    {
      title: "High-DPI Canvas Rendering",
      description:
        "Renders vector fonts and graphics up to 300 DPI using pdfjs-dist for crisp presentation and print quality.",
      icon: Sparkles,
    },
    {
      title: "100% In-Browser Privacy",
      description:
        "Pages are drawn onto temporary browser canvases locally. No documents or images are ever uploaded to cloud servers.",
      icon: ShieldCheck,
    },
    {
      title: "Automatic ZIP Archive",
      description:
        "When converting multi-page PDFs, download all rendered pages in one click with a neatly structured ZIP archive.",
      icon: FolderArchive,
    },
  ],
  faqs: [
    {
      question: "Should I choose PNG or JPG format?",
      answer:
        "Choose PNG if your PDF contains text, diagrams, screenshots, or vectors where you want lossless sharpness and transparent backgrounds. Choose JPG for scanned photo documents, eBooks, and smaller file sizes.",
    },
    {
      question: "What resolution does each quality setting provide?",
      answer:
        "Standard provides 1.5x scale (~108 DPI, great for screen sharing). High provides 2.0x scale (~150 DPI, sharp for tablets and presentations). Maximum provides 3.0x scale (~300 DPI, print-ready razor-sharp fidelity).",
    },
    {
      question: "Can I convert only selected pages from my PDF?",
      answer:
        "Yes! Choose 'Custom Pages' and enter single page numbers or ranges (e.g. 1, 3, 5-8). Only those pages will be rendered and downloaded.",
    },
    {
      question: "Are my documents secure during conversion?",
      answer:
        "Yes, completely. The PDF rendering engine runs entirely within your device's browser memory via WebAssembly and HTML5 Canvas. Nothing is sent over the network.",
    },
  ],
  privacyNote:
    "iUseDaily converts PDF documents into images locally in your browser memory. No files are uploaded or stored externally.",
};

export default function PdfToImagePage() {
  const [file, setFile] = useState<ToolFile | null>(null);
  const [format, setFormat] = useState<ImageOutputFormat>("png");
  const [quality, setQuality] = useState<ImageQualityTier>("high");
  const [pageMode, setPageMode] = useState<PageSelectionMode>("all");
  const [customPages, setCustomPages] = useState<string>("1");
  const [outputBaseName, setOutputBaseName] = useState<string>("converted-images");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [previewFile, setPreviewFile] = useState<ToolFile | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  // Active object URL lifecycle tracking to avoid memory leaks
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

  // Handle file selection and pre-flight validation
  const handleFilesSelected = async (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    const selectedFile = newFiles[0];

    setIsReadingFile(true);
    setErrorMessage(null);

    const initialFile: ToolFile = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file: selectedFile,
      name: selectedFile.name,
      size: selectedFile.size,
      formattedSize: formatBytes(selectedFile.size),
      extension: "pdf",
      type: selectedFile.type || "application/pdf",
      status: "reading",
    };

    setFile(initialFile);
    setStatus("idle");
    setResult(null);

    // Validate using pdf-lib
    const validation = await validateAndInspectPdf(selectedFile);

    if (validation.isValid) {
      setFile({
        ...initialFile,
        pageCount: validation.pageCount,
        status: "ready",
      });

      const maxP = validation.pageCount;
      setCustomPages(maxP > 1 ? `1-${maxP}` : "1");

      const defaultName = selectedFile.name.replace(/\.pdf$/i, "");
      setOutputBaseName(`${defaultName}-images`);
    } else {
      setFile({
        ...initialFile,
        pageCount: 0,
        status: "error",
        error: validation.error || "Corrupted or encrypted PDF",
      });
      setErrorMessage(validation.error || "Corrupted or encrypted PDF");
    }

    setIsReadingFile(false);
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    revokeAllActiveUrls();
    setFile(null);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setResult(null);
    setErrorMessage(null);
  };

  // Reset tool
  const handleReset = () => {
    revokeAllActiveUrls();
    setFile(null);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setResult(null);
    setErrorMessage(null);
  };

  // Validation
  const totalPages = file?.pageCount || 0;
  const isFileValid = file && file.status === "ready" && totalPages > 0;

  let pageValidationError: string | null = null;
  let estimatedImageCount = 0;

  if (isFileValid) {
    if (pageMode === "all") {
      estimatedImageCount = totalPages;
    } else {
      const parsed = parsePageSelection(customPages, totalPages);
      if (!parsed.valid) {
        pageValidationError = parsed.error || "Invalid page selection";
      } else {
        estimatedImageCount = parsed.pages.length;
      }
    }
  }

  const isProcessing = status === "processing";
  const canConvert =
    isFileValid &&
    !pageValidationError &&
    !isProcessing &&
    !isReadingFile;

  // Execute PDF to Image conversion
  const handleConvert = async () => {
    if (!file || !canConvert) return;

    revokeAllActiveUrls();
    setStatus("processing");
    setProgress(5);
    setStatusMessage("Initializing canvas renderer...");
    setErrorMessage(null);

    try {
      const conversionResult = await convertPdfToImages(file.file, {
        format,
        quality,
        pageMode,
        customPages,
        outputBaseName,
        onProgress: (percent, stepMessage) => {
          setProgress(percent);
          setStatusMessage(stepMessage);
        },
      });

      // Track all created download URLs for revocation
      if (conversionResult.downloadUrl) {
        activeUrlsRef.current.push(conversionResult.downloadUrl);
      }
      if (conversionResult.zipUrl && conversionResult.zipUrl !== conversionResult.downloadUrl) {
        activeUrlsRef.current.push(conversionResult.zipUrl);
      }
      if (conversionResult.outputFiles) {
        conversionResult.outputFiles.forEach((f) => {
          if (!activeUrlsRef.current.includes(f.downloadUrl)) {
            activeUrlsRef.current.push(f.downloadUrl);
          }
        });
      }

      setResult(conversionResult);
      setStatus("success");
      setProgress(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to convert PDF pages to images.";
      setErrorMessage(msg);
      setStatus("error");
      setProgress(undefined);
    }
  };

  const selectedProfile = QUALITY_PROFILES[quality];

  // Workspace Main Content (Left Card)
  const workspaceContent = (
    <div className="flex h-full flex-1 flex-col space-y-6">
      {status === "success" && result ? (
        <ResultPanel
          result={result}
          onReset={handleReset}
          title="Conversion Completed!"
          subtitle={
            result.outputFiles && result.outputFiles.length > 1
              ? `Generated ${result.outputFiles.length} ${format.toUpperCase()} images (${selectedProfile.dpiLabel}) from your PDF.`
              : `Rendered 1 high-resolution ${format.toUpperCase()} image (${selectedProfile.dpiLabel}).`
          }
          downloadLabel={
            result.zipUrl
              ? `Download All as ZIP (${result.itemCount} Images)`
              : `Download ${format.toUpperCase()} Image`
          }
          resetLabel="Convert another PDF"
        />
      ) : !file ? (
        <FileUpload
          accept={pdfToImageMetadata.accept}
          multiple={false}
          maxSizeMB={pdfToImageMetadata.maxFileSizeMB}
          maxFiles={1}
          onFilesSelected={handleFilesSelected}
          disabled={isProcessing}
          isReading={isReadingFile}
          title="Drop your PDF file here"
          supportingText="or browse to select from your device"
          acceptedTypesLabel="Single PDF file up to 50 MB"
          className="flex-1"
        />
      ) : (
        <div className="flex flex-1 flex-col justify-between space-y-6">
          {/* Active Uploaded File Card */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-blue text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-sm font-bold text-foreground">
                    {file.name}
                  </h4>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    PDF
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{file.formattedSize}</span>
                  {file.pageCount !== undefined && file.pageCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-primary">
                        <Layers className="h-3 w-3" />
                        {file.pageCount} {file.pageCount === 1 ? "page" : "pages"} total
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={isProcessing}
              title="Remove file and select another"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Conversion Settings Controls */}
          <div className="space-y-5 rounded-2xl border border-border/80 bg-muted/20 p-5">
            {/* 1. Format Selector (PNG vs JPG) */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Output Format
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {format === "png" ? "Lossless (Sharp text)" : "Compressed (Photo format)"}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat("png")}
                  disabled={isProcessing}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                    format === "png"
                      ? "border-primary bg-card text-primary shadow-xs ring-2 ring-primary/10 font-bold"
                      : "border-border bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <span className="text-sm">PNG</span>
                  <span className="text-[10px] text-muted-foreground">Lossless & Crisp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat("jpg")}
                  disabled={isProcessing}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                    format === "jpg"
                      ? "border-primary bg-card text-primary shadow-xs ring-2 ring-primary/10 font-bold"
                      : "border-border bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <span className="text-sm">JPG</span>
                  <span className="text-[10px] text-muted-foreground">Compact & Balanced</span>
                </button>
              </div>
            </div>

            {/* 2. Image Quality & Rendering DPI */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Image Resolution / DPI
                </label>
                <span className="text-[11px] font-mono text-primary">
                  {selectedProfile.dpiLabel} ({selectedProfile.scale}x scale)
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2.5">
                {(Object.keys(QUALITY_PROFILES) as ImageQualityTier[]).map((tierKey) => {
                  const prof = QUALITY_PROFILES[tierKey];
                  const isSelected = quality === tierKey;
                  return (
                    <button
                      key={tierKey}
                      type="button"
                      onClick={() => setQuality(tierKey)}
                      disabled={isProcessing}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                        isSelected
                          ? "border-primary bg-card text-primary shadow-xs ring-2 ring-primary/10 font-bold"
                          : "border-border bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground"
                      }`}
                    >
                      <span className="text-xs">{prof.name}</span>
                      <span className="text-[10px] text-muted-foreground">{prof.dpiLabel}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {selectedProfile.description}
                {format === "png" && " (PNG renders losslessly with full vector fidelity)."}
              </p>
            </div>

            {/* 3. Page Selection Mode */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Pages to Convert
              </label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPageMode("all")}
                  disabled={isProcessing}
                  className={`rounded-xl border py-2.5 px-3 text-xs transition-all ${
                    pageMode === "all"
                      ? "border-primary bg-card font-bold text-primary shadow-xs ring-1 ring-primary/15"
                      : "border-border bg-card/60 font-medium text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  All Pages ({totalPages})
                </button>

                <button
                  type="button"
                  onClick={() => setPageMode("custom")}
                  disabled={isProcessing}
                  className={`rounded-xl border py-2.5 px-3 text-xs transition-all ${
                    pageMode === "custom"
                      ? "border-primary bg-card font-bold text-primary shadow-xs ring-1 ring-primary/15"
                      : "border-border bg-card/60 font-medium text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  Custom Page Range
                </button>
              </div>
            </div>

            {/* Custom Input if selected */}
            {pageMode === "custom" && (
              <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Page Numbers & Ranges</span>
                  <span className="text-muted-foreground">Range: 1 to {totalPages}</span>
                </div>
                <input
                  type="text"
                  value={customPages}
                  onChange={(e) => setCustomPages(e.target.value)}
                  disabled={isProcessing}
                  placeholder="e.g. 1, 3, 5-8"
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Validation Feedback */}
            {pageValidationError && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{pageValidationError}</span>
              </div>
            )}

            {/* Technical note */}
            <div className="flex items-start gap-2 text-[11px] text-muted-foreground pt-1">
              <Info className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
              <span>
                Each page is rendered individually using hardware-accelerated canvas contexts and immediately converted to a Blob to maintain optimal browser memory.
              </span>
            </div>
          </div>

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
                  {statusMessage || "Rendering PDF pages..."}
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

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );

  // Configuration Sidebar (Right Card)
  const sidebarContent = (
    <ToolSidebar title="Conversion Options">
      {/* Output Base Filename */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Output Base Name
        </label>
        <div className="relative">
          <input
            type="text"
            value={outputBaseName}
            onChange={(e) => setOutputBaseName(e.target.value)}
            disabled={isProcessing || !file}
            placeholder="converted-images"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          Suffixes like -page-1.{format} or .{format} will be added automatically.
        </p>
      </div>

      <div className="my-1 border-t border-border" />

      {/* Summary Box */}
      <div className="space-y-2 rounded-xl bg-muted/50 p-3.5 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Source document</span>
          <span className="font-semibold text-foreground">
            {file ? "1 PDF file" : "None"}
          </span>
        </div>
        {file && file.pageCount && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Total pages</span>
            <span className="font-semibold text-foreground">{file.pageCount} pages</span>
          </div>
        )}
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Target format</span>
          <span className="font-bold text-foreground uppercase">{format}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>DPI & Scale</span>
          <span className="font-semibold text-foreground">{selectedProfile.dpiLabel}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Output images</span>
          <span className="font-semibold text-primary">
            {estimatedImageCount > 0
              ? `${estimatedImageCount} ${estimatedImageCount === 1 ? "image" : "images"}`
              : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Processing engine</span>
          <span className="font-semibold text-primary">In-Browser (pdfjs-dist)</span>
        </div>
      </div>

      {/* Primary Action Button */}
      {status !== "success" && (
        <ProcessingButton
          label={`Convert to ${format.toUpperCase()}`}
          loadingLabel="Rendering Images..."
          isProcessing={isProcessing}
          progress={progress}
          disabled={!canConvert}
          onClick={handleConvert}
        />
      )}

      {/* Reassuring note */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span>Hardware-accelerated client-side rendering</span>
      </div>
    </ToolSidebar>
  );

  return (
    <ToolPageLayout
      tool={pdfToImageMetadata}
      workspaceContent={workspaceContent}
      sidebarContent={sidebarContent}
    />
  );
}
