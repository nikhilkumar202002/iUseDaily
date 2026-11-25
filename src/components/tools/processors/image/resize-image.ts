import JSZip from "jszip";
import { formatBytes } from "../other/other-utils";
import { inspectImageFile, type ImageInspection } from "./compress-image";
import { RESIZE_PRESETS } from "./resize-presets";

export const MAX_CANVAS_DIMENSION = 16384;

export type ResizeMode = "custom" | "percentage" | "preset";
export type FitStrategy = "fit" | "cover" | "stretch";

export interface ImageResizeOptions {
  mode: ResizeMode;

  // Custom mode
  customWidth?: number;
  customHeight?: number;
  maintainAspectRatio: boolean;
  fitStrategy?: FitStrategy;

  // Percentage mode
  percentage?: number;

  // Preset mode
  presetId?: string;

  // Encoding & Quality
  outputFormat: "original" | "image/jpeg" | "image/png" | "image/webp";
  quality: number; // 10 to 100

  onProgress?: (
    percent: number,
    currentIndex: number,
    totalCount: number,
    statusMessage: string
  ) => void;
}

export interface ResizedImageItem {
  id: string;
  originalFile: File;
  originalName: string;
  originalSize: number;
  originalFormattedSize: string;
  originalWidth: number;
  originalHeight: number;
  originalPreviewUrl: string;

  resizedBlob: Blob;
  resizedName: string;
  resizedSize: number;
  resizedFormattedSize: string;
  resizedWidth: number;
  resizedHeight: number;
  resizedPreviewUrl: string;
  downloadUrl: string;

  outputFormat: string;
  hasTransparency: boolean;
  convertedFromTransparent: boolean;
}

export interface ImageResizeBatchResult {
  items: ResizedImageItem[];
  totalOriginalSize: number;
  totalResizedSize: number;
  zipBlob?: Blob;
  zipUrl?: string;
  zipFileName?: string;
}

interface DimensionPlan {
  canvasWidth: number;
  canvasHeight: number;
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  destX: number;
  destY: number;
  destWidth: number;
  destHeight: number;
}

/**
 * Compute the exact canvas coordinates and dimensions for resizing without distortion.
 */
export function calculateResizeDimensions(
  origW: number,
  origH: number,
  options: ImageResizeOptions
): DimensionPlan {
  if (origW <= 0 || origH <= 0) {
    throw new Error("Invalid original image dimensions.");
  }

  const { mode, fitStrategy = "fit" } = options;

  // 1. Percentage Mode
  if (mode === "percentage") {
    const pct = options.percentage || 100;
    if (pct <= 0 || pct > 1000) {
      throw new Error("Percentage must be between 1% and 1000%.");
    }
    const scale = pct / 100;
    const targetW = Math.max(1, Math.round(origW * scale));
    const targetH = Math.max(1, Math.round(origH * scale));

    if (targetW > MAX_CANVAS_DIMENSION || targetH > MAX_CANVAS_DIMENSION) {
      throw new Error(
        `Resulting dimensions (${targetW}×${targetH}) exceed the maximum browser limit of ${MAX_CANVAS_DIMENSION} px.`
      );
    }

    return {
      canvasWidth: targetW,
      canvasHeight: targetH,
      sourceX: 0,
      sourceY: 0,
      sourceWidth: origW,
      sourceHeight: origH,
      destX: 0,
      destY: 0,
      destWidth: targetW,
      destHeight: targetH,
    };
  }

  // 2. Preset Mode
  if (mode === "preset") {
    const preset =
      RESIZE_PRESETS.find((p) => p.id === options.presetId) || RESIZE_PRESETS[0];
    const targetW = preset.width;
    const targetH = preset.height;

    if (fitStrategy === "cover") {
      // Scale to fill and center-crop
      const scale = Math.max(targetW / origW, targetH / origH);
      const cropW = targetW / scale;
      const cropH = targetH / scale;
      const cropX = (origW - cropW) / 2;
      const cropY = (origH - cropH) / 2;

      return {
        canvasWidth: targetW,
        canvasHeight: targetH,
        sourceX: cropX,
        sourceY: cropY,
        sourceWidth: cropW,
        sourceHeight: cropH,
        destX: 0,
        destY: 0,
        destWidth: targetW,
        destHeight: targetH,
      };
    } else if (fitStrategy === "stretch") {
      return {
        canvasWidth: targetW,
        canvasHeight: targetH,
        sourceX: 0,
        sourceY: 0,
        sourceWidth: origW,
        sourceHeight: origH,
        destX: 0,
        destY: 0,
        destWidth: targetW,
        destHeight: targetH,
      };
    } else {
      // Fit (contain): scale proportionally to fit inside target box
      const scale = Math.min(targetW / origW, targetH / origH);
      const finalW = Math.max(1, Math.round(origW * scale));
      const finalH = Math.max(1, Math.round(origH * scale));

      return {
        canvasWidth: finalW,
        canvasHeight: finalH,
        sourceX: 0,
        sourceY: 0,
        sourceWidth: origW,
        sourceHeight: origH,
        destX: 0,
        destY: 0,
        destWidth: finalW,
        destHeight: finalH,
      };
    }
  }

  // 3. Custom Dimensions Mode
  const reqW = options.customWidth && options.customWidth > 0 ? options.customWidth : null;
  const reqH = options.customHeight && options.customHeight > 0 ? options.customHeight : null;

  if (!reqW && !reqH) {
    throw new Error("Please specify at least a width or a height in pixels.");
  }

  let finalW = origW;
  let finalH = origH;

  if (options.maintainAspectRatio) {
    const aspectRatio = origW / origH;

    if (reqW && !reqH) {
      finalW = reqW;
      finalH = Math.max(1, Math.round(reqW / aspectRatio));
    } else if (reqH && !reqW) {
      finalH = reqH;
      finalW = Math.max(1, Math.round(reqH * aspectRatio));
    } else if (reqW && reqH) {
      if (fitStrategy === "cover") {
        const scale = Math.max(reqW / origW, reqH / origH);
        const cropW = reqW / scale;
        const cropH = reqH / scale;
        const cropX = (origW - cropW) / 2;
        const cropY = (origH - cropH) / 2;

        return {
          canvasWidth: reqW,
          canvasHeight: reqH,
          sourceX: cropX,
          sourceY: cropY,
          sourceWidth: cropW,
          sourceHeight: cropH,
          destX: 0,
          destY: 0,
          destWidth: reqW,
          destHeight: reqH,
        };
      } else if (fitStrategy === "stretch") {
        finalW = reqW;
        finalH = reqH;
      } else {
        // Fit within bounding box
        const scale = Math.min(reqW / origW, reqH / origH);
        finalW = Math.max(1, Math.round(origW * scale));
        finalH = Math.max(1, Math.round(origH * scale));
      }
    }
  } else {
    finalW = reqW || origW;
    finalH = reqH || origH;
  }

  if (finalW > MAX_CANVAS_DIMENSION || finalH > MAX_CANVAS_DIMENSION) {
    throw new Error(
      `Requested dimensions (${finalW}×${finalH}) exceed the maximum browser canvas limit of ${MAX_CANVAS_DIMENSION} px.`
    );
  }

  return {
    canvasWidth: finalW,
    canvasHeight: finalH,
    sourceX: 0,
    sourceY: 0,
    sourceWidth: origW,
    sourceHeight: origH,
    destX: 0,
    destY: 0,
    destWidth: finalW,
    destHeight: finalH,
  };
}

/**
 * Resize a single image using the HTML5 Canvas API.
 */
export async function resizeSingleImage(
  file: File,
  options: ImageResizeOptions,
  inspection?: ImageInspection
): Promise<ResizedImageItem> {
  const info = inspection || (await inspectImageFile(file));
  if (!info.isValid) {
    throw new Error(info.error || "The image file could not be read.");
  }

  const origW = info.width;
  const origH = info.height;
  const originalPreviewUrl = URL.createObjectURL(file);

  // 1. Calculate target coordinates and dimensions
  const plan = calculateResizeDimensions(origW, origH, options);

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

  // 3. Load image element
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const imageEl = new Image();
    const url = URL.createObjectURL(file);
    imageEl.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imageEl);
    };
    imageEl.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to decode image data for "${file.name}"`));
    };
    imageEl.src = url;
  });

  // 4. Create and draw on canvas
  const canvas = document.createElement("canvas");
  canvas.width = plan.canvasWidth;
  canvas.height = plan.canvasHeight;
  const ctx = canvas.getContext("2d", { alpha: targetMime !== "image/jpeg" });
  if (!ctx) {
    throw new Error("Could not initialize 2D rendering canvas context.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (targetMime === "image/jpeg") {
    // Fill solid white background so transparent PNGs don't develop black borders
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, plan.canvasWidth, plan.canvasHeight);
  } else {
    ctx.clearRect(0, 0, plan.canvasWidth, plan.canvasHeight);
  }

  ctx.drawImage(
    img,
    plan.sourceX,
    plan.sourceY,
    plan.sourceWidth,
    plan.sourceHeight,
    plan.destX,
    plan.destY,
    plan.destWidth,
    plan.destHeight
  );

  // 5. Encode canvas to Blob
  const qualityFactor = Math.max(0.1, Math.min(1.0, options.quality / 100));
  const resizedBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to encode canvas to blob"));
      },
      targetMime,
      qualityFactor
    );
  });

  const originalBase = file.name.replace(/\.[^/.]+$/, "");
  const resizedName = `${originalBase}_${plan.canvasWidth}x${plan.canvasHeight}.${targetExt}`;
  const resizedPreviewUrl = URL.createObjectURL(resizedBlob);
  const downloadUrl = resizedPreviewUrl;

  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    originalFile: file,
    originalName: file.name,
    originalSize: file.size,
    originalFormattedSize: formatBytes(file.size),
    originalWidth: origW,
    originalHeight: origH,
    originalPreviewUrl,

    resizedBlob,
    resizedName,
    resizedSize: resizedBlob.size,
    resizedFormattedSize: formatBytes(resizedBlob.size),
    resizedWidth: plan.canvasWidth,
    resizedHeight: plan.canvasHeight,
    resizedPreviewUrl,
    downloadUrl,

    outputFormat: targetExt.toUpperCase(),
    hasTransparency: info.hasTransparency,
    convertedFromTransparent,
  };
}

/**
 * Batch resize multiple images with live progress reporting and ZIP bundling.
 */
export async function resizeImageBatch(
  files: File[],
  options: ImageResizeOptions,
  inspections?: Map<string, ImageInspection>
): Promise<ImageResizeBatchResult> {
  if (files.length === 0) {
    throw new Error("No image files provided for resizing.");
  }

  const items: ResizedImageItem[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const currentPercent = Math.round((i / total) * 90);
    options.onProgress?.(
      currentPercent,
      i + 1,
      total,
      `Resizing image ${i + 1} of ${total}: ${file.name}`
    );

    // Yield control to UI thread
    await new Promise((resolve) => setTimeout(resolve, 30));

    const inspection = inspections?.get(file.name);
    const item = await resizeSingleImage(file, options, inspection);
    items.push(item);
  }

  options.onProgress?.(92, total, total, "Packaging resized images...");

  const totalOriginalSize = items.reduce((acc, it) => acc + it.originalSize, 0);
  const totalResizedSize = items.reduce((acc, it) => acc + it.resizedSize, 0);

  let zipBlob: Blob | undefined;
  let zipUrl: string | undefined;
  let zipFileName: string | undefined;

  if (items.length > 1) {
    options.onProgress?.(95, total, total, "Creating ZIP archive...");
    const zip = new JSZip();

    const nameCounts = new Map<string, number>();

    for (const item of items) {
      let fileName = item.resizedName;
      if (nameCounts.has(fileName)) {
        const count = nameCounts.get(fileName)! + 1;
        nameCounts.set(fileName, count);
        const parts = fileName.split(".");
        const ext = parts.pop();
        fileName = `${parts.join(".")}_(${count}).${ext}`;
      } else {
        nameCounts.set(fileName, 1);
      }
      zip.file(fileName, item.resizedBlob);
    }

    zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    zipUrl = URL.createObjectURL(zipBlob);
    zipFileName = "resized-images.zip";
  }

  options.onProgress?.(100, total, total, "Resizing complete!");

  return {
    items,
    totalOriginalSize,
    totalResizedSize,
    zipBlob,
    zipUrl,
    zipFileName,
  };
}
