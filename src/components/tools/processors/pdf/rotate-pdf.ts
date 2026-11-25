import { PDFDocument, degrees } from "pdf-lib";
import type { ProcessingResult } from "../../shared/types";
import { formatBytes } from "../other/other-utils";
import { parsePageSelection } from "./split-pdf";

export type RotationAngle = 90 | 180 | 270;
export type RotationTarget = "all" | "odd" | "even" | "custom";

export interface RotatePdfOptions {
  angle: RotationAngle;
  target: RotationTarget;
  customPages?: string;
  outputFilename?: string;
  onProgress?: (percent: number, stepMessage: string) => void;
}

/**
 * Determine the 1-based page numbers targeted for rotation
 */
export function resolveTargetPages(
  target: RotationTarget,
  customPages: string,
  totalPages: number
): { valid: boolean; pages: number[]; error?: string } {
  if (totalPages <= 0) {
    return { valid: false, pages: [], error: "Document contains no pages." };
  }

  if (target === "all") {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return { valid: true, pages };
  }

  if (target === "odd") {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i += 2) pages.push(i);
    return { valid: true, pages };
  }

  if (target === "even") {
    const pages: number[] = [];
    for (let i = 2; i <= totalPages; i += 2) pages.push(i);
    if (pages.length === 0) {
      return { valid: false, pages: [], error: "This document has only 1 page (no even pages)." };
    }
    return { valid: true, pages };
  }

  if (target === "custom") {
    return parsePageSelection(customPages || "", totalPages);
  }

  return { valid: false, pages: [], error: "Invalid rotation target specified." };
}

/**
 * Rotate PDF pages client-side using pdf-lib while preserving existing page rotation
 */
export async function rotatePdfFile(
  file: File,
  options: RotatePdfOptions
): Promise<ProcessingResult> {
  const { angle, target, customPages = "", outputFilename, onProgress } = options;

  onProgress?.(10, "Loading PDF document in browser...");
  const arrayBuffer = await file.arrayBuffer();

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: false });
  } catch (err: unknown) {
    const errStr = (err instanceof Error ? err.message : String(err)).toLowerCase();
    if (errStr.includes("encrypt") || errStr.includes("password")) {
      throw new Error(`"${file.name}" is password-protected. Please unlock or decrypt it before rotating.`);
    }
    throw new Error(`"${file.name}" is corrupted or not a valid PDF file.`);
  }

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  if (totalPages === 0) {
    throw new Error("This PDF document contains no readable pages.");
  }

  onProgress?.(30, "Resolving target pages for rotation...");
  const resolved = resolveTargetPages(target, customPages, totalPages);
  if (!resolved.valid) {
    throw new Error(resolved.error || "Invalid page selection.");
  }

  // Convert 1-based page numbers to a Set of 0-based indices for quick lookup
  const targetIndices = new Set(resolved.pages.map((p) => p - 1));

  onProgress?.(50, `Applying ${angle}° rotation to ${targetIndices.size} pages...`);

  for (let i = 0; i < totalPages; i++) {
    if (targetIndices.has(i)) {
      const page = pages[i];
      const currentRotation = page.getRotation().angle;
      // Add rotation angle to preserve existing orientation
      const newRotation = (currentRotation + angle) % 360;
      page.setRotation(degrees(newRotation));
    }
  }

  onProgress?.(85, "Encoding rotated PDF document...");
  const rotatedBytes = await pdfDoc.save();
  const blob = new Blob([rotatedBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
  const downloadUrl = URL.createObjectURL(blob);

  const rawBase = outputFilename?.trim() || file.name.replace(/\.pdf$/i, "");
  const baseName = rawBase.replace(/\.pdf$/i, "");
  const finalFileName = `${baseName}-rotated.pdf`;

  onProgress?.(100, "Done!");

  return {
    fileName: finalFileName,
    fileSize: blob.size,
    formattedSize: formatBytes(blob.size),
    downloadUrl,
    itemCount: 1,
    pageCount: totalPages,
    meta: {
      angle,
      target,
      rotatedPageCount: targetIndices.size,
      totalPages,
    },
  };
}
