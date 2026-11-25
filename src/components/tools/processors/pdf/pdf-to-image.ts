import * as pdfjs from "pdfjs-dist";
import JSZip from "jszip";
import type { ProcessingResult, SplitOutputFile } from "../../shared/types";
import { formatBytes } from "../other/other-utils";
import { parsePageSelection } from "./split-pdf";

// Ensure worker is registered in browser environment
if (typeof window !== "undefined") {
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

export type ImageOutputFormat = "png" | "jpg";
export type ImageQualityTier = "standard" | "high" | "maximum";
export type PageSelectionMode = "all" | "custom";

export interface PdfToImageOptions {
  format: ImageOutputFormat;
  quality: ImageQualityTier;
  pageMode: PageSelectionMode;
  customPages?: string;
  outputBaseName?: string;
  onProgress?: (percent: number, stepMessage: string) => void;
}

export interface QualityProfile {
  id: ImageQualityTier;
  name: string;
  scale: number;
  dpiLabel: string;
  jpegQuality: number;
  description: string;
}

export const QUALITY_PROFILES: Record<ImageQualityTier, QualityProfile> = {
  standard: {
    id: "standard",
    name: "Standard",
    scale: 1.5,
    dpiLabel: "~108 DPI",
    jpegQuality: 0.8,
    description: "Ideal for everyday screen viewing, mobile devices, and fast sharing.",
  },
  high: {
    id: "high",
    name: "High",
    scale: 2.0,
    dpiLabel: "~150 DPI",
    jpegQuality: 0.9,
    description: "Crisp vector curves and sharp text. Recommended for presentations and documents.",
  },
  maximum: {
    id: "maximum",
    name: "Maximum",
    scale: 3.0,
    dpiLabel: "~300 DPI",
    jpegQuality: 0.96,
    description: "Print-quality ultra-high resolution with maximum visual fidelity.",
  },
};

/**
 * Converts PDF pages into PNG or JPG images in the browser using pdfjs-dist and HTML5 Canvas API.
 */
export async function convertPdfToImages(
  file: File,
  options: PdfToImageOptions
): Promise<ProcessingResult> {
  const { format, quality, pageMode, customPages = "", outputBaseName, onProgress } = options;
  const profile = QUALITY_PROFILES[quality];

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
      throw new Error(`"${file.name}" is password-protected. Please decrypt it before converting.`);
    }
    throw new Error(`"${file.name}" is corrupted or unreadable.`);
  }

  const totalDocPages = pdfDoc.numPages;
  if (totalDocPages === 0) {
    await loadingTask.destroy();
    throw new Error("This PDF document contains no readable pages.");
  }

  // Determine target pages to render (1-based page numbers)
  let targetPages: number[] = [];
  if (pageMode === "all") {
    for (let i = 1; i <= totalDocPages; i++) targetPages.push(i);
  } else {
    const parsed = parsePageSelection(customPages, totalDocPages);
    if (!parsed.valid) {
      await loadingTask.destroy();
      throw new Error(parsed.error || "Invalid page selection.");
    }
    targetPages = parsed.pages;
  }

  const mimeType = format === "png" ? "image/png" : "image/jpeg";
  const fileExtension = format === "png" ? "png" : "jpg";
  const rawBase = outputBaseName?.trim() || file.name.replace(/\.pdf$/i, "");
  const baseName = rawBase.replace(/\.pdf$/i, "");

  const outputFiles: SplitOutputFile[] = [];
  const zip = new JSZip();
  let totalOutputBytes = 0;

  try {
    for (let i = 0; i < targetPages.length; i++) {
      const pageNum = targetPages[i];
      const percent = Math.round(10 + ((i + 1) / targetPages.length) * 75);
      onProgress?.(percent, `Rendering page ${pageNum} of ${totalDocPages} (${i + 1}/${targetPages.length})...`);

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: profile.scale });

      // Create isolated canvas per page to prevent memory retention
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d", { willReadFrequently: false });

      if (!ctx) {
        page.cleanup();
        throw new Error("Failed to initialize canvas 2D rendering context.");
      }

      // If rendering to JPG, paint a white background first so transparent PDFs don't become black
      if (format === "jpg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      await page.render({
        canvas,
        canvasContext: ctx,
        viewport,
      }).promise;

      // Extract image blob with appropriate quality parameter
      const imageBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error(`Failed to encode image for page ${pageNum}.`));
          },
          mimeType,
          format === "jpg" ? profile.jpegQuality : undefined
        );
      });

      // Cleanup canvas memory immediately
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();

      const imageFileName = `${baseName}-page-${pageNum}.${fileExtension}`;
      const imageUrl = URL.createObjectURL(imageBlob);
      totalOutputBytes += imageBlob.size;

      outputFiles.push({
        name: imageFileName,
        size: imageBlob.size,
        formattedSize: formatBytes(imageBlob.size),
        pageCount: 1,
        downloadUrl: imageUrl,
        previewUrl: imageUrl,
        dimensions: {
          width: Math.floor(viewport.width),
          height: Math.floor(viewport.height),
        },
      });

      const imgBuffer = await imageBlob.arrayBuffer();
      zip.file(imageFileName, imgBuffer);
    }
  } finally {
    // Release PDF.js worker document resources
    try {
      await pdfDoc.cleanup();
      await loadingTask.destroy();
    } catch {
      // Ignore non-fatal cleanup errors
    }
  }

  // If only 1 image generated, return single output
  if (outputFiles.length === 1) {
    onProgress?.(100, "Done!");
    const single = outputFiles[0];
    return {
      fileName: single.name,
      fileSize: single.size,
      formattedSize: single.formattedSize,
      downloadUrl: single.downloadUrl,
      previewUrl: single.previewUrl,
      outputFiles,
      itemCount: 1,
      pageCount: 1,
      meta: {
        format,
        quality,
        width: single.dimensions?.width || 0,
        height: single.dimensions?.height || 0,
        pagesConverted: 1,
      },
    };
  }

  // Multi-image bundle in ZIP
  onProgress?.(90, "Compressing images into ZIP archive...");
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const zipUrl = URL.createObjectURL(zipBlob);
  const zipFileName = `${baseName}-${format}-images.zip`;

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
    pageCount: targetPages.length,
    meta: {
      format,
      quality,
      totalImages: outputFiles.length,
      totalUncompressedSize: formatBytes(totalOutputBytes),
    },
  };
}
