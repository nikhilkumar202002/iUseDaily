"use client";

import React, { useState } from "react";
import {
  FileText,
  Files,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
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
  getPdfPageCount,
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
  accept: ".pdf",
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
  const [outputName, setOutputName] = useState("merged_document.pdf");
  const [includeOutline, setIncludeOutline] = useState(true);
  const [previewFile, setPreviewFile] = useState<ToolFile | null>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);

  // File upload handler - converts File[] to ToolFile[] and extracts real page counts with pdf-lib
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
    setResult(null);

    // Asynchronously resolve page counts using real pdf-lib
    const updatedFiles = await Promise.all(
      initialFormatted.map(async (toolFile) => {
        try {
          const pageCount = await getPdfPageCount(toolFile.file);
          return {
            ...toolFile,
            pageCount,
            status: "ready" as const,
          };
        } catch {
          return {
            ...toolFile,
            pageCount: 1,
            status: "ready" as const,
          };
        }
      })
    );

    setFiles((prev) =>
      prev.map((f) => {
        const found = updatedFiles.find((u) => u.id === f.id);
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
    setFiles([]);
    setStatus("idle");
    setProgress(undefined);
    setResult(null);
    setErrorMessage(null);
  };

  // Calculations
  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);
  const totalFormattedSize = formatBytes(totalSizeBytes);
  const totalPages = files.reduce((acc, f) => acc + (f.pageCount || 0), 0);

  // Real PDF merge execution using pdf-lib processor
  const handleMerge = async () => {
    if (files.length < 2) return;

    setStatus("processing");
    setProgress(5);
    setStatusMessage("Preparing PDF files...");
    setErrorMessage(null);

    try {
      const nativeFiles = files.map((f) => f.file);
      const mergeResult = await mergePdfFiles(nativeFiles, {
        outputFilename: outputName,
        includeBookmarks: includeOutline,
        onProgress: (percent, stepMessage) => {
          setProgress(percent);
          setStatusMessage(stepMessage);
        },
      });

      setResult(mergeResult);
      setStatus("success");
      setProgress(100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to merge PDF files.";
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setResult(null);
    setErrorMessage(null);
  };

  const isProcessing = status === "processing";
  const canMerge = files.length >= 2 && !isProcessing && !isReadingFiles;

  // Workspace Main Content (Left Card)
  const workspaceContent = (
    <div className="flex h-full flex-1 flex-col space-y-6">
      {status === "success" && result ? (
        <ResultPanel
          result={result}
          onReset={handleReset}
          title="PDFs merged successfully!"
          subtitle={`Your ${result.itemCount || files.length} PDF files have been combined into a unified document.`}
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
            acceptedTypesLabel="PDF files up to 50 MB"
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
              title={`${files.length} ${files.length === 1 ? "PDF file" : "PDF files"} ready`}
            />
          )}

          {/* Notice when only 1 file is uploaded */}
          {files.length === 1 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-600 dark:text-amber-400">
              <FileText className="h-4 w-4 shrink-0" />
              <span>Please upload at least one more PDF file to combine them.</span>
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

          {/* Real In-Progress Status Bar */}
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
      {/* Output Filename Field */}
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
            placeholder="merged_document.pdf"
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
          <span>Files selected</span>
          <span className="font-semibold text-foreground">{files.length}</span>
        </div>
        {totalPages > 0 && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Total pages</span>
            <span className="font-semibold text-foreground">{totalPages} pages</span>
          </div>
        )}
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Total file size</span>
          <span className="font-semibold text-foreground">
            {files.length > 0 ? totalFormattedSize : "0 B"}
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
          label={`Merge ${files.length > 0 ? `${files.length} PDF Files` : "PDFs"}`}
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
        <span>Reorder files anytime using drag handles</span>
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
