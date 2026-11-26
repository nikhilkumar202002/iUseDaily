import JSZip from "jszip";
import { formatBytes } from "../other/other-utils";
import { inspectImageFile, type ImageInspection } from "./compress-image";

export interface ImageTransformSettings {
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface RotateImageOptions {
  transforms: ImageTransformSettings;
  outputFormat: "original" | "image/png" | "image/jpeg" | "image/webp";
  quality?: number; // 10 to 100
  backgroundColor?: string; // used for JPEG (default "#FFFFFF")
  outputFilename?: string;
  onProgress?: (
    percent: number,
    currentIndex: number,
    totalCount: number,
    statusMessage: string
  ) => void;
}

export interface RotatedImageItem {
  id: string;
  originalFile: File;
  originalName: string;
  originalFormat: string;
  originalSize: number;
  originalFormattedSize: string;
  originalWidth: number;
  originalHeight: number;
  originalPreviewUrl: string;

  rotatedBlob: Blob;
  rotatedName: string;
  rotatedFormat: string;
  rotatedMimeType: string;
  rotatedSize: number;
  rotatedFormattedSize: string;
  rotatedWidth: number;
  rotatedHeight: number;
  rotatedPreviewUrl: string;
  downloadUrl: string;

  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;

  hasTransparency: boolean;
  convertedFromTransparent: boolean;
}

export interface ImageRotateBatchResult {
  items: RotatedImageItem[];
  totalOriginalSize: number;
  totalRotatedSize: number;
  zipBlob?: Blob;
  zipUrl?: string;
  zipFileName?: string;
}

/**
 * Calculate final pixel dimensions after applying 90/180/270 degree rotation
 */
export function calculateRotatedDimensions(
  origW: number,
  origH: number,
  rotation: number
): { width: number; height: number } {
  const normRot = ((rotation % 360) + 360) % 360;
  if (normRot === 90 || normRot === 270) {
    return { width: origH, height: origW };
  }
  return { width: origW, height: origH };
}

/**
 * Transform a single image using the HTML5 Canvas API with composable rotation and flipping
 */
export async function rotateSingleImage(
  file: File,
  options: RotateImageOptions,
  inspection?: ImageInspection
): Promise<RotatedImageItem> {
  const info = inspection || (await inspectImageFile(file));
  if (!info.isValid) {
    throw new Error(info.error || "The image file could not be read.");
  }

  const {
    transforms,
    outputFormat = "original",
    quality = 92,
    backgroundColor = "#FFFFFF",
    outputFilename,
  } = options;

  const originalPreviewUrl = URL.createObjectURL(file);
  const origW = info.width;
  const origH = info.height;

  const normRot = ((transforms.rotation % 360) + 360) % 360;
  const { width: targetW, height: targetH } = calculateRotatedDimensions(
    origW,
    origH,
    normRot
  );

  // 1. Determine target format and MIME type
  let targetMime: string;
  let targetExt: string;

  if (outputFormat === "original") {
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
    targetMime = outputFormat;
    targetExt =
      targetMime === "image/png"
        ? "png"
        : targetMime === "image/webp"
        ? "webp"
        : "jpg";
  }

  const convertedFromTransparent =
    info.hasTransparency && targetMime === "image/jpeg";

  // 2. Load original image into an HTMLImageElement
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

  // 3. Create Canvas with rotated dimensions
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d", { alpha: targetMime !== "image/jpeg" });
  if (!ctx) {
    throw new Error("Could not initialize 2D canvas rendering context.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Background color handling
  if (targetMime === "image/jpeg") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, targetW, targetH);
  } else {
    ctx.clearRect(0, 0, targetW, targetH);
  }

  // 4. Apply combined rotation and flip matrix around canvas center
  ctx.save();
  ctx.translate(targetW / 2, targetH / 2);
  ctx.rotate((normRot * Math.PI) / 180);
  ctx.scale(
    transforms.flipHorizontal ? -1 : 1,
    transforms.flipVertical ? -1 : 1
  );

  // Draw image centered relative to its original dimensions
  ctx.drawImage(img, -origW / 2, -origH / 2);
  ctx.restore();

  // 5. Encode canvas to Blob
  const qualityFactor = Math.max(0.1, Math.min(1.0, quality / 100));
  const rotatedBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to export image as ${targetMime}`));
          return;
        }
        resolve(blob);
      },
      targetMime,
      qualityFactor
    );
  });

  const originalBase = file.name.replace(/\.[^/.]+$/, "");
  const defaultName = `${originalBase}_rotated.${targetExt}`;
  const finalName = outputFilename
    ? outputFilename.toLowerCase().endsWith(`.${targetExt}`)
      ? outputFilename
      : `${outputFilename}.${targetExt}`
    : defaultName;

  const rotatedPreviewUrl = URL.createObjectURL(rotatedBlob);
  const downloadUrl = rotatedPreviewUrl;

  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    originalFile: file,
    originalName: file.name,
    originalFormat: file.name.split(".").pop()?.toUpperCase() || "IMAGE",
    originalSize: file.size,
    originalFormattedSize: formatBytes(file.size),
    originalWidth: origW,
    originalHeight: origH,
    originalPreviewUrl,

    rotatedBlob,
    rotatedName: finalName,
    rotatedFormat: targetExt.toUpperCase(),
    rotatedMimeType: rotatedBlob.type || targetMime,
    rotatedSize: rotatedBlob.size,
    rotatedFormattedSize: formatBytes(rotatedBlob.size),
    rotatedWidth: targetW,
    rotatedHeight: targetH,
    rotatedPreviewUrl,
    downloadUrl,

    rotation: normRot,
    flipHorizontal: transforms.flipHorizontal,
    flipVertical: transforms.flipVertical,

    hasTransparency: info.hasTransparency,
    convertedFromTransparent,
  };
}

/**
 * Batch rotate and flip multiple images with per-image settings and ZIP archive bundling
 */
export async function rotateImageBatch(
  files: File[],
  perImageSettings: Map<string, ImageTransformSettings>,
  defaultOptions: Omit<RotateImageOptions, "transforms">,
  inspections?: Map<string, ImageInspection>
): Promise<ImageRotateBatchResult> {
  if (files.length === 0) {
    throw new Error("No image files provided for rotation.");
  }

  const items: RotatedImageItem[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const currentPercent = Math.round((i / total) * 90);
    defaultOptions.onProgress?.(
      currentPercent,
      i + 1,
      total,
      `Transforming image ${i + 1} of ${total}: ${file.name}`
    );

    // Yield control to UI thread
    await new Promise((resolve) => setTimeout(resolve, 30));

    const transforms = perImageSettings.get(file.name) || {
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    };

    const inspection = inspections?.get(file.name);
    const item = await rotateSingleImage(
      file,
      {
        ...defaultOptions,
        transforms,
      },
      inspection
    );
    items.push(item);
  }

  defaultOptions.onProgress?.(92, total, total, "Packaging transformed images...");

  const totalOriginalSize = items.reduce((acc, it) => acc + it.originalSize, 0);
  const totalRotatedSize = items.reduce((acc, it) => acc + it.rotatedSize, 0);

  let zipBlob: Blob | undefined;
  let zipUrl: string | undefined;
  let zipFileName: string | undefined;

  if (items.length > 1) {
    defaultOptions.onProgress?.(95, total, total, "Creating ZIP archive...");
    const zip = new JSZip();

    const nameCounts = new Map<string, number>();

    for (const item of items) {
      let fileName = item.rotatedName;
      if (nameCounts.has(fileName)) {
        const count = nameCounts.get(fileName)! + 1;
        nameCounts.set(fileName, count);
        const parts = fileName.split(".");
        const ext = parts.pop();
        fileName = `${parts.join(".")}_(${count}).${ext}`;
      } else {
        nameCounts.set(fileName, 1);
      }
      zip.file(fileName, item.rotatedBlob);
    }

    zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    zipUrl = URL.createObjectURL(zipBlob);
    zipFileName = "rotated-images.zip";
  }

  defaultOptions.onProgress?.(100, total, total, "Transformation complete!");

  return {
    items,
    totalOriginalSize,
    totalRotatedSize,
    zipBlob,
    zipUrl,
    zipFileName,
  };
}
