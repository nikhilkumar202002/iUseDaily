"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Files,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
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
  mergePdfFiles,
  validateAndInspectPdf,
} from "@/src/components/tools/processors/pdf/merge-pdf";
import { formatBytes } from "@/src/components/tools/processors/other/other-utils";

const mergePdfMetadata: ToolMetadata = {
  id: "merge-pdf",
  name: "Merge PDF",
  description:
    "Combine multiple PDF files into one clean, organized document quickly and securely.",
  category: "PDF",
  categoryHref: "/tools?category=PDF",
  icon: Files,
  badge: "Popular",
  accept: ".pdf,application/pdf",
  maxFiles: 20,
  maxFileSizeMB: 50,
  instructions: [
    {
      step: 1,
      title: "Upload your PDF files",
      description:
        "Select and upload two or more PDF files from your device or simply drag and drop them into the workspace.",
    },
    {
      step: 2,
      title: "Arrange page order",
      description:
        "Reorder your files in the sequence you want them to appear in the final merged document using the drag handle or move controls.",
    },
    {
      step: 3,
      title: "Merge & download",
      description:
        "Click Merge PDF. Once client-side processing completes in your browser, instantly download your unified PDF document.",
    },
  ],
  features: [
    {
      title: "Client-Side Processing",
      description:
        "Your documents are processed securely in your browser using pdf-lib. No files are uploaded to any external servers.",
      icon: CheckCircle2,
    },
    {
      title: "Flexible Reordering",
      description:
        "Easily change the order of files before combining to ensure your final document matches your exact workflow.",
      icon: Layers,
    },
    {
      title: "Preserves Quality",
      description:
        "Original formatting, vector graphics, form fields, and resolution are preserved without loss of clarity.",
      icon: Sparkles,
    },
  ],
  faqs: [
    {
      question: "How many PDF files can I combine at once?",
      answer:
        "You can merge up to 20 PDF files in a single batch, with each individual file up to 50 MB in size.",
    },
    {
      question: "Are my PDF documents stored on your servers?",
      answer:
        "No. Privacy is a core priority at iUseDaily. All merging is performed locally in your browser sandbox, meaning your sensitive documents never leave your device.",
    },
    {
      question: "Can I rearrange the order of documents before merging?",
      answer:
        "Yes! Use the drag handle or the up and down arrow buttons next to each file in the file list to set the exact order you need.",
    },
    {
      question: "Will the formatting or links inside my PDFs change?",
      answer:
        "No. The merge process preserves all embedded fonts, bookmarks, images, links, and vector illustrations exactly as they exist in your source files.",
    },
  ],
  privacyNote:
    "iUseDaily processes all PDF operations entirely in your browser sandbox via WebAssembly and pdf-lib. Your confidential documents never touch a third-party server.",
};

export default function MergePdfPage() {
  const [files, setFiles] = useState<ToolFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [outputName, setOutputName] = useState("merged-document.pdf");
  const [includeOutline, setIncludeOutline] = useState(true);
  const [previewFile, setPreviewFile] = useState<ToolFile | null>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);

  // Object URL lifecycle ref for clean revocation
  const downloadUrlRef = useRef<string | null>(null);

  // Revoke object URLs on component unmount
  useEffect(() => {
    return () => {
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current);
        downloadUrlRef.current = null;
      }
    };
  }, []);

  // File upload handler - validates files, checks encryption & extracts real page counts
  const handleFilesSelected = async (newFiles: File[]) => {
    setIsReadingFiles(true);
    setErrorMessage(null);

    const initialFormatted: ToolFile[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      formattedSize: formatBytes(file.size),
      extension: "pdf",
      type: file.type || "application/pdf",
      status: "reading",
    }));

    setFiles((prev) => [...prev, ...initialFormatted]);
    setStatus("idle");

    // Asynchronously validate each PDF using pdf-lib
    const validatedFiles = await Promise.all(
      initialFormatted.map(async (toolFile) => {
        const validation = await validateAndInspectPdf(toolFile.file);
        if (validation.isValid) {
          return {
            ...toolFile,
            pageCount: validation.pageCount,
            status: "ready" as const,
          };
        } else {
          return {
            ...toolFile,
            pageCount: 0,
            status: "error" as const,
            error: validation.error || "Invalid PDF file",
          };
        }
      })
    );

    setFiles((prev) =>
      prev.map((f) => {
        const found = validatedFiles.find((v) => v.id === f.id);
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

  // Clear all files and revoke previous result URL
  const handleClearAll = () => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
    setFiles([]);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setResult(null);
    setErrorMessage(null);
  };

  // Calculations for valid files only
  const validFiles = files.filter((f) => f.status === "ready");
  const hasErrorFiles = files.some((f) => f.status === "error");
  const totalSizeBytes = validFiles.reduce((acc, f) => acc + f.size, 0);
  const totalFormattedSize = formatBytes(totalSizeBytes);
  const totalPages = validFiles.reduce((acc, f) => acc + (f.pageCount || 0), 0);

  // Real PDF merge execution in the browser via pdf-lib
  const handleMerge = async () => {
    if (validFiles.length < 2 || hasErrorFiles) return;

    // Revoke previous URL if exists
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }

    setStatus("processing");
    setProgress(5);
    setStatusMessage("Initializing merged document container...");
    setErrorMessage(null);

    try {
      const nativeFiles = validFiles.map((f) => f.file);
      const mergeResult = await mergePdfFiles(nativeFiles, {
        outputFilename: outputName || "merged-document.pdf",
        includeBookmarks: includeOutline,
        onProgress: (percent, stepMessage) => {
          setProgress(percent);
          setStatusMessage(stepMessage);
        },
      });

      downloadUrlRef.current = mergeResult.downloadUrl || null;
      setResult(mergeResult);
      setStatus("success");
      setProgress(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to merge PDF files.";
      setErrorMessage(msg);
      setStatus("error");
      setProgress(undefined);
    }
  };

  // Reset to initial state and revoke object URL
  const handleReset = () => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
    setFiles([]);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setResult(null);
    setErrorMessage(null);
  };

  const isProcessing = status === "processing";
  const canMerge = validFiles.length >= 2 && !hasErrorFiles && !isProcessing && !isReadingFiles;

  // Workspace Main Content (Left Card)
  const workspaceContent = (
    <div className="flex h-full flex-1 flex-col space-y-6">
      {status === "success" && result ? (
        <ResultPanel
          result={result}
          onReset={handleReset}
          title="PDFs merged successfully!"
          subtitle={`Your ${result.itemCount || validFiles.length} PDF files (${result.pageCount || totalPages} pages) have been combined into a unified document.`}
          downloadLabel="Download Merged PDF"
          resetLabel="Merge another PDF"
        />
      ) : (
        <>
          {/* File Upload Zone */}
          <FileUpload
            accept={mergePdfMetadata.accept}
            maxSizeMB={mergePdfMetadata.maxFileSizeMB}
            maxFiles={mergePdfMetadata.maxFiles}
            currentFileCount={files.length}
            onFilesSelected={handleFilesSelected}
            disabled={isProcessing}
            isReading={isReadingFiles}
            title="Drag and drop your files here"
            supportingText="or browse files from your device"
            acceptedTypesLabel="PDF files up to 50 MB each"
            className="flex-1"
          />

          {/* Uploaded File List */}
          {files.length > 0 && (
            <FileList
              files={files}
              onReorderFiles={handleReorderFiles}
              onRemoveFile={handleRemoveFile}
              onClearAll={handleClearAll}
              onPreviewFile={(file) => setPreviewFile(file)}
              disabled={isProcessing}
              title={`${files.length} ${files.length === 1 ? "PDF file" : "PDF files"} uploaded`}
            />
          )}

          {/* Warning when invalid/error files are detected */}
          {hasErrorFiles && (
            <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                One or more files have issues (corrupted or password-protected). Please remove them before merging.
              </span>
            </div>
          )}

          {/* Informational notice when only 1 valid file is uploaded */}
          {!hasErrorFiles && files.length === 1 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-600 dark:text-amber-400">
              <FileText className="h-4 w-4 shrink-0" />
              <span>Please upload at least one more PDF file to combine them together.</span>
            </div>
          )}

          {/* Processing Error Alert */}
          {errorMessage && (
            <ToolError
              message={errorMessage}
              onRetry={handleMerge}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* In-Progress Status Bar */}
          {isProcessing && (
            <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4 animate-spin text-primary" />
                  {statusMessage || "Merging PDF documents..."}
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
    <ToolSidebar title="Merge Options">
      {/* Output Filename Field (defaults to merged-document.pdf) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Output Filename
        </label>
        <div className="relative">
          <input
            type="text"
            value={outputName}
            onChange={(e) => setOutputName(e.target.value)}
            disabled={isProcessing}
            placeholder="merged-document.pdf"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>
      </div>

      {/* Bookmarks & Table of contents */}
      <div className="space-y-2 pt-1">
        <label className="flex items-center gap-2.5 text-xs font-medium text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={includeOutline}
            onChange={(e) => setIncludeOutline(e.target.checked)}
            disabled={isProcessing}
            className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary"
          />
          <span>Include bookmarks table of contents</span>
        </label>
      </div>

      <div className="my-1 border-t border-border" />

      {/* Summary Box with real calculated stats */}
      <div className="space-y-2 rounded-xl bg-muted/50 p-3.5 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Valid files</span>
          <span className="font-semibold text-foreground">
            {validFiles.length} of {files.length}
          </span>
        </div>
        {totalPages > 0 && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Total pages</span>
            <span className="font-semibold text-foreground">{totalPages} pages</span>
          </div>
        )}
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Total size</span>
          <span className="font-semibold text-foreground">
            {validFiles.length > 0 ? totalFormattedSize : "0 B"}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Processing engine</span>
          <span className="font-semibold text-primary">In-Browser (pdf-lib)</span>
        </div>
      </div>

      {/* Merge Action Button with real loading & progress */}
      {status !== "success" && (
        <ProcessingButton
          label={`Merge ${validFiles.length > 0 ? `${validFiles.length} PDF Files` : "PDFs"}`}
          loadingLabel="Merging PDFs..."
          isProcessing={isProcessing}
          progress={progress}
          disabled={!canMerge}
          onClick={handleMerge}
        />
      )}

      {/* Subtle hint */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span>Reorder files anytime before merging</span>
      </div>
    </ToolSidebar>
  );

  return (
    <ToolPageLayout
      tool={mergePdfMetadata}
      workspaceContent={workspaceContent}
      sidebarContent={sidebarContent}
    />
  );
}
