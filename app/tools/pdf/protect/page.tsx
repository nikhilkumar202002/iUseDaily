"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileLock,
  Layers,
  Sliders,
  CheckCircle2,
  FileText,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Printer,
  Copy,
  FileEdit,
  MessageSquare,
  AlertTriangle,
  Info,
  Key,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
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
  protectPdfFile,
  calculatePasswordStrength,
} from "@/src/components/tools/processors/pdf/protect-pdf";
import { validateAndInspectPdf } from "@/src/components/tools/processors/pdf/merge-pdf";
import { formatBytes } from "@/src/components/tools/processors/other/other-utils";

const protectPdfMetadata: ToolMetadata = {
  id: "pdf-protect",
  name: "Protect PDF",
  description:
    "Secure your PDF document with military-grade 256-bit AES encryption and custom document permission controls.",
  category: "PDF",
  categoryHref: "/tools?category=PDF",
  icon: FileLock,
  badge: "Popular",
  accept: ".pdf,application/pdf",
  maxFiles: 1,
  maxFileSizeMB: 50,
  instructions: [
    {
      step: 1,
      title: "Upload your PDF document",
      description:
        "Select your PDF from your device or drag and drop it directly into the workspace.",
    },
    {
      step: 2,
      title: "Set password & permissions",
      description:
        "Enter a secure open password and configure permissions for printing, editing, and content copying.",
    },
    {
      step: 3,
      title: "Encrypt and download",
      description:
        "Click Protect PDF to apply real AES-256 standard encryption offline in your browser, then download your password-protected file.",
    },
  ],
  features: [
    {
      title: "Standard AES-256 Encryption",
      description:
        "Implements ISO 32000-2 standard PDF security handlers recognized and enforced by Adobe Acrobat, Apple Preview, and modern web browsers.",
      icon: ShieldCheck,
    },
    {
      title: "Granular Document Permissions",
      description:
        "Restrict document editing, text and image copying, or printing while keeping the document readable with the authorized open password.",
      icon: Sliders,
    },
    {
      title: "100% Client-Side Privacy",
      description:
        "Your passwords and documents never touch external servers. Encryption runs entirely inside your browser memory using the Web Crypto API.",
      icon: Lock,
    },
  ],
  faqs: [
    {
      question: "Which encryption algorithm is applied to my PDF?",
      answer:
        "We apply standard 256-bit AES (Advanced Encryption Standard, Revision 6 / Version 5 handler) as specified in ISO 32000-2. It provides enterprise-grade cryptographic security.",
    },
    {
      question: "Will protected PDFs prompt for passwords in Adobe Acrobat and Preview?",
      answer:
        "Yes! The encrypted PDF uses the standard PDF security handler dictionary (/Encrypt). When opened in Adobe Acrobat, Apple Preview, Google Chrome, Mozilla Firefox, or any compliant PDF reader, a standard password prompt will appear.",
    },
    {
      question: "Can iUseDaily recover or reset my password if I forget it?",
      answer:
        "No. Because all encryption executes 100% locally on your device without transmitting documents or passwords to our servers, we have zero access to your password or data. Please ensure you store your password in a safe password manager.",
    },
    {
      question: "What is the difference between an Open Password and an Owner Password?",
      answer:
        "The Open (User) Password is required for anyone to view the PDF. An Owner (Permissions) Password allows an administrator to modify printing, copying, and editing restrictions without changing the view password.",
    },
  ],
  privacyNote:
    "iUseDaily protects your documents entirely in local browser memory. No files, passwords, or cryptographic keys are ever transmitted over the network.",
};

export default function ProtectPdfPage() {
  const [file, setFile] = useState<ToolFile | null>(null);
  const [outputBaseName, setOutputBaseName] = useState<string>("protected-document");

  // Passwords
  const [userPassword, setUserPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showUserPassword, setShowUserPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Advanced Owner Password
  const [showAdvancedOwner, setShowAdvancedOwner] = useState<boolean>(false);
  const [ownerPassword, setOwnerPassword] = useState<string>("");
  const [showOwnerPassword, setShowOwnerPassword] = useState<boolean>(false);

  // Permissions
  const [allowPrinting, setAllowPrinting] = useState<boolean>(true);
  const [allowCopying, setAllowCopying] = useState<boolean>(false);
  const [allowModifying, setAllowModifying] = useState<boolean>(false);
  const [allowAnnotating, setAllowAnnotating] = useState<boolean>(true);

  // Processing & UI states
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [previewFile, setPreviewFile] = useState<ToolFile | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  // Object URL lifecycle tracking
  const activeUrlRef = useRef<string | null>(null);

  const revokeActiveUrl = () => {
    if (activeUrlRef.current) {
      try {
        URL.revokeObjectURL(activeUrlRef.current);
      } catch {
        // Ignore cleanup errors
      }
      activeUrlRef.current = null;
    }
  };

  // Securely clear passwords on unmount
  useEffect(() => {
    return () => {
      revokeActiveUrl();
      setUserPassword("");
      setConfirmPassword("");
      setOwnerPassword("");
    };
  }, []);

  // Pre-flight file validation
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

    // Validate using pdf-lib inspection
    const validation = await validateAndInspectPdf(selectedFile);

    if (validation.isValid) {
      setFile({
        ...initialFile,
        pageCount: validation.pageCount,
        status: "ready",
      });

      const defaultName = selectedFile.name.replace(/\.pdf$/i, "");
      setOutputBaseName(`${defaultName}-protected`);
    } else {
      const err = validation.error || "Corrupted or encrypted PDF";
      setFile({
        ...initialFile,
        pageCount: 0,
        status: "error",
        error: err,
      });
      setErrorMessage(
        err.toLowerCase().includes("encrypt") || err.toLowerCase().includes("password")
          ? "This document is already password-protected. Please select an unencrypted PDF."
          : err
      );
    }

    setIsReadingFile(false);
  };

  // Remove active file
  const handleRemoveFile = () => {
    revokeActiveUrl();
    setFile(null);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setResult(null);
    setErrorMessage(null);
  };

  // Full reset (clears passwords and results)
  const handleReset = () => {
    revokeActiveUrl();
    setFile(null);
    setUserPassword("");
    setConfirmPassword("");
    setOwnerPassword("");
    setShowAdvancedOwner(false);
    setStatus("idle");
    setProgress(undefined);
    setStatusMessage("");
    setResult(null);
    setErrorMessage(null);
  };

  // Validation metrics
  const passwordStrength = calculatePasswordStrength(userPassword);
  const passwordsMatch =
    userPassword.length > 0 &&
    confirmPassword.length > 0 &&
    userPassword === confirmPassword;
  const passwordMismatch =
    confirmPassword.length > 0 && userPassword !== confirmPassword;
  const isFileValid = file && file.status === "ready";
  const isProcessing = status === "processing";
  const canProtect =
    isFileValid &&
    !isProcessing &&
    !isReadingFile &&
    userPassword.length >= 1 &&
    passwordsMatch;

  // Execute standard encryption
  const handleProtectPdf = async () => {
    if (!file || !canProtect) return;

    if (userPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter the password.");
      return;
    }

    revokeActiveUrl();
    setStatus("processing");
    setProgress(15);
    setStatusMessage("Preparing document for encryption...");
    setErrorMessage(null);

    try {
      const protectResult = await protectPdfFile(file.file, {
        userPassword,
        ownerPassword: showAdvancedOwner && ownerPassword ? ownerPassword : userPassword,
        algorithm: "AES-256",
        allowPrinting,
        allowModifying,
        allowCopying,
        allowAnnotating,
        allowFillingForms: true,
        outputFilename: outputBaseName,
        onProgress: (percent, stepMessage) => {
          setProgress(percent);
          setStatusMessage(stepMessage);
        },
      });

      activeUrlRef.current = protectResult.downloadUrl || null;
      setResult(protectResult);
      setStatus("success");
      setProgress(100);

      // Security practice: wipe in-memory form passwords after successful encryption
      setUserPassword("");
      setConfirmPassword("");
      setOwnerPassword("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to encrypt and protect PDF document.";
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
          title="Document Protected Successfully!"
          subtitle="Your PDF is now encrypted with standard 256-bit AES encryption. Opening this document will require your password."
          downloadLabel="Download Protected PDF"
          resetLabel="Protect another PDF"
        />
      ) : !file ? (
        <FileUpload
          accept={protectPdfMetadata.accept}
          multiple={false}
          maxSizeMB={protectPdfMetadata.maxFileSizeMB}
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

          {/* Password Protection Card */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Set Document Password
                </h4>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                AES-256
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* User / Open Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Open Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showUserPassword ? "text" : "password"}
                    value={userPassword}
                    onChange={(e) => {
                      setUserPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    disabled={isProcessing}
                    placeholder="Enter open password"
                    className="h-10 w-full rounded-xl border border-border bg-background pl-3.5 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showUserPassword ? "Hide password" : "Show password"}
                  >
                    {showUserPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {userPassword.length > 0 && (
                  <div className="space-y-1 pt-1 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Strength:</span>
                      <span
                        className={`font-semibold ${
                          passwordStrength.score >= 3
                            ? "text-emerald-600 dark:text-emerald-400"
                            : passwordStrength.score === 2
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-500"
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.colorClass}`}
                        style={{ width: passwordStrength.barWidth }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Confirm Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    disabled={isProcessing}
                    placeholder="Repeat password"
                    className={`h-10 w-full rounded-xl border bg-background pl-3.5 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 disabled:opacity-50 ${
                      passwordMismatch
                        ? "border-destructive focus:border-destructive focus:ring-destructive"
                        : passwordsMatch
                        ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500"
                        : "border-border focus:border-primary focus:ring-primary"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Match indicator */}
                <div className="min-h-[18px] pt-1 text-[11px]">
                  {passwordsMatch && (
                    <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Passwords match
                    </span>
                  )}
                  {passwordMismatch && (
                    <span className="flex items-center gap-1 font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3" /> Passwords do not match
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Owner / Master Password Accordion */}
            <div className="border-t border-border/80 pt-3">
              <button
                type="button"
                onClick={() => setShowAdvancedOwner(!showAdvancedOwner)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Optional: Set separate Owner / Permissions Password</span>
                {showAdvancedOwner ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              {showAdvancedOwner && (
                <div className="mt-3 space-y-2 rounded-xl bg-muted/30 p-3 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
                    <Info className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                    <span>
                      An Owner password allows administrators to change document permissions later without altering the Open password required by users.
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showOwnerPassword ? "text" : "password"}
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      disabled={isProcessing}
                      placeholder="Optional Master / Owner password"
                      className="h-9 w-full rounded-lg border border-border bg-background pl-3 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                      tabIndex={-1}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showOwnerPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Granular Permissions Section */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Document Permissions
                </h4>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Enforced by PDF standard
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Configure what authorized readers can do once the document is opened with the password:
            </p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-1">
              {/* Allow Printing */}
              <label className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/20 p-3 cursor-pointer transition-colors hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={allowPrinting}
                  onChange={(e) => setAllowPrinting(e.target.checked)}
                  disabled={isProcessing}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Printer className="h-3.5 w-3.5 text-primary" />
                    <span>Allow Printing</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Permit printing this document to physical paper or PDF.
                  </p>
                </div>
              </label>

              {/* Allow Copying */}
              <label className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/20 p-3 cursor-pointer transition-colors hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={allowCopying}
                  onChange={(e) => setAllowCopying(e.target.checked)}
                  disabled={isProcessing}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Copy className="h-3.5 w-3.5 text-primary" />
                    <span>Allow Copying</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Allow selecting and copying text or image content.
                  </p>
                </div>
              </label>

              {/* Allow Modifying */}
              <label className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/20 p-3 cursor-pointer transition-colors hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={allowModifying}
                  onChange={(e) => setAllowModifying(e.target.checked)}
                  disabled={isProcessing}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <FileEdit className="h-3.5 w-3.5 text-primary" />
                    <span>Allow Modifying</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Permit page extraction, insertion, or content editing.
                  </p>
                </div>
              </label>

              {/* Allow Annotations */}
              <label className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/20 p-3 cursor-pointer transition-colors hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={allowAnnotating}
                  onChange={(e) => setAllowAnnotating(e.target.checked)}
                  disabled={isProcessing}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <span>Allow Annotations</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Permit adding comments, notes, and filling form fields.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Privacy & Password Retention Notice */}
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-800 dark:text-amber-300">
                Important: Retain your password securely
              </span>
              <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                Encryption runs entirely offline inside your browser using the Web Crypto API. iUseDaily never transmits, stores, or logs passwords. Lost passwords cannot be recovered by our team.
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <ToolError
              message={errorMessage}
              onRetry={handleProtectPdf}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* Processing Progress Bar */}
          {isProcessing && (
            <div className="space-y-2.5 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-4 w-4 animate-spin text-primary" />
                  {statusMessage || "Applying AES-256 standard encryption..."}
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
    <ToolSidebar title="Protection Settings">
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
            placeholder="protected-document"
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
        {file && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Original file size</span>
            <span className="font-semibold text-foreground">{file.formattedSize}</span>
          </div>
        )}
        {file && file.pageCount && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Page count</span>
            <span className="font-semibold text-foreground">
              {file.pageCount} {file.pageCount === 1 ? "page" : "pages"}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Encryption cipher</span>
          <span className="font-semibold text-foreground">AES-256 (ISO 32000-2)</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Password status</span>
          <span
            className={`font-semibold ${
              passwordsMatch
                ? "text-emerald-600 dark:text-emerald-400"
                : userPassword.length > 0
                ? "text-amber-500"
                : "text-muted-foreground"
            }`}
          >
            {passwordsMatch
              ? "Verified & Ready"
              : userPassword.length > 0
              ? "Needs confirmation"
              : "Not entered"}
          </span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Processing mode</span>
          <span className="font-semibold text-primary">100% In-Browser</span>
        </div>
      </div>

      {/* Primary Action Button */}
      {status !== "success" && (
        <div className="pt-2">
          <ProcessingButton
            label="Protect PDF"
            loadingLabel="Encrypting PDF..."
            isProcessing={isProcessing}
            progress={progress}
            disabled={!canProtect}
            onClick={handleProtectPdf}
            icon={FileLock}
          />
          {!file ? (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Select a PDF document to begin
            </p>
          ) : !userPassword ? (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Enter an open password above
            </p>
          ) : passwordMismatch ? (
            <p className="mt-2 text-center text-[11px] text-destructive">
              Passwords do not match
            </p>
          ) : (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Ready to encrypt with AES-256
            </p>
          )}
        </div>
      )}
    </ToolSidebar>
  );

  return (
    <ToolPageLayout
      tool={protectPdfMetadata}
      workspaceContent={workspaceContent}
      sidebarContent={sidebarContent}
    />
  );
}
