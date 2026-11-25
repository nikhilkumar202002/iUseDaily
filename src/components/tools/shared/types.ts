import type { LucideIcon } from "lucide-react";

export type FileStatus = "reading" | "ready" | "processing" | "error";

export interface ToolFile {
  id: string;
  file: File;
  name: string;
  size: number;
  formattedSize: string;
  extension: string;
  type: string;
  status: FileStatus;
  error?: string;
  pageCount?: number;
  dimensions?: { width: number; height: number };
  previewUrl?: string;
}

export type ProcessingStatus = "idle" | "processing" | "success" | "error";

export interface ProcessingState {
  status: ProcessingStatus;
  progress?: number; // 0 to 100, undefined if indeterminate
  statusMessage?: string;
  error?: string;
}

export interface SplitOutputFile {
  name: string;
  size: number;
  formattedSize: string;
  pageCount: number;
  downloadUrl: string;
}

export interface ProcessingResult {
  fileName: string;
  fileSize: number;
  formattedSize: string;
  originalSize?: number;
  savedBytes?: number;
  reductionPercentage?: number;
  isSmaller?: boolean;
  downloadUrl?: string;
  textOutput?: string;
  previewUrl?: string;
  itemCount?: number;
  pageCount?: number;
  zipUrl?: string;
  zipFileName?: string;
  outputFiles?: SplitOutputFile[];
  meta?: Record<string, string | number | boolean>;
}

export interface PdfProcessingOptions {
  outputFilename: string;
  includeBookmarks?: boolean;
  pageRange?: string;
  compressionLevel?: "none" | "low" | "medium" | "high";
}

export interface ImageProcessingOptions {
  outputFormat: "original" | "image/png" | "image/jpeg" | "image/webp";
  quality: number; // 1 - 100
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
}

export interface InstructionStep {
  step: number;
  title: string;
  description: string;
}

export interface ToolFeature {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export interface FaqItem {
  question: string;
  answer: string;
}
