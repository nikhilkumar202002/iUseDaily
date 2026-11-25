import { encryptPDF, type EncryptPDFOptions } from "@pdfsmaller/pdf-encrypt";
import type { ProcessingResult } from "../../shared/types";
import { formatBytes } from "../other/other-utils";
import { validateAndInspectPdf } from "./merge-pdf";

export interface PasswordStrength {
  score: number; // 0 to 4
  label: "Too short" | "Weak" | "Fair" | "Good" | "Strong";
  colorClass: string;
  barWidth: string;
}

/**
 * Real-time password strength calculation based on complexity and length.
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password || password.length === 0) {
    return {
      score: 0,
      label: "Too short",
      colorClass: "bg-muted-foreground/30",
      barWidth: "0%",
    };
  }

  if (password.length < 6) {
    return {
      score: 1,
      label: "Too short",
      colorClass: "bg-red-500",
      barWidth: "20%",
    };
  }

  let strengthPoints = 0;
  if (password.length >= 8) strengthPoints++;
  if (password.length >= 12) strengthPoints++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strengthPoints++;
  if (/[0-9]/.test(password)) strengthPoints++;
  if (/[^A-Za-z0-9]/.test(password)) strengthPoints++;

  if (strengthPoints <= 1) {
    return {
      score: 1,
      label: "Weak",
      colorClass: "bg-red-500",
      barWidth: "25%",
    };
  }
  if (strengthPoints === 2) {
    return {
      score: 2,
      label: "Fair",
      colorClass: "bg-amber-500",
      barWidth: "50%",
    };
  }
  if (strengthPoints === 3 || strengthPoints === 4) {
    return {
      score: 3,
      label: "Good",
      colorClass: "bg-blue-500",
      barWidth: "75%",
    };
  }
  return {
    score: 4,
    label: "Strong",
    colorClass: "bg-emerald-500",
    barWidth: "100%",
  };
}

export interface ProtectPdfOptions {
  userPassword: string;
  ownerPassword?: string;
  algorithm?: "AES-256" | "RC4";
  allowPrinting?: boolean;
  allowModifying?: boolean;
  allowCopying?: boolean;
  allowAnnotating?: boolean;
  allowFillingForms?: boolean;
  outputFilename?: string;
  onProgress?: (percent: number, currentStep: string) => void;
}

/**
 * Standard client-side PDF encryption using AES-256 (ISO 32000-2) or RC4 128-bit.
 * Runs 100% in-browser using the Web Crypto API without uploading files or passwords.
 */
export async function protectPdfFile(
  file: File,
  options: ProtectPdfOptions
): Promise<ProcessingResult> {
  const {
    userPassword,
    ownerPassword,
    algorithm = "AES-256",
    allowPrinting = true,
    allowModifying = false,
    allowCopying = false,
    allowAnnotating = true,
    allowFillingForms = true,
    outputFilename,
    onProgress,
  } = options;

  if (!userPassword || userPassword.length === 0) {
    throw new Error("A user password is required to encrypt and protect this PDF.");
  }

  onProgress?.(10, "Validating PDF file structure...");
  const validation = await validateAndInspectPdf(file);
  if (!validation.isValid) {
    const errorLower = (validation.error || "").toLowerCase();
    if (errorLower.includes("encrypt") || errorLower.includes("password")) {
      throw new Error(
        "This document is already password-protected or encrypted. Please provide an unencrypted PDF."
      );
    }
    throw new Error(validation.error || "The selected PDF is corrupted or unreadable.");
  }

  onProgress?.(30, "Reading document bytes...");
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  onProgress?.(
    55,
    `Applying ${algorithm === "AES-256" ? "AES-256 (ISO 32000-2)" : "RC4 128-bit"} standard security handler...`
  );

  const encryptOptions: EncryptPDFOptions = {
    algorithm,
    allowPrinting,
    allowModifying,
    allowCopying,
    allowAnnotating,
    allowFillingForms,
  };

  if (ownerPassword && ownerPassword.trim().length > 0) {
    encryptOptions.ownerPassword = ownerPassword.trim();
  }

  let encryptedBytes: Uint8Array;
  try {
    encryptedBytes = await encryptPDF(uint8, userPassword, encryptOptions);
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    if (errMessage.toLowerCase().includes("already")) {
      throw new Error("This PDF document is already encrypted.");
    }
    throw new Error(`PDF encryption failed: ${errMessage}`);
  }

  onProgress?.(85, "Creating encrypted output document...");
  const blob = new Blob([encryptedBytes as Uint8Array<ArrayBuffer>], {
    type: "application/pdf",
  });
  const downloadUrl = URL.createObjectURL(blob);

  onProgress?.(100, "Done! Document protected.");

  const cleanBase =
    outputFilename?.trim() || file.name.replace(/\.pdf$/i, "") + "-protected";
  const finalName = cleanBase.toLowerCase().endsWith(".pdf")
    ? cleanBase
    : `${cleanBase}.pdf`;

  return {
    fileName: finalName,
    fileSize: blob.size,
    formattedSize: formatBytes(blob.size),
    originalSize: file.size,
    downloadUrl,
    pageCount: validation.pageCount,
    itemCount: 1,
    meta: {
      algorithm,
      allowPrinting,
      allowCopying,
      allowModifying,
      allowAnnotating,
      totalPages: validation.pageCount,
    },
  };
}
