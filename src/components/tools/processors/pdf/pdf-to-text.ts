import * as pdfjs from "pdfjs-dist";
import { parsePageSelection } from "./split-pdf";

// Ensure worker is configured in browser
if (typeof window !== "undefined") {
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

export interface ExtractedPageText {
  pageNumber: number;
  text: string;
  hasText: boolean;
  wordCount: number;
  charCount: number;
}

export interface PdfToTextResult {
  fullText: string;
  pages: ExtractedPageText[];
  totalWords: number;
  totalChars: number;
  totalPages: number;
  extractedPagesCount: number;
  scannedPagesCount: number;
  downloadUrl: string;
  fileName: string;
}

export interface PdfToTextOptions {
  pageMode: "all" | "custom";
  customPages?: string;
  outputFilename?: string;
  includePageHeaders?: boolean;
  onProgress?: (percent: number, stepMessage: string) => void;
}

interface PDFTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
}

/**
 * Reconstruct text items from PDF.js into readable lines and paragraphs with proper spacing.
 */
function reconstructPageText(items: PDFTextItem[]): string {
  if (items.length === 0) return "";

  let result = "";
  let lastY: number | null = null;
  let lastX: number | null = null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const text = item.str;

    if (!text && !item.hasEOL) continue;

    const currentX = item.transform[4];
    const currentY = item.transform[5];

    if (lastY !== null) {
      const deltaY = Math.abs(currentY - lastY);

      if (deltaY > 5) {
        // Vertical shift: new line
        if (deltaY > 16) {
          // Significant vertical shift: paragraph break
          result += "\n\n";
        } else {
          result += "\n";
        }
        lastX = null;
      } else if (lastX !== null) {
        // Horizontal spacing on the same line
        const deltaX = currentX - lastX;
        if (
          deltaX > 2.5 &&
          !result.endsWith(" ") &&
          !text.startsWith(" ")
        ) {
          result += " ";
        }
      }
    }

    result += text;

    if (item.hasEOL) {
      result += "\n";
      lastY = null;
      lastX = null;
    } else {
      lastY = currentY;
      lastX = currentX + (item.width || text.length * 6);
    }
  }

  return result.trim();
}

/**
 * Extract readable text page-by-page from a PDF document in the browser using pdfjs-dist.
 */
export async function extractTextFromPdf(
  file: File,
  options: PdfToTextOptions
): Promise<PdfToTextResult> {
  const {
    pageMode,
    customPages = "",
    outputFilename,
    includePageHeaders = true,
    onProgress,
  } = options;

  onProgress?.(5, "Loading PDF document in browser memory...");
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    useSystemFonts: true,
  });

  let pdfDoc: pdfjs.PDFDocumentProxy;
  try {
    pdfDoc = await loadingTask.promise;
  } catch (err: unknown) {
    const errStr = (err instanceof Error ? err.message : String(err)).toLowerCase();
    if (errStr.includes("password") || errStr.includes("encrypt")) {
      throw new Error(`"${file.name}" is password-protected. Please decrypt it before extracting text.`);
    }
    throw new Error(`"${file.name}" is corrupted or unreadable.`);
  }

  const totalPages = pdfDoc.numPages;
  if (totalPages === 0) {
    await loadingTask.destroy();
    throw new Error("This PDF document contains no readable pages.");
  }

  // Determine target pages (1-based)
  let targetPages: number[] = [];
  if (pageMode === "all") {
    for (let i = 1; i <= totalPages; i++) targetPages.push(i);
  } else {
    const parsed = parsePageSelection(customPages, totalPages);
    if (!parsed.valid) {
      await loadingTask.destroy();
      throw new Error(parsed.error || "Invalid page selection.");
    }
    targetPages = parsed.pages;
  }

  const extractedPages: ExtractedPageText[] = [];
  let totalWords = 0;
  let totalChars = 0;
  let scannedPagesCount = 0;
  const fullTextBlocks: string[] = [];

  try {
    for (let i = 0; i < targetPages.length; i++) {
      const pageNum = targetPages[i];
      const percent = Math.round(10 + ((i + 1) / targetPages.length) * 80);
      onProgress?.(percent, `Extracting text from page ${pageNum} (${i + 1}/${targetPages.length})...`);

      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items as PDFTextItem[];

      const rawPageText = reconstructPageText(items);
      const hasText = rawPageText.trim().length > 0;

      const pageWords = hasText ? rawPageText.trim().split(/\s+/).length : 0;
      const pageChars = rawPageText.length;

      totalWords += pageWords;
      totalChars += pageChars;

      if (!hasText) {
        scannedPagesCount++;
      }

      extractedPages.push({
        pageNumber: pageNum,
        text: rawPageText,
        hasText,
        wordCount: pageWords,
        charCount: pageChars,
      });

      if (includePageHeaders) {
        const header = `--- Page ${pageNum} ---`;
        const content = hasText
          ? rawPageText
          : "[No extractable text found on this page. This page may be a scanned image or photograph. OCR is required to extract text from images.]";
        fullTextBlocks.push(`${header}\n\n${content}`);
      } else {
        if (hasText) {
          fullTextBlocks.push(rawPageText);
        }
      }

      page.cleanup();
    }
  } finally {
    try {
      await pdfDoc.cleanup();
      await loadingTask.destroy();
    } catch {
      // Ignore non-fatal cleanup errors
    }
  }

  const fullText = fullTextBlocks.join("\n\n\n");
  const textBlob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(textBlob);

  const rawBase = outputFilename?.trim() || file.name.replace(/\.pdf$/i, "");
  const baseName = rawBase.replace(/\.txt$/i, "");
  const fileName = `${baseName}.txt`;

  onProgress?.(100, "Done!");

  return {
    fullText,
    pages: extractedPages,
    totalWords,
    totalChars,
    totalPages,
    extractedPagesCount: targetPages.length,
    scannedPagesCount,
    downloadUrl,
    fileName,
  };
}
