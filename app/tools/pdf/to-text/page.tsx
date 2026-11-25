"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileOutput,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  FileText,
  Trash2,
  ShieldCheck,
  Copy,
  Check,
  Download,
  RotateCcw,
  AlertTriangle,
  Info,
  Type,
  FileCode,
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
  extractTextFromPdf,
  type PdfToTextResult,
} from "@/src/components/tools/processors/pdf/pdf-to-text";
import { validateAndInspectPdf } from "@/src/components/tools/processors/pdf/merge-pdf";
import { parsePageSelection } from "@/src/components/tools/processors/pdf/split-pdf";
import { formatBytes, triggerDownload } from "@/src/components/tools/processors/other/other-utils";

const pdfToTextMetadata: ToolMetadata = {
  id: "pdf-to-text",
  name: "PDF to Text",
  description:
    "Extract clean, readable text from your PDF files with word counts, paragraph reconstruction, and instant TXT download.",
  category: "PDF",
  categoryHref: "/tools?category=PDF",
  icon: FileOutput,
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
      title: "Choose page range",
      description:
        "Select to extract text from all pages or specify custom pages (e.g. 1, 3, 5-8).",
    },
    {
      step: 3,
      title: "Copy or download text",
      description:
        "Click Extract Text. Read, edit, or copy the extracted text directly, or download it as a .txt file.",
    },
  ],
  features: [
    {
      title: "Intelligent Spacing & Paragraphs",
      description:
        "Reconstructs natural line breaks, paragraph separations, and inter-word spacing from raw PDF font glyphs.",
      icon: Type,
    },
    {
      title: "100% In-Browser Privacy",
      description:
        "Text extraction executes locally inside your browser memory using pdfjs-dist. No files are uploaded to cloud servers.",
      icon: ShieldCheck,
    },
    {
      title: "Real-Time Word & Char Metrics",
      description:
        "Inspect exact word counts, character counts, and page-by-page breakdowns with one-click clipboard copying.",
      icon: Sparkles,
    },
  ],
  faqs: [
    {
      question: "Can this tool extract text from scanned paper documents?",
      answer:
        "This tool extracts readable digital text layers embedded in PDF files. If a PDF consists of scanned photos or flat image bitmaps without an embedded text layer, Optical Character Recognition (OCR) is required to transcribe the images.",
    },
    {
      question: "Are line breaks and paragraphs preserved?",
      answer:
        "Yes! Our extraction algorithm analyzes the vertical and horizontal coordinates of every text glyph to reconstruct natural lines, headings, and paragraph margins.",
    },
    {
      question: "Is there a limit on how long the text can be?",
      answer:
        "You can extract text from documents with hundreds of pages up to 50 MB in size without difficulty, processed page-by-page in your browser.",
    },
    {
      question: "Can I copy individual sections instead of the whole file?",
      answer:
        "Yes! The extracted text area is an interactive, fully selectable text editor where you can highlight and copy any specific paragraph or sentence.",
    },
  ],
  privacyNote:
    "iUseDaily extracts text entirely within your local browser memory. No document contents are ever transmitted to external servers.",
};

export default function PdfToTextPage() {
  const [file, setFile] = useState<ToolFile | null>(null);
  const [pageMode, setPageMode] = useState<"all" | "custom">("all");
  const [customPages, setCustomPages] = useState<string>("1");
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [outputBaseName, setOutputBaseName] = useState<string>("extracted-text");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PdfToTextResult | null>(null);
  const [editableText, setEditableText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<ToolFile | null>(null);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);

  // Active download URL ref
  const downloadUrlRef = useRef<string | null>(null);

  const revokeDownloadUrl = () => {
    if (downloadUrlRef.current) {
      try {
        URL.revokeObjectURL(downloadUrlRef.current);
      } catch {
        // Ignore revocation error
      }
      downloadUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      revokeDownloadUrl();
    };
  }, []);

  // Handle PDF selection and pre-flight validation
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
      setOutputBaseName(`${defaultName}-text`);
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
    revokeDownloadUrl();
    setFile(null);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setResult(null);
    setEditableText("");
    setErrorMessage(null);
  };

  // Reset tool
  const handleReset = () => {
    revokeDownloadUrl();
    setFile(null);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setResult(null);
    setEditableText("");
    setErrorMessage(null);
  };

  // Copy text to clipboard
  const handleCopyAll = () => {
    if (!editableText) return;
    navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download text file
  const handleDownloadTxt = () => {
    if (!editableText) return;
    const blob = new Blob([editableText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${outputBaseName || "extracted-text"}.txt`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Validation
  const totalPages = file?.pageCount || 0;
  const isFileValid = file && file.status === "ready" && totalPages > 0;

  let pageValidationError: string | null = null;
  let estimatedPageCount = 0;

  if (isFileValid) {
    if (pageMode === "all") {
      estimatedPageCount = totalPages;
    } else {
      const parsed = parsePageSelection(customPages, totalPages);
      if (!parsed.valid) {
        pageValidationError = parsed.error || "Invalid page selection";
      } else {
        estimatedPageCount = parsed.pages.length;
      }
    }
  }

  const isProcessing = status === "processing";
  const canExtract = isFileValid && !pageValidationError && !isProcessing && !isReadingFile;

  // Execute Text Extraction
  const handleExtract = async () => {
    if (!file || !canExtract) return;

    revokeDownloadUrl();
    setStatus("processing");
    setProgress(5);
    setStatusMessage("Initializing text extraction engine...");
    setErrorMessage(null);

    try {
      const extractResult = await extractTextFromPdf(file.file, {
        pageMode,
        customPages,
        outputFilename: outputBaseName,
        includePageHeaders: includeHeaders,
        onProgress: (percent, stepMessage) => {
          setProgress(percent);
          setStatusMessage(stepMessage);
        },
      });

      downloadUrlRef.current = extractResult.downloadUrl;
      setResult(extractResult);
      setEditableText(extractResult.fullText);
      setStatus("success");
      setProgress(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to extract text from PDF.";
      setErrorMessage(msg);
      setStatus("error");
      setProgress(undefined);
    }
  };

  // Word & character counts on editable area
  const currentWordCount = editableText.trim() === "" ? 0 : editableText.trim().split(/\s+/).length;
  const currentCharCount = editableText.length;

  // Workspace Main Content (Left Card)
  const workspaceContent = (
    <div className="flex h-full flex-1 flex-col space-y-6">
      {status === "success" && result ? (
        <div className="flex flex-1 flex-col justify-between space-y-5 animate-in fade-in duration-200">
          {/* Top Results Metrics & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-blue px-3 py-1 font-bold text-primary">
                <Type className="h-3.5 w-3.5" />
                {currentWordCount.toLocaleString()} Words
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1 font-semibold text-muted-foreground">
                <FileCode className="h-3.5 w-3.5" />
                {currentCharCount.toLocaleString()} Characters
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1 font-semibold text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                {result.extractedPagesCount} {result.extractedPagesCount === 1 ? "page" : "pages"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-95 shadow-xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied!" : "Copy All"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition-all hover:opacity-95 active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .TXT</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Extract another PDF"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* OCR Limitation Warning if pages with 0 text detected */}
          {result.scannedPagesCount > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-bold">
                  {result.scannedPagesCount} {result.scannedPagesCount === 1 ? "page contains" : "pages contain"} no readable digital text
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-400/90">
                  These pages appear to be scanned images or raster graphics. Optical Character Recognition (OCR) is required to transcribe text from scanned photos.
                </p>
              </div>
            </div>
          )}

          {/* Extracted Text Area (Interactive Editor / Reader) */}
          <div className="relative flex-1">
            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              aria-label="Extracted text editor"
              placeholder="Extracted text will appear here..."
              rows={16}
              className="w-full resize-y rounded-2xl border border-border bg-card p-5 font-mono text-xs leading-relaxed text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
            />
          </div>
        </div>
      ) : !file ? (
        <FileUpload
          accept={pdfToTextMetadata.accept}
          multiple={false}
          maxSizeMB={pdfToTextMetadata.maxFileSizeMB}
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

          {/* Extraction Settings Area */}
          <div className="space-y-4 rounded-2xl border border-border/80 bg-muted/20 p-5">
            <div>
              <label className="text-xs font-semibold text-foreground">
                Page Selection
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

            {/* Include Page Headers Toggle */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 text-xs font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  disabled={isProcessing}
                  className="h-4 w-4 rounded border-border text-primary accent-primary"
                />
                <span>Include page separator headers (e.g. &quot;--- Page 1 ---&quot;)</span>
              </label>
            </div>

            {/* Validation Feedback */}
            {pageValidationError && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{pageValidationError}</span>
              </div>
            )}
          </div>

          {/* Processing Error Message */}
          {errorMessage && (
            <ToolError
              message={errorMessage}
              onRetry={handleExtract}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* Real In-Progress Status Bar */}
          {isProcessing && (
            <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4 animate-spin text-primary" />
                  {statusMessage || "Extracting text from PDF..."}
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
    <ToolSidebar title="Extraction Options">
      {/* Output Filename Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Output Filename (.txt)
        </label>
        <div className="relative">
          <input
            type="text"
            value={outputBaseName}
            onChange={(e) => setOutputBaseName(e.target.value)}
            disabled={isProcessing || !file}
            placeholder="extracted-text"
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
            <span>Document pages</span>
            <span className="font-semibold text-foreground">{file.pageCount} pages</span>
          </div>
        )}
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Target pages</span>
          <span className="font-semibold text-foreground">
            {estimatedPageCount > 0 ? `${estimatedPageCount} of ${totalPages}` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Export format</span>
          <span className="font-semibold text-foreground">Plain Text (.TXT)</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Processing engine</span>
          <span className="font-semibold text-primary">In-Browser (pdfjs-dist)</span>
        </div>
      </div>

      {/* Primary Action Button */}
      {status !== "success" ? (
        <ProcessingButton
          label={`Extract Text ${estimatedPageCount > 0 ? `(${estimatedPageCount} Pages)` : ""}`}
          loadingLabel="Extracting Text..."
          isProcessing={isProcessing}
          progress={progress}
          disabled={!canExtract}
          onClick={handleExtract}
        />
      ) : (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-95 active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span>Download .TXT</span>
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied to Clipboard!" : "Copy Full Text"}</span>
          </button>
        </div>
      )}

      {/* Reassuring note */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span>100% private in-browser text decoding</span>
      </div>
    </ToolSidebar>
  );

  return (
    <ToolPageLayout
      tool={pdfToTextMetadata}
      workspaceContent={workspaceContent}
      sidebarContent={sidebarContent}
    />
  );
}
