import imageCompression from "browser-image-compression";
import JSZip from "jszip";
import { formatBytes } from "../other/other-utils";

export interface ImageInspection {
  isValid: boolean;
  width: number;
  height: number;
  hasTransparency: boolean;
  error?: string;
}

export interface CompressedImageItem {
  id: string;
  originalFile: File;
  originalName: string;
  originalSize: number;
  originalFormattedSize: string;
  originalWidth: number;
  originalHeight: number;
  originalPreviewUrl: string;

  compressedBlob: Blob;
  compressedName: string;
  compressedSize: number;
  compressedFormattedSize: string;
  compressedWidth: number;
  compressedHeight: number;
  compressedPreviewUrl: string;
  downloadUrl: string;

  outputFormat: string;
  savedBytes: number;
  reductionPercentage: number;
  isSmaller: boolean;
  hasTransparency: boolean;
  convertedFromTransparent: boolean;
}

export interface ImageCompressionOptions {
  quality: number; // 10 to 100
  targetMaxKB?: number; // Optional target max size in KB
  maintainDimensions: boolean;
  maxWidth?: number;
  maxHeight?: number;
  outputFormat: "original" | "image/jpeg" | "image/png" | "image/webp";
  onProgress?: (
    percent: number,
    currentIndex: number,
    totalCount: number,
    statusMessage: string
  ) => void;
}

export interface ImageCompressionBatchResult {
  items: CompressedImageItem[];
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSavedBytes: number;
  totalReductionPercentage: number;
  isOverallSmaller: boolean;
  zipBlob?: Blob;
  zipUrl?: string;
  zipFileName?: string;
}

/**
 * Inspect image file: reads dimensions, validates decoding, and checks for alpha transparency.
 */
export async function inspectImageFile(file: File): Promise<ImageInspection> {
  return new Promise((resolve) => {
    // Basic file type check
    const validMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    const isKnownExt = ["jpg", "jpeg", "png", "webp"].includes(ext || "");

    if (!isKnownExt && !validMimes.includes(file.type)) {
      resolve({
        isValid: false,
        width: 0,
        height: 0,
        hasTransparency: false,
        error: "Unsupported file type. Please upload a JPG, PNG, or WebP image.",
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      if (!width || !height) {
        URL.revokeObjectURL(objectUrl);
        resolve({
          isValid: false,
          width: 0,
          height: 0,
          hasTransparency: false,
          error: "Image has invalid dimensions or zero pixels.",
        });
        return;
      }

      // Check for alpha channel transparency if PNG or WebP
      let hasTransparency = false;
      try {
        if (file.type === "image/png" || file.type === "image/webp" || ext === "png" || ext === "webp") {
          const sampleCanvas = document.createElement("canvas");
          const sampleWidth = Math.min(width, 100);
          const sampleHeight = Math.min(height, 100);
          sampleCanvas.width = sampleWidth;
          sampleCanvas.height = sampleHeight;
          const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true });

          if (ctx) {
            ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
            const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
            // Scan alpha values
            for (let i = 3; i < imgData.length; i += 4) {
              if (imgData[i] < 250) {
                hasTransparency = true;
                break;
              }
            }
          }
        }
      } catch {
        // Ignore canvas inspection errors
      }

      URL.revokeObjectURL(objectUrl);
      resolve({
        isValid: true,
        width,
        height,
        hasTransparency,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        isValid: false,
        width: 0,
        height: 0,
        hasTransparency: false,
        error: "Corrupted or unreadable image file.",
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Compress a single image in-browser using HTML5 Canvas & browser-image-compression algorithms.
 */
export async function compressSingleImage(
  file: File,
  options: ImageCompressionOptions,
  inspection?: ImageInspection
): Promise<CompressedImageItem> {
  const info = inspection || (await inspectImageFile(file));
  if (!info.isValid) {
    throw new Error(info.error || "The image file could not be read.");
  }

  const originalWidth = info.width;
  const originalHeight = info.height;
  const originalPreviewUrl = URL.createObjectURL(file);

  // 1. Calculate Target Dimensions preserving aspect ratio
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (!options.maintainDimensions) {
    const maxWidth = options.maxWidth && options.maxWidth > 0 ? options.maxWidth : null;
    const maxHeight = options.maxHeight && options.maxHeight > 0 ? options.maxHeight : null;

    if (maxWidth && targetWidth > maxWidth) {
      const ratio = maxWidth / targetWidth;
      targetWidth = maxWidth;
      targetHeight = Math.round(targetHeight * ratio);
    }

    if (maxHeight && targetHeight > maxHeight) {
      const ratio = maxHeight / targetHeight;
      targetHeight = maxHeight;
      targetWidth = Math.round(targetWidth * ratio);
    }
  }

  // 2. Determine target MIME type and extension
  let targetMime: string;
  let targetExt: string;

  if (options.outputFormat === "original") {
    if (file.type === "image/png" || file.name.toLowerCase().endsWith(".png")) {
      targetMime = "image/png";
      targetExt = "png";
    } else if (file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp")) {
      targetMime = "image/webp";
      targetExt = "webp";
    } else {
      targetMime = "image/jpeg";
      targetExt = "jpg";
    }
  } else {
    targetMime = options.outputFormat;
    targetExt =
      targetMime === "image/png"
        ? "png"
        : targetMime === "image/webp"
        ? "webp"
        : "jpg";
  }

  const convertedFromTransparent =
    info.hasTransparency && targetMime === "image/jpeg";

  // 3. Load image into memory
  const imgBitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image data"));
    };
    img.src = url;
  });

  // 4. Render on Canvas with proper transparency handling
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { alpha: targetMime !== "image/jpeg" });
  if (!ctx) {
    throw new Error("Could not initialize 2D rendering canvas.");
  }

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (targetMime === "image/jpeg") {
    // Fill white background to prevent transparent areas turning black
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(imgBitmap, 0, 0, targetWidth, targetHeight);

  // 5. Initial Quality calculation
  let qualityRatio = Math.max(0.1, Math.min(1.0, options.quality / 100));

  // 6. Encode to Blob
  let compressedBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to encode canvas to blob"));
      },
      targetMime,
      qualityRatio
    );
  });

  // 7. If target max size (KB) is specified and exceeded, attempt stepped optimization
  if (options.targetMaxKB && options.targetMaxKB > 0) {
    const targetBytes = options.targetMaxKB * 1024;
    let iterations = 0;
    while (compressedBlob.size > targetBytes && iterations < 5 && qualityRatio > 0.2) {
      iterations++;
      qualityRatio = Math.max(0.15, qualityRatio * 0.8);
      // Re-encode at lower quality
      const nextBlob: Blob | null = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), targetMime, qualityRatio);
      });
      if (nextBlob) {
        compressedBlob = nextBlob;
      }
    }
  }

  // 8. If browser-image-compression can provide further lossless optimization on JPEG/PNG
  try {
    if (options.targetMaxKB && compressedBlob.size > options.targetMaxKB * 1024) {
      const intermediateFile = new File([compressedBlob], file.name, { type: targetMime });
      const furtherOptimized = await imageCompression(intermediateFile, {
        maxSizeMB: options.targetMaxKB / 1024,
        useWebWorker: false,
        alwaysKeepResolution: true,
        fileType: targetMime,
        initialQuality: qualityRatio,
      });
      if (furtherOptimized && furtherOptimized.size < compressedBlob.size) {
        compressedBlob = furtherOptimized;
      }
    }
  } catch {
    // Fall back to canvas blob if library optimization fails
  }

  // 9. Metrics and reduction calculation
  const originalSize = file.size;
  const compressedSize = compressedBlob.size;
  const savedBytes = originalSize > compressedSize ? originalSize - compressedSize : 0;
  const reductionPercentage = Math.round(
    ((originalSize - compressedSize) / originalSize) * 100
  );
  const isSmaller = compressedSize < originalSize;

  const originalBase = file.name.replace(/\.[^/.]+$/, "");
  const compressedName = `${originalBase}-compressed.${targetExt}`;

  const compressedPreviewUrl = URL.createObjectURL(compressedBlob);
  const downloadUrl = compressedPreviewUrl;

  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    originalFile: file,
    originalName: file.name,
    originalSize,
    originalFormattedSize: formatBytes(originalSize),
    originalWidth,
    originalHeight,
    originalPreviewUrl,

    compressedBlob,
    compressedName,
    compressedSize,
    compressedFormattedSize: formatBytes(compressedSize),
    compressedWidth: targetWidth,
    compressedHeight: targetHeight,
    compressedPreviewUrl,
    downloadUrl,

    outputFormat: targetExt.toUpperCase(),
    savedBytes,
    reductionPercentage,
    isSmaller,
    hasTransparency: info.hasTransparency,
    convertedFromTransparent,
  };
}

/**
 * Batch compress multiple image files with live progress and optional ZIP bundling.
 */
export async function compressImageBatch(
  files: File[],
  options: ImageCompressionOptions,
  inspections?: Map<string, ImageInspection>
): Promise<ImageCompressionBatchResult> {
  if (files.length === 0) {
    throw new Error("No image files provided for compression.");
  }

  const items: CompressedImageItem[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const currentPercent = Math.round((i / total) * 90);
    options.onProgress?.(
      currentPercent,
      i + 1,
      total,
      `Compressing image ${i + 1} of ${total}: ${file.name}`
    );

    // Yield control to UI thread so progress updates smoothly
    await new Promise((resolve) => setTimeout(resolve, 30));

    const inspection = inspections?.get(file.name);
    const compressedItem = await compressSingleImage(file, options, inspection);
    items.push(compressedItem);
  }

  options.onProgress?.(92, total, total, "Calculating compression results...");

  const totalOriginalSize = items.reduce((acc, it) => acc + it.originalSize, 0);
  const totalCompressedSize = items.reduce((acc, it) => acc + it.compressedSize, 0);
  const totalSavedBytes =
    totalOriginalSize > totalCompressedSize ? totalOriginalSize - totalCompressedSize : 0;
  const totalReductionPercentage =
    totalOriginalSize > 0
      ? Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100)
      : 0;
  const isOverallSmaller = totalCompressedSize < totalOriginalSize;

  // Bundle into ZIP if more than 1 image
  let zipBlob: Blob | undefined;
  let zipUrl: string | undefined;
  let zipFileName: string | undefined;

  if (items.length > 1) {
    options.onProgress?.(95, total, total, "Creating ZIP archive...");
    const zip = new JSZip();

    // Prevent duplicate filenames in ZIP
    const nameCounts = new Map<string, number>();

    for (const item of items) {
      let fileName = item.compressedName;
      if (nameCounts.has(fileName)) {
        const count = nameCounts.get(fileName)! + 1;
        nameCounts.set(fileName, count);
        const parts = fileName.split(".");
        const ext = parts.pop();
        fileName = `${parts.join(".")}_(${count}).${ext}`;
      } else {
        nameCounts.set(fileName, 1);
      }
      zip.file(fileName, item.compressedBlob);
    }

    zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    zipUrl = URL.createObjectURL(zipBlob);
    zipFileName = "compressed-images.zip";
  }

  options.onProgress?.(100, total, total, "Compression completed!");

  return {
    items,
    totalOriginalSize,
    totalCompressedSize,
    totalSavedBytes,
    totalReductionPercentage,
    isOverallSmaller,
    zipBlob,
    zipUrl,
    zipFileName,
  };
}
