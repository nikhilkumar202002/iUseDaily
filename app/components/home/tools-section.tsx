"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileType,
  Image as ImageIcon,
  FileText,
  Calculator,
  ArrowRight,
  ArrowUpRight,
  Scissors,
  Layers,
  Code2,
} from "lucide-react";

type Category = "ALL" | "PDF" | "IMAGE" | "TEXT" | "CALCULATOR";

interface ToolItem {
  id: string;
  name: string;
  description: string;
  category: Category;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  href: string;
  tagline?: string;
}

const allTools: ToolItem[] = [
  {
    id: "pdf-converter",
    name: "Universal PDF Converter",
    description: "Convert Word, PowerPoint, Excel, and images to/from PDF with zero data loss.",
    category: "PDF",
    icon: FileType,
    badge: "Most Used",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    href: "/tools",
    tagline: "Ultra-fast client conversion",
  },
  {
    id: "image-compressor",
    name: "Lossless Image Compressor",
    description: "Shrink PNG, JPG, SVG and WebP file sizes by up to 85% without noticeable artifacting.",
    category: "IMAGE",
    icon: ImageIcon,
    badge: "Instant",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    href: "/tools",
    tagline: "Batch multi-file support",
  },
  {
    id: "ai-background-remover",
    name: "AI Background Remover",
    description: "One-click neural network portrait and product cutouts with crisp alpha transparency.",
    category: "IMAGE",
    icon: Scissors,
    badge: "AI Powered",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    href: "/tools",
    tagline: "Studio quality edges",
  },
  {
    id: "merge-split-pdf",
    name: "Merge, Split & Reorder PDF",
    description: "Combine fragmented PDF files into a single bundle or extract selected ranges in seconds.",
    category: "PDF",
    icon: Layers,
    badge: "Offline Ready",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    href: "/tools",
    tagline: "Visual page organizer",
  },
  {
    id: "word-character-counter",
    name: "Smart Word & Text Analyzer",
    description: "Inspect character density, reading level, keyword frequency, and estimated speaking duration.",
    category: "TEXT",
    icon: FileText,
    href: "/tools",
    tagline: "Real-time metrics",
  },
  {
    id: "json-formatter-validator",
    name: "JSON Formatter & Schema Validator",
    description: "Tree inspection, linting, prettifying, and minifying for complex JSON/YAML payloads.",
    category: "TEXT",
    icon: Code2,
    badge: "Dev Favorite",
    badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    href: "/tools",
    tagline: "Syntax highlighted output",
  },
  {
    id: "percentage-financial-calc",
    name: "Percentage & Margin Engine",
    description: "Quick calculations for markup, discounts, inflation compound interest, and VAT.",
    category: "CALCULATOR",
    icon: Calculator,
    href: "/tools",
    tagline: "Precise decimal accuracy",
  },
  {
    id: "unit-converter-pro",
    name: "Scientific Unit & Rate Converter",
    description: "Convert 200+ physical units, CSS rem/px values, data storage sizes, and live forex rates.",
    category: "CALCULATOR",
    icon: Calculator,
    href: "/tools",
    tagline: "Instant unit lookup",
  },
];

const categoryTabs: { label: string; value: Category; count: number }[] = [
  { label: "All Utilities", value: "ALL", count: 50 },
  { label: "PDF Suite", value: "PDF", count: 14 },
  { label: "Image Tools", value: "IMAGE", count: 12 },
  { label: "Text & Code", value: "TEXT", count: 16 },
  { label: "Calculators", value: "CALCULATOR", count: 8 },
];

export function ToolsSection() {
  const [activeCategory, setActiveCategory] = useState<Category>("ALL");

  const filteredTools =
    activeCategory === "ALL"
      ? allTools
      : allTools.filter((t) => t.category === activeCategory);

  return (
    <section className="relative border-y border-border bg-muted/30 py-24 sm:py-32">
      {/* Background glow accent */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header (Centered, Eyebrow Removed) */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            High-speed utility tools.
            <br />
            <span className="text-muted-foreground font-semibold">Zero installation. Zero waiting.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Built on WebAssembly and client-side processing. Your files never touch external servers,
            providing instantaneous speeds and enterprise-grade confidentiality.
          </p>
        </div>

        {/* Category Tabs (Centered) */}
        <div className="mt-10 flex flex-wrap justify-center gap-2 border-b border-border pb-5">
          {categoryTabs.map((tab) => {
            const isSelected = activeCategory === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveCategory(tab.value)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-foreground text-background shadow-md shadow-foreground/10"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tools Grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
              >
                <div>
                  {/* Top card row */}
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-blue text-primary transition-all duration-200 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/20">
                      <Icon className="h-6 w-6" />
                    </span>
                    {tool.badge && (
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                          tool.badgeColor || "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        {tool.badge}
                      </span>
                    )}
                  </div>

                  {/* Tool info */}
                  <div className="mt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {tool.tagline}
                    </p>
                    <h3 className="mt-1 text-base font-bold text-foreground transition-colors group-hover:text-primary">
                      {tool.name}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                </div>

                {/* Card footer CTA */}
                <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs font-semibold text-primary">
                  <span>Open utility</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Button below the cards (Centered) */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/tools"
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-muted"
          >
            <span>Explore all 50+ tools</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ToolsSection;
