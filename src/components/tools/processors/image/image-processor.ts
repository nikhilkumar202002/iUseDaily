import type { ImageProcessingOptions, ProcessingResult } from "../../shared/types";
import { formatBytes } from "../other/other-utils";

/**
 * Get natural width and height of an image file
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Compress, resize, or convert an image in the browser using HTMLCanvasElement
 */
export async function processImage(
  file: File,
  options: ImageProcessingOptions
): Promise<ProcessingResult> {
  const { outputFormat, quality, width, height, maintainAspectRatio } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let targetWidth = width || img.naturalWidth;
        let targetHeight = height || img.naturalHeight;

        if (maintainAspectRatio && (width || height)) {
          const ratio = img.naturalWidth / img.naturalHeight;
          if (width && !height) {
            targetHeight = Math.round(width / ratio);
          } else if (height && !width) {
            targetWidth = Math.round(height * ratio);
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas 2D context"));
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const mimeType =
          outputFormat === "original"
            ? file.type || "image/jpeg"
            : outputFormat;

        const qualityFactor = Math.max(0.1, Math.min(1.0, quality / 100));

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to encode image from canvas"));
              return;
            }

            const downloadUrl = URL.createObjectURL(blob);
            const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
            const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
            const finalName = `${baseName}_processed.${ext}`;

            resolve({
              fileName: finalName,
              fileSize: blob.size,
              formattedSize: formatBytes(blob.size),
              downloadUrl,
              previewUrl: downloadUrl,
              meta: {
                width: targetWidth,
                height: targetHeight,
                format: mimeType,
              },
            });
          },
          mimeType,
          qualityFactor
        );
      };
      img.onerror = () => reject(new Error("Failed to load image for processing"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}
