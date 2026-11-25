import JSZip from "jszip";
import { formatBytes } from "../other/other-utils";
import { inspectImageFile, type ImageInspection } from "./compress-image";

export type { ImageInspection };

export type SupportedOutputFormat = "image/jpeg" | "image/png" | "image/webp";

export interface ConvertImageOptions {
  outputFormat: SupportedOutputFormat;
  quality?: number; // 10 to 100
  backgroundColor?: string; // used for JPEG (default: "#FFFFFF")
  onProgress?: (
    percent: number,
    currentIndex: number,
    totalCount: number,
    statusMessage: string
  ) => void;
}

export interface ConvertedImageItem {
  id: string;
  originalFile: File;
  originalName: string;
  originalFormat: string;
  originalSize: number;
  originalFormattedSize: string;
  originalWidth: number;
  originalHeight: number;
  originalPreviewUrl: string;

  convertedBlob: Blob;
  convertedName: string;
  convertedFormat: string;
  convertedMimeType: string;
  convertedSize: number;
  convertedFormattedSize: string;
  convertedWidth: number;
  convertedHeight: number;
  convertedPreviewUrl: string;
  downloadUrl: string;

  savedBytes: number;
  reductionPercentage: number;
  isSmaller: boolean;
  hasTransparency: boolean;
  convertedFromTransparent: boolean;
  isGifFirstFrame: boolean;
}

export interface ImageConvertBatchResult {
  items: ConvertedImageItem[];
  totalOriginalSize: number;
  totalConvertedSize: number;
  totalSavedBytes: number;
  totalReductionPercentage: number;
  isOverallSmaller: boolean;
  zipBlob?: Blob;
  zipUrl?: string;
  zipFileName?: string;
}

/**
 * Inspect image file with extended support for BMP and GIF
 */
export async function inspectConvertibleImage(file: File): Promise<ImageInspection & { isGif: boolean; formatLabel: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mime = file.type.toLowerCase();

  const isGif = mime === "image/gif" || ext === "gif";
  const isBmp = mime === "image/bmp" || mime === "image/x-ms-bmp" || ext === "bmp";
  const isWebp = mime === "image/webp" || ext === "webp";
  const isPng = mime === "image/png" || ext === "png";
  const isJpeg = mime === "image/jpeg" || mime === "image/jpg" || ext === "jpg" || ext === "jpeg";

  if (!isGif && !isBmp && !isWebp && !isPng && !isJpeg) {
    return {
      isValid: false,
      width: 0,
      height: 0,
      hasTransparency: false,
      isGif: false,
      formatLabel: ext.toUpperCase() || "UNKNOWN",
      error: `Unsupported file format (.${ext}). Supported formats: JPG, PNG, WebP, BMP, and GIF.`,
    };
  }

  // Load image element to inspect natural dimensions and transparency
  const baseInspection = await inspectImageFile(file);

  const formatLabel = isPng
    ? "PNG"
    : isJpeg
    ? "JPEG"
    : isWebp
    ? "WEBP"
    : isGif
    ? "GIF"
    : isBmp
    ? "BMP"
    : ext.toUpperCase();

  return {
    ...baseInspection,
    isGif,
    formatLabel,
  };
}

/**
 * Convert a single image file to the target format (JPEG, PNG, WebP) using HTML5 Canvas
 */
export async function convertSingleImage(
  file: File,
  options: ConvertImageOptions,
  inspection?: ImageInspection & { isGif?: boolean; formatLabel?: string }
): Promise<ConvertedImageItem> {
  const info = inspection || (await inspectConvertibleImage(file));
  if (!info.isValid) {
    throw new Error(info.error || "The image file could not be decoded.");
  }

  const { outputFormat, quality = 92, backgroundColor = "#FFFFFF" } = options;

  const originalPreviewUrl = URL.createObjectURL(file);
  const origW = info.width;
  const origH = info.height;

  // 1. Decode image via HTMLImageElement
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const imgEl = new Image();
    const url = URL.createObjectURL(file);
    imgEl.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imgEl);
    };
    imgEl.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to decode image data for "${file.name}"`));
    };
    imgEl.src = url;
  });

  // 2. Render on Canvas with proper transparency / background compositing
  const canvas = document.createElement("canvas");
  canvas.width = origW;
  canvas.height = origH;
  const ctx = canvas.getContext("2d", { alpha: outputFormat !== "image/jpeg" });
  if (!ctx) {
    throw new Error("Could not initialize 2D rendering canvas context.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const convertedFromTransparent =
    info.hasTransparency && outputFormat === "image/jpeg";

  if (outputFormat === "image/jpeg") {
    // Fill custom background color so transparent pixels don't render black
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, origW, origH);
  } else {
    ctx.clearRect(0, 0, origW, origH);
  }

  ctx.drawImage(img, 0, 0, origW, origH);

  // 3. Encode to target format Blob
  const qualityFactor = Math.max(0.1, Math.min(1.0, quality / 100));
  const convertedBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Browser failed to export image as ${outputFormat}`));
          return;
        }

        // Verify that the browser actually exported the requested MIME type
        if (blob.type !== outputFormat && blob.type !== "image/png" && blob.type !== "image/jpeg") {
          reject(
            new Error(
              `Requested format ${outputFormat} is not supported by your browser.`
            )
          );
          return;
        }

        resolve(blob);
      },
      outputFormat,
      qualityFactor
    );
  });

  // 4. Determine output extension and target filename
  const targetExt =
    outputFormat === "image/png"
      ? "png"
      : outputFormat === "image/webp"
      ? "webp"
      : "jpg";

  const originalBase = file.name.replace(/\.[^/.]+$/, "");
  const convertedName = `${originalBase}.${targetExt}`;
  const convertedPreviewUrl = URL.createObjectURL(convertedBlob);
  const downloadUrl = convertedPreviewUrl;

  // 5. Calculate size differences
  const originalSize = file.size;
  const convertedSize = convertedBlob.size;
  const savedBytes = originalSize > convertedSize ? originalSize - convertedSize : 0;
  const reductionPercentage = Math.round(
    ((originalSize - convertedSize) / originalSize) * 100
  );
  const isSmaller = convertedSize < originalSize;

  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    originalFile: file,
    originalName: file.name,
    originalFormat: info.formatLabel || file.name.split(".").pop()?.toUpperCase() || "IMAGE",
    originalSize,
    originalFormattedSize: formatBytes(originalSize),
    originalWidth: origW,
    originalHeight: origH,
    originalPreviewUrl,

    convertedBlob,
    convertedName,
    convertedFormat: targetExt.toUpperCase(),
    convertedMimeType: convertedBlob.type || outputFormat,
    convertedSize,
    convertedFormattedSize: formatBytes(convertedSize),
    convertedWidth: origW,
    convertedHeight: origH,
    convertedPreviewUrl,
    downloadUrl,

    savedBytes,
    reductionPercentage,
    isSmaller,
    hasTransparency: info.hasTransparency,
    convertedFromTransparent,
    isGifFirstFrame: !!info.isGif,
  };
}

/**
 * Batch convert multiple image files with live progress updates and ZIP bundling
 */
export async function convertImageBatch(
  files: File[],
  options: ConvertImageOptions,
  inspections?: Map<string, ImageInspection & { isGif?: boolean; formatLabel?: string }>
): Promise<ImageConvertBatchResult> {
  if (files.length === 0) {
    throw new Error("No image files provided for conversion.");
  }

  const items: ConvertedImageItem[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const currentPercent = Math.round((i / total) * 90);
    options.onProgress?.(
      currentPercent,
      i + 1,
      total,
      `Converting image ${i + 1} of ${total}: ${file.name}`
    );

    // Yield control to UI thread
    await new Promise((resolve) => setTimeout(resolve, 30));

    const inspection = inspections?.get(file.name);
    const item = await convertSingleImage(file, options, inspection);
    items.push(item);
  }

  options.onProgress?.(92, total, total, "Packaging converted images...");

  const totalOriginalSize = items.reduce((acc, it) => acc + it.originalSize, 0);
  const totalConvertedSize = items.reduce((acc, it) => acc + it.convertedSize, 0);
  const totalSavedBytes =
    totalOriginalSize > totalConvertedSize ? totalOriginalSize - totalConvertedSize : 0;
  const totalReductionPercentage =
    totalOriginalSize > 0
      ? Math.round(((totalOriginalSize - totalConvertedSize) / totalOriginalSize) * 100)
      : 0;
  const isOverallSmaller = totalConvertedSize < totalOriginalSize;

  let zipBlob: Blob | undefined;
  let zipUrl: string | undefined;
  let zipFileName: string | undefined;

  if (items.length > 1) {
    options.onProgress?.(95, total, total, "Creating ZIP archive...");
    const zip = new JSZip();

    const nameCounts = new Map<string, number>();

    for (const item of items) {
      let fileName = item.convertedName;
      if (nameCounts.has(fileName)) {
        const count = nameCounts.get(fileName)! + 1;
        nameCounts.set(fileName, count);
        const parts = fileName.split(".");
        const ext = parts.pop();
        fileName = `${parts.join(".")}_(${count}).${ext}`;
      } else {
        nameCounts.set(fileName, 1);
      }
      zip.file(fileName, item.convertedBlob);
    }

    zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    zipUrl = URL.createObjectURL(zipBlob);
    zipFileName = "converted-images.zip";
  }

  options.onProgress?.(100, total, total, "Conversion complete!");

  return {
    items,
    totalOriginalSize,
    totalConvertedSize,
    totalSavedBytes,
    totalReductionPercentage,
    isOverallSmaller,
    zipBlob,
    zipUrl,
    zipFileName,
  };
}
