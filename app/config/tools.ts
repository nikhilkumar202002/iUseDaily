
import {
  FileText,
  FileImage,
  Type,
  Calculator,
  QrCode,
  ShieldCheck,
  Files,
  Image,
  Scissors,
  RefreshCw,
  RotateCw,
  FileOutput,
  FileInput,
  FileLock,
  FilePlus,
  FileMinus,
  FilePenLine,
  CaseSensitive,
  Copy,
  GitCompare,
  CalendarDays,
  Percent,
  Cake,
  Scale,
  Tag,
  Receipt,
  Wallet,
  Clock,
  KeyRound,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory =
  | "PDF"
  | "Image"
  | "Text"
  | "Calculators"
  | "Other";

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  href: string;
  icon: LucideIcon;
  popular?: boolean;
  featured?: boolean;
}

export const categories = [
  {
    id: "all",
    name: "All Tools",
    icon: Files,
  },
  {
    id: "PDF",
    name: "PDF Tools",
    icon: FileText,
  },
  {
    id: "Image",
    name: "Image Tools",
    icon: FileImage,
  },
  {
    id: "Text",
    name: "Text Tools",
    icon: Type,
  },
  {
    id: "Calculators",
    name: "Calculators",
    icon: Calculator,
  },
  {
    id: "Other",
    name: "Other Tools",
    icon: QrCode,
  },
] as const;

export const tools: Tool[] = [
  // PDF TOOLS
  {
    id: "pdf-merge",
    name: "Merge PDF",
    description: "Combine multiple PDF files into one document.",
    category: "PDF",
    href: "/tools/pdf/merge",
    icon: Files,
    popular: true,
    featured: true,
  },
  {
    id: "pdf-split",
    name: "Split PDF",
    description: "Separate pages from a PDF document.",
    category: "PDF",
    href: "/tools/pdf/split",
    icon: Scissors,
  },
  {
    id: "pdf-compress",
    name: "Compress PDF",
    description: "Reduce PDF file size with ease.",
    category: "PDF",
    href: "/tools/pdf/compress",
    icon: FileMinus,
    popular: true,
  },
  {
    id: "pdf-rotate",
    name: "Rotate PDF",
    description: "Rotate PDF pages to the correct orientation.",
    category: "PDF",
    href: "/tools/pdf/rotate",
    icon: RotateCw,
  },
  {
    id: "pdf-to-image",
    name: "PDF to Image",
    description: "Convert PDF pages into image files.",
    category: "PDF",
    href: "/tools/pdf/to-image",
    icon: FileImage,
  },
  {
    id: "image-to-pdf",
    name: "Image to PDF",
    description: "Turn your images into a PDF document.",
    category: "PDF",
    href: "/tools/pdf/from-image",
    icon: FilePlus,
  },
  {
    id: "pdf-to-text",
    name: "PDF to Text",
    description: "Extract readable text from PDF files.",
    category: "PDF",
    href: "/tools/pdf/to-text",
    icon: FileOutput,
  },
  {
    id: "pdf-protect",
    name: "Protect PDF",
    description: "Add password protection to your PDF.",
    category: "PDF",
    href: "/tools/pdf/protect",
    icon: FileLock,
  },

  // IMAGE TOOLS
  {
    id: "image-compress",
    name: "Image Compressor",
    description: "Reduce image size while preserving quality.",
    category: "Image",
    href: "/tools/image/compress",
    icon: FileImage,
    popular: true,
    featured: true,
  },
  {
    id: "image-resize",
    name: "Image Resizer",
    description: "Resize images to your preferred dimensions.",
    category: "Image",
    href: "/tools/image/resize",
    icon: Image,
  },
  {
    id: "image-crop",
    name: "Image Cropper",
    description: "Crop images to the perfect dimensions.",
    category: "Image",
    href: "/tools/image/crop",
    icon: Scissors,
  },
  {
    id: "image-convert",
    name: "Image Converter",
    description: "Convert images between popular formats.",
    category: "Image",
    href: "/tools/image/convert",
    icon: RefreshCw,
  },
  {
    id: "image-rotate",
    name: "Image Rotator",
    description: "Rotate and flip your images.",
    category: "Image",
    href: "/tools/image/rotate",
    icon: RotateCw,
  },
  {
    id: "image-base64",
    name: "Image to Base64",
    description: "Convert images into Base64 encoded text.",
    category: "Image",
    href: "/tools/image/base64",
    icon: FileInput,
  },

  // TEXT TOOLS
  {
    id: "word-counter",
    name: "Word Counter",
    description: "Count words, characters and sentences.",
    category: "Text",
    href: "/tools/text/word-counter",
    icon: Type,
    popular: true,
    featured: true,
  },
  {
    id: "character-counter",
    name: "Character Counter",
    description: "Count characters with and without spaces.",
    category: "Text",
    href: "/tools/text/character-counter",
    icon: FileText,
  },
  {
    id: "case-converter",
    name: "Case Converter",
    description: "Change text to uppercase, lowercase and more.",
    category: "Text",
    href: "/tools/text/case-converter",
    icon: CaseSensitive,
  },
  {
    id: "duplicate-lines",
    name: "Remove Duplicate Lines",
    description: "Find and remove repeated lines from text.",
    category: "Text",
    href: "/tools/text/remove-duplicates",
    icon: Copy,
  },
  {
    id: "text-compare",
    name: "Text Compare",
    description: "Compare two text documents side by side.",
    category: "Text",
    href: "/tools/text/compare",
    icon: GitCompare,
  },
  {
    id: "lorem-ipsum",
    name: "Lorem Ipsum Generator",
    description: "Generate placeholder text for your projects.",
    category: "Text",
    href: "/tools/text/lorem-ipsum",
    icon: FilePenLine,
  },

  // CALCULATORS
  {
    id: "percentage",
    name: "Percentage Calculator",
    description: "Calculate percentages quickly and easily.",
    category: "Calculators",
    href: "/tools/calculators/percentage",
    icon: Percent,
    popular: true,
  },
  {
    id: "age",
    name: "Age Calculator",
    description: "Calculate your exact age from your birth date.",
    category: "Calculators",
    href: "/tools/calculators/age",
    icon: Cake,
  },
  {
    id: "bmi",
    name: "BMI Calculator",
    description: "Calculate your body mass index.",
    category: "Calculators",
    href: "/tools/calculators/bmi",
    icon: Scale,
  },
  {
    id: "discount",
    name: "Discount Calculator",
    description: "Calculate discounts and final prices.",
    category: "Calculators",
    href: "/tools/calculators/discount",
    icon: Tag,
  },
  {
    id: "gst",
    name: "GST Calculator",
    description: "Calculate GST amounts and totals.",
    category: "Calculators",
    href: "/tools/calculators/gst",
    icon: Receipt,
  },
  {
    id: "loan-emi",
    name: "Loan EMI Calculator",
    description: "Estimate monthly loan repayments.",
    category: "Calculators",
    href: "/tools/calculators/loan-emi",
    icon: Wallet,
  },
  {
    id: "date-difference",
    name: "Date Difference Calculator",
    description: "Find the duration between two dates.",
    category: "Calculators",
    href: "/tools/calculators/date-difference",
    icon: CalendarDays,
  },

  // OTHER TOOLS
  {
    id: "qr-generator",
    name: "QR Code Generator",
    description: "Create QR codes from text or website links.",
    category: "Other",
    href: "/tools/other/qr-generator",
    icon: QrCode,
    popular: true,
  },
  {
    id: "password-generator",
    name: "Password Generator",
    description: "Generate secure random passwords.",
    category: "Other",
    href: "/tools/other/password-generator",
    icon: ShieldCheck,
  },
  {
    id: "time-converter",
    name: "Time Converter",
    description: "Convert time between different time zones.",
    category: "Other",
    href: "/tools/other/time-converter",
    icon: Clock,
  },
  {
    id: "password-checker",
    name: "Password Strength Checker",
    description: "Check the strength of a password.",
    category: "Other",
    href: "/tools/other/password-checker",
    icon: KeyRound,
  },
];
