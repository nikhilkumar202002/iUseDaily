import { formatBytes } from "../other/other-utils";
import { inspectImageFile, type ImageInspection } from "./compress-image";

export interface CropAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageCropOptions {
  cropAreaPixels: CropAreaPixels;
  rotation?: number;
  outputFormat: "image/png" | "image/jpeg" | "image/webp";
  quality?: number; // 10 to 100
  backgroundColor?: string; // used for JPEG (e.g. "#FFFFFF")
  outputFilename?: string;
}

export interface CroppedImageResult {
  fileName: string;
  blob: Blob;
  downloadUrl: string;
  previewUrl: string;
  fileSize: number;
  formattedSize: string;
  width: number;
  height: number;
  format: string;
  hasTransparency: boolean;
  convertedFromTransparent: boolean;
}

export interface AspectRatioOption {
  id: string;
  label: string;
  value?: number; // undefined for Free
  description: string;
}

export const ASPECT_RATIO_PRESETS: AspectRatioOption[] = [
  { id: "free", label: "Free", value: undefined, description: "Unrestricted selection" },
  { id: "1-1", label: "1:1", value: 1, description: "Square (Profile, Post)" },
  { id: "4-3", label: "4:3", value: 4 / 3, description: "Standard photo format" },
  { id: "3-2", label: "3:2", value: 3 / 2, description: "Classic 35mm photography" },
  { id: "16-9", label: "16:9", value: 16 / 9, description: "Widescreen / Video" },
  { id: "9-16", label: "9:16", value: 9 / 16, description: "Stories & Reels vertical" },
];

/**
 * Load HTMLImageElement from a File safely
 */
export async function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to read image data for "${file.name}"`));
    };
    img.src = url;
  });
}

/**
 * Extract cropped pixel region from image using HTML5 Canvas API with support for rotation and transparency.
 */
export async function cropImageFile(
  file: File,
  options: ImageCropOptions,
  inspection?: ImageInspection
): Promise<CroppedImageResult> {
  const info = inspection || (await inspectImageFile(file));
  if (!info.isValid) {
    throw new Error(info.error || "The image file could not be read.");
  }

  const {
    cropAreaPixels,
    rotation = 0,
    outputFormat,
    quality = 90,
    backgroundColor = "#FFFFFF",
    outputFilename,
  } = options;

  if (cropAreaPixels.width <= 0 || cropAreaPixels.height <= 0) {
    throw new Error("Invalid crop area dimensions.");
  }

  const img = await loadImageElement(file);

  // 1. Create a bounding canvas to apply rotation if rotation != 0
  const rotRad = (rotation * Math.PI) / 180;
  const bBoxWidth =
    Math.abs(Math.cos(rotRad) * img.naturalWidth) +
    Math.abs(Math.sin(rotRad) * img.naturalHeight);
  const bBoxHeight =
    Math.abs(Math.sin(rotRad) * img.naturalWidth) +
    Math.abs(Math.cos(rotRad) * img.naturalHeight);

  const rotCanvas = document.createElement("canvas");
  rotCanvas.width = Math.round(bBoxWidth);
  rotCanvas.height = Math.round(bBoxHeight);
  const rotCtx = rotCanvas.getContext("2d", { alpha: true });
  if (!rotCtx) {
    throw new Error("Failed to initialize rotation canvas context.");
  }

  // Draw image centered and rotated
  rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
  rotCtx.rotate(rotRad);
  rotCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  // 2. Crop the exact pixel region into final canvas
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = Math.max(1, Math.round(cropAreaPixels.width));
  finalCanvas.height = Math.max(1, Math.round(cropAreaPixels.height));
  const finalCtx = finalCanvas.getContext("2d", {
    alpha: outputFormat !== "image/jpeg",
  });
  if (!finalCtx) {
    throw new Error("Failed to initialize crop canvas context.");
  }

  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = "high";

  // Fill background for JPEG
  const convertedFromTransparent =
    info.hasTransparency && outputFormat === "image/jpeg";

  if (outputFormat === "image/jpeg") {
    finalCtx.fillStyle = backgroundColor;
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  } else {
    finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
  }

  finalCtx.drawImage(
    rotCanvas,
    cropAreaPixels.x,
    cropAreaPixels.y,
    cropAreaPixels.width,
    cropAreaPixels.height,
    0,
    0,
    finalCanvas.width,
    finalCanvas.height
  );

  // 3. Encode to Blob
  const qualityFactor = Math.max(0.1, Math.min(1.0, quality / 100));
  const blob: Blob = await new Promise((resolve, reject) => {
    finalCanvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to encode cropped image to blob."));
      },
      outputFormat,
      qualityFactor
    );
  });

  const targetExt =
    outputFormat === "image/png"
      ? "png"
      : outputFormat === "image/webp"
      ? "webp"
      : "jpg";

  const originalBase = file.name.replace(/\.[^/.]+$/, "");
  const defaultName = `${originalBase}_cropped_${finalCanvas.width}x${finalCanvas.height}.${targetExt}`;
  const finalName = outputFilename
    ? outputFilename.toLowerCase().endsWith(`.${targetExt}`)
      ? outputFilename
      : `${outputFilename}.${targetExt}`
    : defaultName;

  const previewUrl = URL.createObjectURL(blob);
  const downloadUrl = previewUrl;

  return {
    fileName: finalName,
    blob,
    downloadUrl,
    previewUrl,
    fileSize: blob.size,
    formattedSize: formatBytes(blob.size),
    width: finalCanvas.width,
    height: finalCanvas.height,
    format: targetExt.toUpperCase(),
    hasTransparency: info.hasTransparency,
    convertedFromTransparent,
  };
}
