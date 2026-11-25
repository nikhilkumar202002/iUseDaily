import { PDFDocument } from "pdf-lib";
import type { ProcessingResult, PdfProcessingOptions } from "../../shared/types";
import { formatBytes } from "../other/other-utils";

/**
 * Extract total page count of a PDF file using pdf-lib
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    return pdfDoc.getPageCount();
  } catch (error) {
    console.error(`Failed to read page count for ${file.name}:`, error);
    return 1;
  }
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

  const { onProgress, outputFilename = "merged_document.pdf" } = options;

  onProgress?.(10, "Initializing merged document...");
  const mergedPdf = await PDFDocument.create();

  const total = files.length;
  let totalPageCount = 0;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const percent = Math.round(15 + ((i + 1) / total) * 70);
    onProgress?.(percent, `Processing file ${i + 1} of ${total}: ${file.name}`);

    const arrayBuffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
      totalPageCount++;
    }
  }

  onProgress?.(90, "Finalizing and encoding merged PDF...");
  const mergedPdfBytes = await mergedPdf.save();
  const blob = new Blob([mergedPdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
  const downloadUrl = URL.createObjectURL(blob);

  onProgress?.(100, "Done!");

  const finalName = outputFilename.toLowerCase().endsWith(".pdf")
    ? outputFilename
    : `${outputFilename}.pdf`;

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
