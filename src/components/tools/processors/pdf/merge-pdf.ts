import { PDFDocument } from "pdf-lib";
import type { ProcessingResult, PdfProcessingOptions } from "../../shared/types";
import { formatBytes } from "../other/other-utils";

export interface PdfValidationResult {
  isValid: boolean;
  pageCount: number;
  error?: string;
}

/**
 * Validate PDF file integrity, format, and password encryption status in the browser
 */
export async function validateAndInspectPdf(file: File): Promise<PdfValidationResult> {
  try {
    // 1. Basic extension / MIME check
    const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
    const isPdfMime = !file.type || file.type === "application/pdf" || file.type === "application/x-pdf";
    if (!isPdfExt && !isPdfMime) {
      return {
        isValid: false,
        pageCount: 0,
        error: "Not a valid PDF file format (.pdf required).",
      };
    }

    // 2. Read array buffer and check PDF magic bytes (%PDF-)
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength < 5) {
      return {
        isValid: false,
        pageCount: 0,
        error: "File is empty or truncated.",
      };
    }

    const headerBytes = new Uint8Array(arrayBuffer.slice(0, 5));
    const headerStr = String.fromCharCode(...headerBytes);
    if (!headerStr.startsWith("%PDF")) {
      return {
        isValid: false,
        pageCount: 0,
        error: "Corrupted or invalid PDF header.",
      };
    }

    // 3. Load with pdf-lib to check structure and encryption
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: false });
    const pageCount = pdfDoc.getPageCount();

    if (pageCount === 0) {
      return {
        isValid: false,
        pageCount: 0,
        error: "PDF contains no readable pages.",
      };
    }

    return {
      isValid: true,
      pageCount,
    };
  } catch (err: unknown) {
    const errorStr = (err instanceof Error ? err.message : String(err)).toLowerCase();
    
    if (
      errorStr.includes("encrypt") ||
      errorStr.includes("password") ||
      errorStr.includes("security")
    ) {
      return {
        isValid: false,
        pageCount: 0,
        error: "Password-protected or encrypted PDF.",
      };
    }

    return {
      isValid: false,
      pageCount: 0,
      error: "Corrupted or unreadable PDF document.",
    };
  }
}

/**
 * Extract total page count of a PDF file using pdf-lib
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const result = await validateAndInspectPdf(file);
  return result.isValid ? result.pageCount : 1;
}

/**
 * Merge multiple PDF files into a single PDF document in the browser
 */
export async function mergePdfFiles(
  files: File[],
  options: Partial<PdfProcessingOptions> & {
    onProgress?: (percent: number, currentStep: string) => void;
  } = {}
): Promise<ProcessingResult> {
  if (files.length < 2) {
    throw new Error("At least two PDF files are required to merge.");
  }

  const { onProgress, outputFilename = "merged-document.pdf" } = options;

  onProgress?.(5, "Initializing merged document container...");
  const mergedPdf = await PDFDocument.create();

  const total = files.length;
  let totalPageCount = 0;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const percent = Math.round(10 + ((i + 1) / total) * 75);
    onProgress?.(percent, `Processing file ${i + 1} of ${total}: ${file.name}`);

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Ensure we catch password-protected/corrupted files safely
      const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: false });
      const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());

      for (const page of copiedPages) {
        mergedPdf.addPage(page);
        totalPageCount++;
      }
    } catch (err: unknown) {
      const errStr = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (errStr.includes("encrypt") || errStr.includes("password")) {
        throw new Error(
          `"${file.name}" is password-protected or encrypted. Please remove or decrypt it to merge.`
        );
      }
      throw new Error(
        `"${file.name}" is corrupted or unreadable. Please check or remove this file.`
      );
    }
  }

  onProgress?.(90, "Finalizing and encoding merged PDF document...");
  const mergedPdfBytes = await mergedPdf.save();
  const blob = new Blob([mergedPdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
  const downloadUrl = URL.createObjectURL(blob);

  onProgress?.(100, "Done!");

  const finalName = outputFilename.trim().toLowerCase().endsWith(".pdf")
    ? outputFilename.trim()
    : `${outputFilename.trim()}.pdf`;

  return {
    fileName: finalName,
    fileSize: blob.size,
    formattedSize: formatBytes(blob.size),
    downloadUrl,
    itemCount: files.length,
    pageCount: totalPageCount,
    meta: {
      totalFiles: files.length,
      totalPages: totalPageCount,
    },
  };
}
