import { PDFDocument, rgb } from "pdf-lib";
import type { ProcessingResult } from "../../shared/types";
import { formatBytes } from "../other/other-utils";

export type PageSizeOption = "a4" | "letter" | "fit";
export type PageOrientationOption = "portrait" | "landscape" | "auto";
export type ImageFitOption = "contain" | "cover";
export type MarginOption = "none" | "small" | "custom";

export interface ImageToPdfOptions {
  pageSize: PageSizeOption;
  orientation: PageOrientationOption;
  fit: ImageFitOption;
  margin: MarginOption;
  customMarginPt?: number;
  outputFilename?: string;
  onProgress?: (percent: number, stepMessage: string) => void;
}

// Standard dimensions in points (72 DPI)
const PAGE_DIMENSIONS = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612.0, height: 792.0 },
};

/**
 * Decode and convert an image file to a PNG buffer using browser HTMLCanvasElement.
 * Used for WebP or non-standard JPEG/PNG streams.
 */
async function decodeAndConvertToPng(
  file: File
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to initialize canvas context for image decoding."));
        return;
      }

      // Fill white background for transparent images
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error(`Failed to encode image "${file.name}" to PNG.`));
            return;
          }
          const arrayBuffer = await blob.arrayBuffer();
          // Clear canvas memory
          canvas.width = 0;
          canvas.height = 0;
          resolve({
            bytes: new Uint8Array(arrayBuffer),
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        },
        "image/png"
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to decode image file "${file.name}". It may be corrupted or unsupported.`));
    };

    img.src = url;
  });
}

/**
 * Extract image dimensions and preview URL in browser
 */
export async function inspectImageFile(
  file: File
): Promise<{ width: number; height: number; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        previewUrl,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error(`Unable to load image "${file.name}".`));
    };
    img.src = previewUrl;
  });
}

/**
 * Converts multiple image files into a single unified PDF document.
 */
export async function convertImagesToPdf(
  files: File[],
  options: ImageToPdfOptions
): Promise<ProcessingResult> {
  if (files.length === 0) {
    throw new Error("Please upload at least one image file.");
  }

  const {
    pageSize,
    orientation,
    fit,
    margin,
    customMarginPt = 36,
    outputFilename,
    onProgress,
  } = options;

  onProgress?.(5, "Initializing PDF document...");
  const pdfDoc = await PDFDocument.create();

  // Determine margin in points
  const marginPt =
    margin === "none" ? 0 : margin === "small" ? 18 : Math.max(0, customMarginPt);

  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const percent = Math.round(10 + ((i + 1) / total) * 75);
    onProgress?.(percent, `Embedding image ${i + 1} of ${total}: ${file.name}...`);

    let embeddedImage;
    let imgWidth = 0;
    let imgHeight = 0;

    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const isJpg = fileExt === "jpg" || fileExt === "jpeg" || file.type === "image/jpeg";
    const isPng = fileExt === "png" || file.type === "image/png";

    if (isJpg) {
      try {
        const bytes = await file.arrayBuffer();
        embeddedImage = await pdfDoc.embedJpg(bytes);
        imgWidth = embeddedImage.width;
        imgHeight = embeddedImage.height;
      } catch {
        // Fall back to canvas conversion if JPEG contains unsupported color profiles (e.g. CMYK)
        const converted = await decodeAndConvertToPng(file);
        embeddedImage = await pdfDoc.embedPng(converted.bytes);
        imgWidth = converted.width;
        imgHeight = converted.height;
      }
    } else if (isPng) {
      try {
        const bytes = await file.arrayBuffer();
        embeddedImage = await pdfDoc.embedPng(bytes);
        imgWidth = embeddedImage.width;
        imgHeight = embeddedImage.height;
      } catch {
        const converted = await decodeAndConvertToPng(file);
        embeddedImage = await pdfDoc.embedPng(converted.bytes);
        imgWidth = converted.width;
        imgHeight = converted.height;
      }
    } else {
      // WebP or any other browser-decodable format
      const converted = await decodeAndConvertToPng(file);
      embeddedImage = await pdfDoc.embedPng(converted.bytes);
      imgWidth = converted.width;
      imgHeight = converted.height;
    }

    // Determine target page width and height
    let targetPageWidth = 0;
    let targetPageHeight = 0;

    if (pageSize === "fit") {
      targetPageWidth = imgWidth + marginPt * 2;
      targetPageHeight = imgHeight + marginPt * 2;
    } else {
      const baseDim = PAGE_DIMENSIONS[pageSize];
      const isImageLandscape = imgWidth > imgHeight;

      let isLandscape = false;
      if (orientation === "landscape") {
        isLandscape = true;
      } else if (orientation === "portrait") {
        isLandscape = false;
      } else {
        // Auto
        isLandscape = isImageLandscape;
      }

      targetPageWidth = isLandscape
        ? Math.max(baseDim.width, baseDim.height)
        : Math.min(baseDim.width, baseDim.height);
      targetPageHeight = isLandscape
        ? Math.min(baseDim.width, baseDim.height)
        : Math.max(baseDim.width, baseDim.height);
    }

    const page = pdfDoc.addPage([targetPageWidth, targetPageHeight]);

    // Draw white background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: targetPageWidth,
      height: targetPageHeight,
      color: rgb(1, 1, 1),
    });

    // Compute drawing dimensions and position
    const availWidth = Math.max(1, targetPageWidth - marginPt * 2);
    const availHeight = Math.max(1, targetPageHeight - marginPt * 2);

    let drawWidth = 0;
    let drawHeight = 0;

    if (pageSize === "fit" || (imgWidth <= availWidth && imgHeight <= availHeight && fit === "contain")) {
      // Direct fit without stretching
      const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
      drawWidth = imgWidth * scale;
      drawHeight = imgHeight * scale;
    } else if (fit === "contain") {
      const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
      drawWidth = imgWidth * scale;
      drawHeight = imgHeight * scale;
    } else {
      // cover
      const scale = Math.max(availWidth / imgWidth, availHeight / imgHeight);
      drawWidth = imgWidth * scale;
      drawHeight = imgHeight * scale;
    }

    const x = marginPt + (availWidth - drawWidth) / 2;
    const y = marginPt + (availHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  onProgress?.(90, "Finalizing and encoding PDF document...");
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
  const downloadUrl = URL.createObjectURL(blob);

  const rawBase = outputFilename?.trim() || "images-converted";
  const baseName = rawBase.replace(/\.pdf$/i, "");
  const finalName = `${baseName}.pdf`;

  onProgress?.(100, "Done!");

  return {
    fileName: finalName,
    fileSize: blob.size,
    formattedSize: formatBytes(blob.size),
    downloadUrl,
    itemCount: files.length,
    pageCount: total,
    meta: {
      pageSize,
      orientation,
      fit,
      margin,
      totalPages: total,
    },
  };
}
