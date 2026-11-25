"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Scissors,
  Layers,
  Sliders,
  CheckCircle2,
  FileText,
  Trash2,
  AlertTriangle,
  FolderArchive,
  Grid,
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
  splitPdfFile,
  parsePageSelection,
  parsePageRanges,
  type SplitMode,
} from "@/src/components/tools/processors/pdf/split-pdf";
import { validateAndInspectPdf } from "@/src/components/tools/processors/pdf/merge-pdf";
import { formatBytes } from "@/src/components/tools/processors/other/other-utils";

const splitPdfMetadata: ToolMetadata = {
  id: "pdf-split",
  name: "Split PDF",
  description:
    "Separate individual pages, extract custom ranges, or divide your PDF document into multiple files quickly and securely.",
  category: "PDF",
  categoryHref: "/tools?category=PDF",
  icon: Scissors,
  badge: "Popular",
  accept: ".pdf,application/pdf",
  maxFiles: 1,
  maxFileSizeMB: 50,
  instructions: [
    {
      step: 1,
      title: "Upload your PDF file",
      description:
        "Drag and drop your PDF document or browse to select it from your device.",
    },
    {
      step: 2,
      title: "Choose splitting mode",
      description:
        "Select to extract specific pages (e.g. 1, 3, 5-8), split every page into separate documents, or split by custom ranges (e.g. 1-3, 4-6).",
    },
    {
      step: 3,
      title: "Split & download",
      description:
        "Click Split PDF. Once generated client-side, download your new PDF files individually or as a single bundled ZIP archive.",
    },
  ],
  features: [
    {
      title: "3 Versatile Split Modes",
      description:
        "Extract specific pages, break out every single page, or segment into custom chapter ranges with full control.",
      icon: Layers,
    },
    {
      title: "100% Client-Side Privacy",
      description:
        "Your documents are parsed and divided entirely in your local browser sandbox via pdf-lib. No files ever leave your machine.",
      icon: CheckCircle2,
    },
    {
      title: "Instant ZIP Bundling",
      description:
        "When generating multiple PDF files, download them all in one click inside a neatly organized ZIP archive.",
      icon: FolderArchive,
    },
  ],
  faqs: [
    {
      question: "How do I extract non-consecutive pages?",
      answer:
        "Choose 'Extract Pages' mode and type comma-separated numbers and ranges (for example: 1, 3, 5-8). The pages will be combined into a single new document in that exact sequence.",
    },
    {
      question: "How does 'Split Every Page' work?",
      answer:
        "This mode creates an individual single-page PDF for every page in your document. You can download each file separately or download all of them at once as a single ZIP archive.",
    },
    {
      question: "Are my uploaded PDFs stored or analyzed?",
      answer:
        "No. All splitting is handled locally inside your browser using WebAssembly and pdf-lib. Your documents are never uploaded to any cloud server or database.",
    },
    {
      question: "Can I split password-protected PDFs?",
      answer:
        "For security and privacy, you must unlock or remove password encryption from your document before uploading it for splitting.",
    },
  ],
  privacyNote:
    "iUseDaily processes all PDF splitting locally in your browser. Sensitive documents never touch external servers or cloud storage.",
};

export default function SplitPdfPage() {
  const [file, setFile] = useState<ToolFile | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("extract");
  const [pageSelection, setPageSelection] = useState<string>("1-2");
  const [pageRanges, setPageRanges] = useState<string>("1-2, 3-4");
  const [outputBaseName, setOutputBaseName] = useState<string>("split-document");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [previewFile, setPreviewFile] = useState<ToolFile | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  // Keep track of all generated object URLs to revoke cleanly
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

      // Default page selections adjusted to actual document length
      const maxP = validation.pageCount;
      if (maxP === 1) {
        setPageSelection("1");
        setPageRanges("1");
      } else if (maxP === 2) {
        setPageSelection("1-2");
        setPageRanges("1, 2");
      } else {
        const mid = Math.ceil(maxP / 2);
        setPageSelection(`1, ${mid}-${maxP}`);
        setPageRanges(`1-${mid}, ${mid + 1}-${maxP}`);
      }

      const defaultName = selectedFile.name.replace(/\.pdf$/i, "");
      setOutputBaseName(`${defaultName}-split`);
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

  // Reset all
  const handleReset = () => {
    revokeAllActiveUrls();
    setFile(null);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setResult(null);
    setErrorMessage(null);
  };

  // Mode validation status
  const totalPages = file?.pageCount || 0;
  const isFileValid = file && file.status === "ready" && totalPages > 0;

  let modeValidationError: string | null = null;
  let estimatedFilesCount = 0;

  if (isFileValid) {
    if (splitMode === "extract") {
      const parsed = parsePageSelection(pageSelection, totalPages);
      if (!parsed.valid) {
        modeValidationError = parsed.error || "Invalid page selection";
      } else {
        estimatedFilesCount = 1;
      }
    } else if (splitMode === "every") {
      estimatedFilesCount = totalPages;
    } else if (splitMode === "ranges") {
      const parsed = parsePageRanges(pageRanges, totalPages);
      if (!parsed.valid) {
        modeValidationError = parsed.error || "Invalid page ranges";
      } else {
        estimatedFilesCount = parsed.ranges.length;
      }
    }
  }

  const isProcessing = status === "processing";
  const canSplit =
    isFileValid &&
    !modeValidationError &&
    !isProcessing &&
    !isReadingFile;

  // Execute Split
  const handleSplit = async () => {
    if (!file || !canSplit) return;

    revokeAllActiveUrls();
    setStatus("processing");
    setProgress(10);
    setStatusMessage("Preparing document for splitting...");
    setErrorMessage(null);

    try {
      const splitResult = await splitPdfFile(file.file, {
        mode: splitMode,
        pageSelection,
        pageRanges,
        outputBaseName,
        onProgress: (percent, stepMessage) => {
          setProgress(percent);
          setStatusMessage(stepMessage);
        },
      });

      // Track all created download URLs for revocation
      if (splitResult.downloadUrl) {
        activeUrlsRef.current.push(splitResult.downloadUrl);
      }
      if (splitResult.zipUrl && splitResult.zipUrl !== splitResult.downloadUrl) {
        activeUrlsRef.current.push(splitResult.zipUrl);
      }
      if (splitResult.outputFiles) {
        splitResult.outputFiles.forEach((f) => {
          if (!activeUrlsRef.current.includes(f.downloadUrl)) {
            activeUrlsRef.current.push(f.downloadUrl);
          }
        });
      }

      setResult(splitResult);
      setStatus("success");
      setProgress(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to split PDF document.";
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
          title="PDF Split Successfully!"
          subtitle={
            result.outputFiles && result.outputFiles.length > 1
              ? `Generated ${result.outputFiles.length} separate PDF files from your original document.`
              : `Extracted ${result.pageCount || 1} pages into your new PDF document.`
          }
          downloadLabel={
            result.zipUrl
              ? "Download All as ZIP"
              : "Download Split PDF"
          }
          resetLabel="Split another PDF"
        />
      ) : !file ? (
        <FileUpload
          accept={splitPdfMetadata.accept}
          multiple={false}
          maxSizeMB={splitPdfMetadata.maxFileSizeMB}
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
              title="Remove file and choose another"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Configuration Workspace Area */}
          <div className="space-y-4 rounded-2xl border border-border/80 bg-muted/20 p-5">
            {/* Mode Selector Tabs */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Choose Split Method
              </label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setSplitMode("extract")}
                  disabled={isProcessing}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center transition-all ${
                    splitMode === "extract"
                      ? "border-primary bg-card text-primary shadow-xs ring-2 ring-primary/10 font-bold"
                      : "border-border bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <Scissors className="h-4 w-4" />
                  <span className="text-xs">Extract Pages</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitMode("every")}
                  disabled={isProcessing}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center transition-all ${
                    splitMode === "every"
                      ? "border-primary bg-card text-primary shadow-xs ring-2 ring-primary/10 font-bold"
                      : "border-border bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                  <span className="text-xs">Split Every Page</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitMode("ranges")}
                  disabled={isProcessing}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center transition-all ${
                    splitMode === "ranges"
                      ? "border-primary bg-card text-primary shadow-xs ring-2 ring-primary/10 font-bold"
                      : "border-border bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <FolderArchive className="h-4 w-4" />
                  <span className="text-xs">Page Ranges</span>
                </button>
              </div>
            </div>

            {/* Mode-Specific Input & Visual Guide */}
            {splitMode === "extract" && (
              <div className="space-y-2 pt-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Pages to Extract
                  </span>
                  <span className="text-muted-foreground">
                    Available: 1 to {totalPages}
                  </span>
                </div>
                <input
                  type="text"
                  value={pageSelection}
                  onChange={(e) => setPageSelection(e.target.value)}
                  disabled={isProcessing}
                  placeholder={`e.g. 1, 3, 5-${totalPages}`}
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-muted-foreground">
                  Enter single pages or ranges separated by commas. Extracted pages will be merged into one single document in this exact order.
                </p>
              </div>
            )}

            {splitMode === "every" && (
              <div className="space-y-2 pt-2 animate-in fade-in duration-150">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs">
                  <p className="font-semibold text-primary">
                    Every page will become its own PDF file
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    This will split your {totalPages}-page document into {totalPages} individual files (e.g. {outputBaseName}-page-1.pdf, {outputBaseName}-page-2.pdf). You can download them individually or as a single ZIP archive.
                  </p>
                </div>
              </div>
            )}

            {splitMode === "ranges" && (
              <div className="space-y-2 pt-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Page Ranges to Split
                  </span>
                  <span className="text-muted-foreground">
                    Available: 1 to {totalPages}
                  </span>
                </div>
                <input
                  type="text"
                  value={pageRanges}
                  onChange={(e) => setPageRanges(e.target.value)}
                  disabled={isProcessing}
                  placeholder="e.g. 1-3, 4-6, 7-10"
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-muted-foreground">
                  Each range will generate a separate PDF document containing the specified pages.
                </p>
              </div>
            )}

            {/* Live Input Validation Feedback */}
            {modeValidationError && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{modeValidationError}</span>
              </div>
            )}
          </div>

          {/* Processing Error Message */}
          {errorMessage && (
            <ToolError
              message={errorMessage}
              onRetry={handleSplit}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* In-Progress Status Bar */}
          {isProcessing && (
            <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4 animate-spin text-primary" />
                  {statusMessage || "Splitting PDF document..."}
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
    <ToolSidebar title="Split Options">
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
            placeholder="split-document"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          Suffixes like -extracted.pdf or -page-1.pdf will be added automatically.
        </p>
      </div>

      <div className="my-1 border-t border-border" />

      {/* Summary Box with real calculated statistics */}
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
          <span>Split mode</span>
          <span className="font-semibold text-foreground">
            {splitMode === "extract"
              ? "Extract Pages"
              : splitMode === "every"
              ? "Split Every Page"
              : "Page Ranges"}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Expected files</span>
          <span className="font-semibold text-primary">
            {estimatedFilesCount > 0
              ? `${estimatedFilesCount} ${estimatedFilesCount === 1 ? "file" : "files"}`
              : "—"}
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
          label={
            splitMode === "extract"
              ? "Extract Pages"
              : splitMode === "every"
              ? `Split ${totalPages > 0 ? `${totalPages} Pages` : "PDF"}`
              : "Split Ranges"
          }
          loadingLabel="Splitting PDF..."
          isProcessing={isProcessing}
          progress={progress}
          disabled={!canSplit}
          onClick={handleSplit}
        />
      )}

      {/* Reassuring note */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span>Output generated securely inside your browser</span>
      </div>
    </ToolSidebar>
  );

  return (
    <ToolPageLayout
      tool={splitPdfMetadata}
      workspaceContent={workspaceContent}
      sidebarContent={sidebarContent}
    />
  );
}
