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
  Sparkles,
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
  href: string;
}

const allTools: ToolItem[] = [
  {
    id: "pdf-converter",
    name: "PDF Converter",
    description: "Convert Word, Excel, and image files to and from PDF without watermark.",
    category: "PDF",
    icon: FileType,
    badge: "Popular",
    href: "/tools",
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    description: "Compress JPG, PNG, and WebP images up to 80% while retaining quality.",
    category: "IMAGE",
    icon: ImageIcon,
    badge: "Fast",
    href: "/tools",
  },
  {
    id: "merge-pdf",
    name: "Merge & Split PDF",
    description: "Combine multiple PDF documents into one or extract specific pages.",
    category: "PDF",
    icon: Layers,
    href: "/tools",
  },
  {
    id: "word-counter",
    name: "Word & Character Counter",
    description: "Count characters, words, sentences, reading time, and keyword density.",
    category: "TEXT",
    icon: FileText,
    href: "/tools",
  },
  {
    id: "percentage-calc",
    name: "Percentage Calculator",
    description: "Compute increases, decreases, fractions, discounts, and margin easily.",
    category: "CALCULATOR",
    icon: Calculator,
    href: "/tools",
  },
  {
    id: "background-remover",
    name: "Background Remover",
    description: "Automatically cut out backgrounds from photos with instant AI precision.",
    category: "IMAGE",
    icon: Scissors,
    badge: "AI Powered",
    href: "/tools",
  },
  {
    id: "json-formatter",
    name: "JSON Formatter & Validator",
    description: "Beautify, validate, minify, and debug JSON payloads with color syntax.",
    category: "TEXT",
    icon: Code2,
    href: "/tools",
  },
  {
    id: "unit-converter",
    name: "Unit & Currency Converter",
    description: "Convert units of length, weight, speed, temperature, and live currencies.",
    category: "CALCULATOR",
    icon: Calculator,
    href: "/tools",
  },
];

const categories: { label: string; value: Category }[] = [
  { label: "All Tools", value: "ALL" },
  { label: "PDF Tools", value: "PDF" },
  { label: "Image Utilities", value: "IMAGE" },
  { label: "Text & Code", value: "TEXT" },
  { label: "Calculators", value: "CALCULATOR" },
];

export function ToolsSection() {
  const [activeCategory, setActiveCategory] = useState<Category>("ALL");

  const filteredTools =
    activeCategory === "ALL"
      ? allTools
      : allTools.filter((tool) => tool.category === activeCategory);

  return (
    <section className="border-y border-border bg-muted/40 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Everyday Essentials
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Practical utilities built for speed.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              No software installations or accounts required. Pick a tool, get your work done
              in seconds, and move on with your day.
            </p>
          </div>

          <Link
            href="/tools"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all hover:text-primary/80"
          >
            <span>View all 50+ tools</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-4">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                activeCategory === cat.value
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid of Tools */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-blue text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    {tool.badge && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                        {tool.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {tool.name}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-sm">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <span>Use tool</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ToolsSection;
