"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  RotateCw,
  RotateCcw,
  RefreshCw,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  FileText,
  Trash2,
  ShieldCheck,
  Check,
  AlertTriangle,
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
  rotatePdfFile,
  resolveTargetPages,
  type RotationAngle,
  type RotationTarget,
} from "@/src/components/tools/processors/pdf/rotate-pdf";
import { validateAndInspectPdf } from "@/src/components/tools/processors/pdf/merge-pdf";
import { formatBytes } from "@/src/components/tools/processors/other/other-utils";

const rotatePdfMetadata: ToolMetadata = {
  id: "pdf-rotate",
  name: "Rotate PDF",
  description:
    "Permanently rotate all pages, odd/even pages, or specific custom ranges in your PDF document while preserving original quality.",
  category: "PDF",
  categoryHref: "/tools?category=PDF",
  icon: RotateCw,
  badge: "Popular",
  accept: ".pdf,application/pdf",
  maxFiles: 1,
  maxFileSizeMB: 50,
  instructions: [
    {
      step: 1,
      title: "Upload your PDF file",
      description:
        "Drag and drop your document or browse to select it from your device.",
    },
    {
      step: 2,
      title: "Choose rotation angle & pages",
      description:
        "Select rotation direction (90° CW, 180°, or 90° CCW) and target all pages, odd/even, or a custom selection (e.g. 1, 3, 5-8).",
    },
    {
      step: 3,
      title: "Rotate & download",
      description:
        "Click Rotate PDF. Once generated client-side via pdf-lib, instantly download your re-oriented document.",
    },
  ],
  features: [
    {
      title: "Preserves Existing Rotation",
      description:
        "Angles are added to each page's current orientation metadata so mixed portrait and landscape files stay balanced.",
      icon: Layers,
    },
    {
      title: "100% In-Browser Privacy",
      description:
        "All page rotation runs client-side inside your local browser memory via pdf-lib. No documents are uploaded to cloud servers.",
      icon: ShieldCheck,
    },
    {
      title: "Visual Page Grid Preview",
      description:
        "Inspect each page before rotating with live visual orientation markers and target page selection indicators.",
      icon: Sparkles,
    },
  ],
  faqs: [
    {
      question: "Does rotating affect the visual clarity of my text or images?",
      answer:
        "No. Rotating a PDF updates its standard viewing rotation matrix in the document dictionary without re-encoding fonts, vector paths, or embedded raster images. It is completely lossless.",
    },
    {
      question: "How does the tool handle documents with mixed landscape and portrait pages?",
      answer:
        "iUseDaily preserves existing rotation metadata by adding your selected angle (e.g. +90°) to each page's current angle, rather than forcefully overriding all pages to a fixed zero-degree base.",
    },
    {
      question: "Can I rotate only specific pages in a large PDF?",
      answer:
        "Yes! Choose 'Selected Pages' and enter single page numbers or ranges (e.g. 1, 3, 5-8), or simply click any page card in the interactive page grid to toggle its selection.",
    },
    {
      question: "Is there a limit on how many pages I can rotate?",
      answer:
        "You can rotate documents up to 50 MB in size with hundreds of pages without issue, all handled smoothly in your browser sandbox.",
    },
  ],
  privacyNote:
    "iUseDaily processes PDF rotations entirely within your browser memory. Your documents never touch external servers or third-party APIs.",
};

export default function RotatePdfPage() {
  const [file, setFile] = useState<ToolFile | null>(null);
  const [angle, setAngle] = useState<RotationAngle>(90);
  const [target, setTarget] = useState<RotationTarget>("all");
  const [customPages, setCustomPages] = useState<string>("1");
  const [outputBaseName, setOutputBaseName] = useState<string>("rotated-document");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [previewFile, setPreviewFile] = useState<ToolFile | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  // Active object URL lifecycle management
  const activeUrlRef = useRef<string | null>(null);

  const revokeActiveUrl = () => {
    if (activeUrlRef.current) {
      try {
        URL.revokeObjectURL(activeUrlRef.current);
      } catch {
        // Ignore revocation errors
      }
      activeUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      revokeActiveUrl();
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

      // Default custom selection
      const maxP = validation.pageCount;
      setCustomPages(maxP > 1 ? "1, 2" : "1");

      const defaultName = selectedFile.name.replace(/\.pdf$/i, "");
      setOutputBaseName(`${defaultName}-rotated`);
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
    revokeActiveUrl();
    setFile(null);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setResult(null);
    setErrorMessage(null);
  };

  // Reset tool
  const handleReset = () => {
    revokeActiveUrl();
    setFile(null);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setResult(null);
    setErrorMessage(null);
  };

  // Target page resolution and validation
  const totalPages = file?.pageCount || 0;
  const isFileValid = file && file.status === "ready" && totalPages > 0;

  const resolved = isFileValid
    ? resolveTargetPages(target, customPages, totalPages)
    : { valid: false, pages: [], error: undefined };

  const targetedPageSet = new Set(resolved.pages);
  const isProcessing = status === "processing";
  const canRotate = isFileValid && resolved.valid && !isProcessing && !isReadingFile;

  // Toggle page in custom mode when clicking page preview card
  const handleTogglePage = (pageNumber: number) => {
    if (isProcessing) return;
    setTarget("custom");

    const currentPages = new Set(resolved.pages);
    if (currentPages.has(pageNumber)) {
      currentPages.delete(pageNumber);
    } else {
      currentPages.add(pageNumber);
    }

    const sortedArray = Array.from(currentPages).sort((a, b) => a - b);
    setCustomPages(sortedArray.join(", "));
  };

  // Execute PDF Rotation
  const handleRotate = async () => {
    if (!file || !canRotate) return;

    revokeActiveUrl();
    setStatus("processing");
    setProgress(15);
    setStatusMessage(`Applying ${angle}° rotation to ${resolved.pages.length} pages...`);
    setErrorMessage(null);

    try {
      const rotateResult = await rotatePdfFile(file.file, {
        angle,
        target,
        customPages,
        outputFilename: outputBaseName,
        onProgress: (percent, stepMessage) => {
          setProgress(percent);
          setStatusMessage(stepMessage);
        },
      });

      activeUrlRef.current = rotateResult.downloadUrl || null;
      setResult(rotateResult);
      setStatus("success");
      setProgress(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to rotate PDF document.";
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
          title="PDF Rotated Successfully!"
          subtitle={`Applied ${angle}° rotation to ${resolved.pages.length} of ${totalPages} pages while preserving full document contents.`}
          downloadLabel="Download Rotated PDF"
          resetLabel="Rotate another PDF"
        />
      ) : !file ? (
        <FileUpload
          accept={rotatePdfMetadata.accept}
          multiple={false}
          maxSizeMB={rotatePdfMetadata.maxFileSizeMB}
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
          {/* Active File Card */}
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

          {/* Controls: Angle & Target */}
          <div className="space-y-5 rounded-2xl border border-border/80 bg-muted/20 p-5">
            {/* 1. Angle Selection */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Rotation Angle
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAngle(90)}
                  disabled={isProcessing}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                    angle === 90
                      ? "border-primary bg-card text-primary shadow-xs ring-2 ring-primary/10 font-bold"
                      : "border-border bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <RotateCw className="h-4 w-4" />
                  <span className="text-xs">90° Clockwise</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAngle(180)}
                  disabled={isProcessing}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                    angle === 180
                      ? "border-primary bg-card text-primary shadow-xs ring-2 ring-primary/10 font-bold"
                      : "border-border bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-xs">180° Flip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAngle(270)}
                  disabled={isProcessing}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                    angle === 270
                      ? "border-primary bg-card text-primary shadow-xs ring-2 ring-primary/10 font-bold"
                      : "border-border bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-xs">90° Counter-CW</span>
                </button>
              </div>
            </div>

            {/* 2. Target Selection */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Pages to Rotate
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    { id: "all", label: "All Pages" },
                    { id: "odd", label: "Odd Pages" },
                    { id: "even", label: "Even Pages" },
                    { id: "custom", label: "Custom Range" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTarget(t.id)}
                    disabled={isProcessing}
                    className={`rounded-xl border py-2.5 px-3 text-xs transition-all ${
                      target === t.id
                        ? "border-primary bg-card font-bold text-primary shadow-xs ring-1 ring-primary/15"
                        : "border-border bg-card/60 font-medium text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Custom Input if selected */}
            {target === "custom" && (
              <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Custom Page Numbers</span>
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
            {!resolved.valid && resolved.error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{resolved.error}</span>
              </div>
            )}

            {/* 4. Interactive Page Grid Preview */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Page Preview & Target Status
                </span>
                <span className="text-muted-foreground">
                  {targetedPageSet.size} of {totalPages} pages selected
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-card p-3 shadow-xs">
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 lg:grid-cols-8">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isTargeted = targetedPageSet.has(pageNum);
                    const previewRotation = isTargeted ? (angle === 270 ? -90 : angle) : 0;

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handleTogglePage(pageNum)}
                        disabled={isProcessing}
                        title={`Page ${pageNum} - Click to toggle in custom mode`}
                        className={`group relative flex flex-col items-center justify-between rounded-xl border p-2 text-center transition-all ${
                          isTargeted
                            ? "border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary/20"
                            : "border-border bg-muted/30 text-muted-foreground opacity-60 hover:opacity-100"
                        }`}
                      >
                        {/* Mini Page Icon with live CSS rotation */}
                        <div
                          className="flex h-8 w-6 items-center justify-center rounded-sm border border-current transition-transform duration-300"
                          style={{
                            transform: `rotate(${previewRotation}deg)`,
                          }}
                        >
                          <span className="text-[9px] font-bold">P{pageNum}</span>
                        </div>

                        <div className="mt-1 flex items-center gap-0.5 text-[10px] font-medium">
                          {isTargeted ? (
                            <span className="flex items-center gap-0.5 text-primary font-bold">
                              <Check className="h-2.5 w-2.5" />
                              +{angle}°
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0°</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground px-0.5">
                Tip: Click any page thumbnail above to toggle its individual selection.
              </p>
            </div>
          </div>

          {/* Processing Error Alert */}
          {errorMessage && (
            <ToolError
              message={errorMessage}
              onRetry={handleRotate}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* Real In-Progress Status Bar */}
          {isProcessing && (
            <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4 animate-spin text-primary" />
                  {statusMessage || "Rotating PDF document..."}
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
    <ToolSidebar title="Rotation Options">
      {/* Output Filename Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Output Filename
        </label>
        <div className="relative">
          <input
            type="text"
            value={outputBaseName}
            onChange={(e) => setOutputBaseName(e.target.value)}
            disabled={isProcessing || !file}
            placeholder="rotated-document"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>
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
          <span>Rotation angle</span>
          <span className="font-semibold text-foreground">
            {angle === 90 ? "+90° Clockwise" : angle === 180 ? "180° Flip" : "-90° Counter-CW"}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Pages affected</span>
          <span className="font-semibold text-primary">
            {targetedPageSet.size} of {totalPages} pages
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
          label={`Rotate ${targetedPageSet.size > 0 ? `${targetedPageSet.size} Pages` : "PDF"}`}
          loadingLabel="Rotating PDF..."
          isProcessing={isProcessing}
          progress={progress}
          disabled={!canRotate}
          onClick={handleRotate}
        />
      )}

      {/* Reassuring note */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span>Lossless metadata orientation update</span>
      </div>
    </ToolSidebar>
  );

  return (
    <ToolPageLayout
      tool={rotatePdfMetadata}
      workspaceContent={workspaceContent}
      sidebarContent={sidebarContent}
    />
  );
}
