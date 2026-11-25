import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import type { ProcessingResult, SplitOutputFile } from "../../shared/types";
import { formatBytes } from "../other/other-utils";

export type SplitMode = "extract" | "every" | "ranges";

export interface SplitPdfOptions {
  mode: SplitMode;
  pageSelection?: string; // e.g. "1, 3, 5-8"
  pageRanges?: string; // e.g. "1-3, 4-6, 7-10"
  outputBaseName?: string;
  onProgress?: (percent: number, stepMessage: string) => void;
}

/**
 * Parse page selection for Mode A: Extract selected pages
 * Example input: "1, 3, 5-8" -> [1, 3, 5, 6, 7, 8]
 * Preserves user-specified order.
 */
export function parsePageSelection(
  input: string,
  maxPages: number
): { valid: boolean; pages: number[]; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, pages: [], error: "Please enter at least one page number or range." };
  }

  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    return { valid: false, pages: [], error: "No page numbers found in input." };
  }

  const pages: number[] = [];

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        return { valid: false, pages: [], error: `Invalid range format: "${part}"` };
      }
      if (start < 1) {
        return { valid: false, pages: [], error: `Page number must be 1 or greater in "${part}"` };
      }
      if (end > maxPages) {
        return {
          valid: false,
          pages: [],
          error: `Page ${end} exceeds total document pages (${maxPages})`,
        };
      }
      if (start > end) {
        return {
          valid: false,
          pages: [],
          error: `Start page (${start}) cannot be greater than end page (${end}) in "${part}"`,
        };
      }

      for (let p = start; p <= end; p++) {
        pages.push(p);
      }
    } else {
      const page = parseInt(part, 10);
      if (isNaN(page)) {
        return { valid: false, pages: [], error: `Invalid page number: "${part}"` };
      }
      if (page < 1) {
        return { valid: false, pages: [], error: `Page number must be 1 or greater: "${part}"` };
      }
      if (page > maxPages) {
        return {
          valid: false,
          pages: [],
          error: `Page ${page} exceeds total document pages (${maxPages})`,
        };
      }
      pages.push(page);
    }
  }

  if (pages.length === 0) {
    return { valid: false, pages: [], error: "No valid pages were specified." };
  }

  return { valid: true, pages };
}

/**
 * Parse page ranges for Mode C: Split by page ranges
 * Example input: "1-3, 4-6, 7-10"
 */
export function parsePageRanges(
  input: string,
  maxPages: number
): { valid: boolean; ranges: { start: number; end: number }[]; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, ranges: [], error: "Please enter at least one page range (e.g. 1-3, 4-6)." };
  }

  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    return { valid: false, ranges: [], error: "No page ranges found in input." };
  }

  const ranges: { start: number; end: number }[] = [];

  for (const part of parts) {
    if (!part.includes("-")) {
      // Single page treated as 1-page range
      const page = parseInt(part, 10);
      if (isNaN(page) || page < 1 || page > maxPages) {
        return {
          valid: false,
          ranges: [],
          error: `Invalid page "${part}". Must be between 1 and ${maxPages}.`,
        };
      }
      ranges.push({ start: page, end: page });
      continue;
    }

    const [startStr, endStr] = part.split("-").map((s) => s.trim());
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);

    if (isNaN(start) || isNaN(end)) {
      return { valid: false, ranges: [], error: `Invalid range format: "${part}"` };
    }
    if (start < 1) {
      return { valid: false, ranges: [], error: `Start page must be at least 1 in "${part}"` };
    }
    if (end > maxPages) {
      return {
        valid: false,
        ranges: [],
        error: `End page ${end} in "${part}" exceeds total pages (${maxPages})`,
      };
    }
    if (start > end) {
      return {
        valid: false,
        ranges: [],
        error: `Start page (${start}) cannot be greater than end page (${end}) in "${part}"`,
      };
    }

    ranges.push({ start, end });
  }

  return { valid: true, ranges };
}

/**
 * Split a PDF file locally in the browser using pdf-lib and JSZip
 */
export async function splitPdfFile(
  file: File,
  options: SplitPdfOptions
): Promise<ProcessingResult> {
  const { mode, pageSelection, pageRanges, outputBaseName, onProgress } = options;

  onProgress?.(5, "Reading PDF document...");
  const arrayBuffer = await file.arrayBuffer();

  let srcDoc: PDFDocument;
  try {
    srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: false });
  } catch (err: unknown) {
    const errStr = (err instanceof Error ? err.message : String(err)).toLowerCase();
    if (errStr.includes("encrypt") || errStr.includes("password")) {
      throw new Error(`"${file.name}" is password-protected or encrypted. Please decrypt it before splitting.`);
    }
    throw new Error(`"${file.name}" is corrupted or not a valid PDF file.`);
  }

  const totalPages = srcDoc.getPageCount();
  if (totalPages === 0) {
    throw new Error("This PDF document contains no readable pages.");
  }

  // Base output name clean
  const rawBase = outputBaseName?.trim() || file.name.replace(/\.pdf$/i, "");
  const baseName = rawBase.replace(/\.pdf$/i, "");

  // -------------------------------------------------------------
  // MODE A: Extract selected pages into one new PDF
  // -------------------------------------------------------------
  if (mode === "extract") {
    onProgress?.(15, "Validating selected pages...");
    const parsed = parsePageSelection(pageSelection || "", totalPages);
    if (!parsed.valid) {
      throw new Error(parsed.error || "Invalid page selection.");
    }

    onProgress?.(30, `Extracting ${parsed.pages.length} selected pages...`);
    const newDoc = await PDFDocument.create();

    // Map 1-based page numbers to 0-based indices
    const indices0Based = parsed.pages.map((p) => p - 1);
    const copiedPages = await newDoc.copyPages(srcDoc, indices0Based);

    for (const page of copiedPages) {
      newDoc.addPage(page);
    }

    onProgress?.(85, "Saving extracted PDF...");
    const bytes = await newDoc.save();
    const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
    const downloadUrl = URL.createObjectURL(blob);
    const finalName = `${baseName}-extracted.pdf`;

    onProgress?.(100, "Done!");

    return {
      fileName: finalName,
      fileSize: blob.size,
      formattedSize: formatBytes(blob.size),
      downloadUrl,
      itemCount: 1,
      pageCount: parsed.pages.length,
      meta: {
        mode: "extract",
        sourcePages: totalPages,
        extractedPages: parsed.pages.join(", "),
      },
    };
  }

  // -------------------------------------------------------------
  // MODE B: Split every page into separate individual PDFs
  // -------------------------------------------------------------
  if (mode === "every") {
    onProgress?.(10, `Preparing to split ${totalPages} pages...`);
    const outputFiles: SplitOutputFile[] = [];
    const zip = new JSZip();

    for (let i = 0; i < totalPages; i++) {
      const pageNumber = i + 1;
      const progressPercent = Math.round(10 + (pageNumber / totalPages) * 70);
      onProgress?.(progressPercent, `Generating page ${pageNumber} of ${totalPages}...`);

      const singlePageDoc = await PDFDocument.create();
      const [copiedPage] = await singlePageDoc.copyPages(srcDoc, [i]);
      singlePageDoc.addPage(copiedPage);

      const pageBytes = await singlePageDoc.save();
      const pageBlob = new Blob([pageBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
      const pageUrl = URL.createObjectURL(pageBlob);
      const pageFileName = `${baseName}-page-${pageNumber}.pdf`;

      outputFiles.push({
        name: pageFileName,
        size: pageBlob.size,
        formattedSize: formatBytes(pageBlob.size),
        pageCount: 1,
        downloadUrl: pageUrl,
      });

      zip.file(pageFileName, pageBytes);
    }

    onProgress?.(85, "Creating ZIP archive of all pages...");
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipUrl = URL.createObjectURL(zipBlob);
    const zipFileName = `${baseName}-all-pages.zip`;

    onProgress?.(100, "Done!");

    return {
      fileName: zipFileName,
      fileSize: zipBlob.size,
      formattedSize: formatBytes(zipBlob.size),
      downloadUrl: zipUrl,
      zipUrl,
      zipFileName,
      outputFiles,
      itemCount: totalPages,
      pageCount: totalPages,
      meta: {
        mode: "every",
        totalFilesGenerated: totalPages,
      },
    };
  }

  // -------------------------------------------------------------
  // MODE C: Split by page ranges (e.g. "1-3, 4-6, 7-10")
  // -------------------------------------------------------------
  if (mode === "ranges") {
    onProgress?.(10, "Validating page ranges...");
    const parsed = parsePageRanges(pageRanges || "", totalPages);
    if (!parsed.valid) {
      throw new Error(parsed.error || "Invalid page ranges.");
    }

    const ranges = parsed.ranges;
    const outputFiles: SplitOutputFile[] = [];
    const zip = new JSZip();

    for (let r = 0; r < ranges.length; r++) {
      const range = ranges[r];
      const rangeIndex = r + 1;
      const progressPercent = Math.round(15 + (rangeIndex / ranges.length) * 65);
      onProgress?.(
        progressPercent,
        `Extracting range ${rangeIndex} of ${ranges.length} (pages ${range.start}-${range.end})...`
      );

      const rangeDoc = await PDFDocument.create();
      const pageIndices: number[] = [];
      for (let p = range.start; p <= range.end; p++) {
        pageIndices.push(p - 1);
      }

      const copiedPages = await rangeDoc.copyPages(srcDoc, pageIndices);
      for (const cp of copiedPages) {
        rangeDoc.addPage(cp);
      }

      const rangeBytes = await rangeDoc.save();
      const rangeBlob = new Blob([rangeBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
      const rangeUrl = URL.createObjectURL(rangeBlob);
      const rangeFileName = `${baseName}-range-${range.start}-${range.end}.pdf`;

      outputFiles.push({
        name: rangeFileName,
        size: rangeBlob.size,
        formattedSize: formatBytes(rangeBlob.size),
        pageCount: pageIndices.length,
        downloadUrl: rangeUrl,
      });

      zip.file(rangeFileName, rangeBytes);
    }

    // If only 1 range was specified, provide direct PDF download
    if (outputFiles.length === 1) {
      onProgress?.(100, "Done!");
      const single = outputFiles[0];
      return {
        fileName: single.name,
        fileSize: single.size,
        formattedSize: single.formattedSize,
        downloadUrl: single.downloadUrl,
        outputFiles,
        itemCount: 1,
        pageCount: single.pageCount,
        meta: {
          mode: "ranges",
          range: `${ranges[0].start}-${ranges[0].end}`,
        },
      };
    }

    onProgress?.(85, "Creating ZIP archive of range files...");
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipUrl = URL.createObjectURL(zipBlob);
    const zipFileName = `${baseName}-ranges.zip`;

    onProgress?.(100, "Done!");

    return {
      fileName: zipFileName,
      fileSize: zipBlob.size,
      formattedSize: formatBytes(zipBlob.size),
      downloadUrl: zipUrl,
      zipUrl,
      zipFileName,
      outputFiles,
      itemCount: outputFiles.length,
      pageCount: ranges.reduce((acc, r) => acc + (r.end - r.start + 1), 0),
      meta: {
        mode: "ranges",
        totalFilesGenerated: outputFiles.length,
      },
    };
  }

  throw new Error("Invalid splitting mode specified.");
}
