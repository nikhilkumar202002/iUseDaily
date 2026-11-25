import type { LucideIcon } from "lucide-react";
import type { Tool, ToolCategory } from "@/app/config/tools";

export interface BreadcrumbItem {
  label: string;
  href?: string;
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

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  formattedSize: string;
  previewUrl?: string;
  pageCount?: number;
}

export interface ProcessingResult {
  fileName: string;
  fileSize: number;
  formattedSize: string;
  downloadUrl?: string;
  textOutput?: string;
  itemCount?: number;
}

export type ProcessingStatus = "idle" | "uploading" | "processing" | "success" | "error";

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  categoryHref: string;
  icon: LucideIcon;
  badge?: string;
  accept?: string;
  maxFiles?: number;
  maxFileSizeMB?: number;
  instructions: InstructionStep[];
  features: ToolFeature[];
  faqs: FaqItem[];
  privacyNote?: string;
  relatedTools?: Tool[];
}
