"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileMinus,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  FileText,
  Trash2,
  ShieldCheck,
  Zap,
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
  compressPdfFile,
  COMPRESSION_PROFILES,
  type CompressionLevel,
} from "@/src/components/tools/processors/pdf/compress-pdf";
import { validateAndInspectPdf } from "@/src/components/tools/processors/pdf/merge-pdf";
import { formatBytes } from "@/src/components/tools/processors/other/other-utils";

const compressPdfMetadata: ToolMetadata = {
  id: "pdf-compress",
  name: "Compress PDF",
  description:
    "Reduce PDF file size and optimize document structure while maintaining maximum visual quality and formatting.",
  category: "PDF",
  categoryHref: "/tools?category=PDF",
  icon: FileMinus,
  badge: "Popular",
  accept: ".pdf,application/pdf",
  maxFiles: 1,
  maxFileSizeMB: 50,
  instructions: [
    {
      step: 1,
      title: "Upload your PDF file",
      description:
        "Drag and drop your document or select it directly from your device.",
    },
    {
      step: 2,
      title: "Choose optimization mode",
      description:
        "Select between Basic (stream compression), Balanced (stream + metadata purge), or Maximum structural compaction.",
    },
    {
      step: 3,
      title: "Optimize & download",
      description:
        "Click Compress PDF to run the in-browser optimization engine. Inspect the exact bytes saved and download your streamlined PDF.",
    },
  ],
  features: [
    {
      title: "Transparent & Honest",
      description:
        "No fake percentages or artificial delays. We compute exact byte differences and inform you if a document is already compressed.",
      icon: Sparkles,
    },
    {
      title: "100% Client-Side Privacy",
      description:
        "Your document never leaves your browser. All structural compaction and stream bundling run locally via WebAssembly and pdf-lib.",
      icon: ShieldCheck,
    },
    {
      title: "3 Optimization Profiles",
      description:
        "Choose between safe structural packing, metadata pruning, or aggressive dictionary deduplication tailored to your workflow.",
      icon: Zap,
    },
  ],
  faqs: [
    {
      question: "Why does compression reduction vary between PDFs?",
      answer:
        "PDF file sizes depend entirely on their internal structure. Documents created with multiple revisions, redundant metadata, and uncompressed cross-reference streams can shrink substantially. Conversely, documents that already consist of pre-compressed JPEGs or flat single-stream scans have less structural overhead to reduce.",
    },
    {
      question: "Does this tool downsample high-resolution images?",
      answer:
        "In our browser-only implementation, we prioritize visual fidelity and security by optimizing PDF syntax, cross-reference tables, and object streams without lossy raster downsampling. Your photos and graphics maintain 100% of their original visual sharpness.",
    },
    {
      question: "What happens if a PDF cannot be made smaller?",
      answer:
        "If your document was already produced by a modern, highly optimized PDF export pipeline, further structural compaction may yield no reduction (or a trivial few bytes difference). Our tool honestly displays this comparison rather than misrepresenting results.",
    },
    {
      question: "Are my documents secure during compression?",
      answer:
        "Yes, completely. The optimization engine runs entirely within your device's browser memory. No data is transmitted to external servers or third-party APIs.",
    },
  ],
  privacyNote:
    "iUseDaily optimizes PDF files entirely inside your local browser sandbox. No file data is ever uploaded or stored externally.",
};

export default function CompressPdfPage() {
  const [file, setFile] = useState<ToolFile | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>("balanced");
  const [outputBaseName, setOutputBaseName] = useState<string>("compressed-document");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [previewFile, setPreviewFile] = useState<ToolFile | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  // Download URL lifecycle tracking
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

      const defaultName = selectedFile.name.replace(/\.pdf$/i, "");
      setOutputBaseName(`${defaultName}-compressed`);
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

  const isFileValid = file && file.status === "ready";
  const isProcessing = status === "processing";
  const canCompress = isFileValid && !isProcessing && !isReadingFile;

  // Execute PDF Optimization
  const handleCompress = async () => {
    if (!file || !canCompress) return;

    revokeActiveUrl();
    setStatus("processing");
    setProgress(15);
    setStatusMessage("Analyzing document object streams...");
    setErrorMessage(null);

    try {
      const compressResult = await compressPdfFile(file.file, {
        level: compressionLevel,
        outputFilename: outputBaseName,
        onProgress: (percent, stepMessage) => {
          setProgress(percent);
          setStatusMessage(stepMessage);
        },
      });

      activeUrlRef.current = compressResult.downloadUrl || null;
      setResult(compressResult);
      setStatus("success");
      setProgress(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to compress PDF document.";
      setErrorMessage(msg);
      setStatus("error");
      setProgress(undefined);
    }
  };

  // Selected profile details
  const currentProfile = COMPRESSION_PROFILES.find((p) => p.id === compressionLevel)!;

  // Workspace Main Content (Left Card)
  const workspaceContent = (
    <div className="flex h-full flex-1 flex-col space-y-6">
      {status === "success" && result ? (
        <ResultPanel
          result={result}
          onReset={handleReset}
          title={result.isSmaller ? "PDF Optimized Successfully!" : "Optimization Finished"}
          subtitle={
            result.isSmaller
              ? `Reduced by ${result.reductionPercentage}% (${formatBytes(result.savedBytes || 0)} saved) while preserving full document structure.`
              : "This document is already highly compacted. The optimized structure is virtually identical in size."
          }
          downloadLabel="Download Optimized PDF"
          resetLabel="Compress another PDF"
        />
      ) : !file ? (
        <FileUpload
          accept={compressPdfMetadata.accept}
          multiple={false}
          maxSizeMB={compressPdfMetadata.maxFileSizeMB}
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
                        {file.pageCount} {file.pageCount === 1 ? "page" : "pages"}
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

          {/* Mode Selector & Explanation Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Select Optimization Level
              </label>
              <span className="text-[11px] text-muted-foreground">
                100% in-browser processing
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {COMPRESSION_PROFILES.map((profile) => {
                const isSelected = compressionLevel === profile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setCompressionLevel(profile.id)}
                    disabled={isProcessing}
                    className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-card shadow-sm ring-2 ring-primary/10"
                        : "border-border bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {profile.name}
                        </span>
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        {profile.tagline}
                      </p>
                    </div>

                    <div className="mt-3 border-t border-border/60 pt-2 text-[10px] font-semibold text-primary">
                      {profile.expectedReduction}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Profile Detailed Features Box */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Sliders className="h-3.5 w-3.5 text-primary" />
                <span>{currentProfile.name} Overview</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {currentProfile.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {currentProfile.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {currentProfile.limitationNotice && (
                <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-500/10 p-2.5 text-[11px] text-amber-700 dark:text-amber-400">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{currentProfile.limitationNotice}</span>
                </div>
              )}
            </div>

            {/* Realistic Transparency Notice */}
            <div className="flex items-start gap-2 text-[11px] text-muted-foreground px-1">
              <Info className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
              <span>
                Actual compression varies by document. Files with uncompressed streams or multiple revisions shrink significantly, while scanned photo PDFs retain original image clarity.
              </span>
            </div>
          </div>

          {/* Processing Error Alert */}
          {errorMessage && (
            <ToolError
              message={errorMessage}
              onRetry={handleCompress}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* Real In-Progress Status Bar */}
          {isProcessing && (
            <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4 animate-spin text-primary" />
                  {statusMessage || "Optimizing PDF structure..."}
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
    <ToolSidebar title="Compression Options">
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
            placeholder="compressed-document"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>
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
        {file && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Original file size</span>
            <span className="font-semibold text-foreground">{file.formattedSize}</span>
          </div>
        )}
        {file && file.pageCount && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Page count</span>
            <span className="font-semibold text-foreground">{file.pageCount} pages</span>
          </div>
        )}
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Target profile</span>
          <span className="font-semibold text-foreground">{currentProfile.name}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Processing engine</span>
          <span className="font-semibold text-primary">In-Browser (pdf-lib)</span>
        </div>
      </div>

      {/* Primary Action Button */}
      {status !== "success" && (
        <ProcessingButton
          label="Compress PDF"
          loadingLabel="Optimizing PDF..."
          isProcessing={isProcessing}
          progress={progress}
          disabled={!canCompress}
          onClick={handleCompress}
        />
      )}

      {/* Reassuring note */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span>Lossless structural optimization</span>
      </div>
    </ToolSidebar>
  );

  return (
    <ToolPageLayout
      tool={compressPdfMetadata}
      workspaceContent={workspaceContent}
      sidebarContent={sidebarContent}
    />
  );
}
