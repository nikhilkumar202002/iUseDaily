"use client";

import React, { useState } from "react";
import {
  FileText,
  Files,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import {
  ToolPageLayout,
  FileUpload,
  FileList,
  ToolSidebar,
  ProcessingButton,
  ResultPanel,
  type ToolMetadata,
  type UploadedFile,
  type ProcessingStatus,
  type ProcessingResult,
} from "@/app/components/tool-detail";

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
        "Reorder your files in the sequence you want them to appear in the final merged document using the move controls.",
    },
    {
      step: 3,
      title: "Merge & download",
      description:
        "Click Merge PDF. Once processing completes in your browser, instantly download your unified PDF document.",
    },
  ],
  features: [
    {
      title: "Client-Side Processing",
      description:
        "Your documents are processed securely in your browser. No files are uploaded to any external servers.",
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
        "No. Privacy is a core priority at iUseDaily. All merging is performed locally in your browser environment, meaning your sensitive documents never leave your device.",
    },
    {
      question: "Can I rearrange the order of documents before merging?",
      answer:
        "Yes! Use the up and down arrow buttons next to each file in the file list to set the exact order you need.",
    },
    {
      question: "Will the formatting or links inside my PDFs change?",
      answer:
        "No. The merge process preserves all embedded fonts, bookmarks, images, links, and vector illustrations exactly as they exist in your source files.",
    },
  ],
  privacyNote:
    "iUseDaily processes all PDF operations entirely in your browser sandbox. Your confidential documents never touch a third-party server.",
};

export default function MergePdfPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [outputName, setOutputName] = useState("merged_document.pdf");
  const [includeOutline, setIncludeOutline] = useState(true);

  // File upload handler - converts File[] to UploadedFile[]
  const handleFilesSelected = (newFiles: File[]) => {
    const formatted: UploadedFile[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      formattedSize:
        file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    }));

    setFiles((prev) => [...prev, ...formatted]);
    setStatus("idle");
    setResult(null);
  };

  // Reorder file position
  const handleMoveFile = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= files.length || toIndex >= files.length) {
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

  // Total size calculation
  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);
  const totalFormattedSize =
    totalSizeBytes < 1024 * 1024
      ? `${(totalSizeBytes / 1024).toFixed(1)} KB`
      : `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`;

  // Simulate merging process
  const handleMerge = () => {
    if (files.length < 2) return;

    setStatus("processing");
    setProgress(20);

    const timer1 = setTimeout(() => setProgress(55), 400);
    const timer2 = setTimeout(() => setProgress(88), 900);
    const timer3 = setTimeout(() => {
      setProgress(100);

      // Generate downloadable PDF mock blob
      const mockPdfContent = `%PDF-1.4\n% Merged by iUseDaily\n% Total files: ${files.length}\n${files.map((f, i) => `% [${i + 1}] ${f.name} (${f.formattedSize})`).join("\n")}\n%%EOF`;
      const blob = new Blob([mockPdfContent], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        fileName: outputName.endsWith(".pdf") ? outputName : `${outputName}.pdf`,
        fileSize: totalSizeBytes,
        formattedSize: totalFormattedSize,
        downloadUrl,
        itemCount: files.length,
      });

      setStatus("success");
    }, 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  // Reset to initial state
  const handleReset = () => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setResult(null);
  };

  const isProcessing = status === "processing";
  const canMerge = files.length >= 2 && !isProcessing;

  // Workspace Main Content
  const workspaceContent = (
    <div className="flex h-full flex-1 flex-col space-y-6">
      {status === "success" && result ? (
        <ResultPanel
          result={result}
          onReset={handleReset}
          resetButtonLabel="Merge another PDF"
        />
      ) : (
        <>
          {/* File Upload Zone */}
          <FileUpload
            accept={mergePdfMetadata.accept}
            maxSizeMB={mergePdfMetadata.maxFileSizeMB}
            onFilesSelected={handleFilesSelected}
            disabled={isProcessing}
            title="Drop your PDF files here"
            description="or click to browse from your device (up to 20 files, 50MB each)"
          />

          {/* Uploaded File List */}
          {files.length > 0 && (
            <FileList
              files={files}
              onMoveFile={handleMoveFile}
              onRemoveFile={handleRemoveFile}
              disabled={isProcessing}
            />
          )}

          {/* Validation Notice when fewer than 2 files */}
          {files.length === 1 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-600 dark:text-amber-400">
              <FileText className="h-4 w-4 shrink-0" />
              <span>Please upload at least one more PDF file to merge them together.</span>
            </div>
          )}

          {/* In-progress bar */}
          {isProcessing && (
            <div className="space-y-2 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-primary">
                  <FileCheck className="h-4 w-4 animate-pulse" />
                  Merging {files.length} PDF files...
                </span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Configuration Sidebar
  const sidebarContent = (
    <ToolSidebar title="Merge Options">
      {/* Output Filename */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Output Filename
        </label>
        <input
          type="text"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          disabled={isProcessing}
          placeholder="merged_document.pdf"
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
      </div>

      {/* Bookmarks & Outlines option */}
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

      {/* Summary Box */}
      <div className="space-y-2 rounded-xl bg-muted/50 p-3.5 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Files selected</span>
          <span className="font-semibold text-foreground">{files.length}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Total file size</span>
          <span className="font-semibold text-foreground">
            {files.length > 0 ? totalFormattedSize : "0 KB"}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Estimated time</span>
          <span className="font-semibold text-foreground">
            {files.length > 0 ? "< 2 seconds" : "—"}
          </span>
        </div>
      </div>

      {/* Merge Action Button */}
      {status !== "success" && (
        <ProcessingButton
          label={`Merge ${files.length > 0 ? `${files.length} Files` : "PDFs"}`}
          loadingLabel="Merging PDFs..."
          isLoading={isProcessing}
          disabled={!canMerge}
          onClick={handleMerge}
        />
      )}

      {/* Reassuring note */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span>You can reorder files before merging</span>
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
