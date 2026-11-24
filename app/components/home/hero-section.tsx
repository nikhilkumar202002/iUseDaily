"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  Sparkles,
  Command,
  CheckCircle2,
  Zap,
  Bot,
  Layers,
  Calendar,
  FileText,
  Shield,
  Star,
  ChevronRight,
  SlidersHorizontal,
  Play,
} from "lucide-react";

const quickSuggestions = [
  { label: "PDF Converter", tag: "PDF", href: "/tools" },
  { label: "Image Compressor", tag: "Media", href: "/tools" },
  { label: "AI Summarizer", tag: "AI", href: "/ai-assistant" },
  { label: "Sprint Planner", tag: "Planner", href: "/organizer" },
];

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"tools" | "organizer" | "ai">("tools");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tools?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
      {/* Background Gradients & Mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-gradient-to-b from-primary/15 via-sky-500/10 to-transparent blur-3xl" />
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-3xl" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Top Announcement */}
        <div className="flex justify-center">
          <Link
            href="/tools"
            className="group inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-4 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-md transition-all hover:border-primary/50 hover:bg-card"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold text-primary">iUseDaily 2.0</span>
            <span className="text-muted-foreground">The unified digital utility suite</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Main Headline */}
        <div className="mx-auto mt-8 max-w-4xl text-center">
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            The everyday OS for
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-300 dark:to-indigo-300">
              modern digital productivity.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-8">
            Stop switching between 15 scattered tabs. iUseDaily unifies 50+ client-side utility tools,
            smart workspace planning, and next-gen AI assistance in one high-performance platform.
          </p>

          {/* Action Row */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/register"
              className="group relative inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-95 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
            >
              <span>Get started free</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/tools"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card/80 px-7 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:border-border/80 hover:bg-muted active:scale-[0.98]"
            >
              <Play className="h-3.5 w-3.5 fill-current text-primary" />
              <span>Explore tools catalog</span>
            </Link>
          </div>

          {/* SaaS Social Proof Bar */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white ring-2 ring-background">JD</span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-background">SR</span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white ring-2 ring-background">MK</span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-background">+</span>
              </div>
              <span className="font-medium text-foreground">50,000+ daily users</span>
            </div>

            <div className="hidden h-3 w-px bg-border sm:block" />

            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
              <span className="ml-1 font-semibold text-foreground">4.9/5 rating</span>
            </div>

            <div className="hidden h-3 w-px bg-border sm:block" />

            <div className="flex items-center gap-1.5 text-foreground">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span>100% Client-Side Privacy</span>
            </div>
          </div>
        </div>

        {/* Interactive SaaS App Mockup Frame */}
        <div className="relative mx-auto mt-14 max-w-5xl">
          {/* Subtle outer glow */}
          <div className="pointer-events-none absolute -inset-1 rounded-[28px] bg-gradient-to-b from-primary/30 via-sky-500/20 to-transparent opacity-60 blur-lg" />

          {/* Browser / App Shell */}
          <div className="relative overflow-hidden rounded-[24px] border border-border/80 bg-card shadow-2xl shadow-primary/10">
            {/* Window Topbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/40 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="ml-3 hidden text-xs font-medium text-muted-foreground sm:inline-block">
                  app.iusedaily.com
                </div>
              </div>

              {/* View Switcher Tabs inside app frame */}
              <div className="flex items-center rounded-xl bg-background/80 p-1 border border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("tools")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                    activeTab === "tools"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Tools Suite</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("organizer")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                    activeTab === "organizer"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Workspace</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ai")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                    activeTab === "ai"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>AI Copilot</span>
                </button>
              </div>

              {/* Status pill */}
              <div className="hidden items-center gap-2 sm:flex">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Ready (0ms latency)
                </span>
              </div>
            </div>

            {/* Inner Dashboard View */}
            <div className="p-5 sm:p-7 bg-background/50">
              {/* Search Inside Product Shell */}
              <form onSubmit={handleSearch} className="mb-6 flex items-center gap-3">
                <div className="relative flex flex-1 items-center rounded-xl border border-border bg-card px-3.5 py-2.5 shadow-sm focus-within:border-primary">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 50+ tools, ask AI questions, find tasks..."
                    className="w-full bg-transparent px-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <div className="hidden items-center gap-1 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:flex">
                    <Command className="h-3 w-3" />
                    <span>K</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
                >
                  Quick Open
                </button>
              </form>

              {/* Quick Suggestion Pills */}
              <div className="mb-6 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Suggested:</span>
                {quickSuggestions.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <span>{item.label}</span>
                    <span className="rounded bg-muted px-1 py-0.2 text-[9px] font-semibold text-primary">
                      {item.tag}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Dynamic Tab Body */}
              {activeTab === "tools" && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-primary">PDF Engine</span>
                    </div>
                    <h4 className="mt-3 text-xs font-semibold text-foreground">High-Speed PDF Converter</h4>
                    <p className="mt-1 text-[11px] text-muted-foreground">Convert Word, Excel, and JPG to PDF with zero file upload wait time.</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-primary font-medium">
                      <span>Launch tool</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Layers className="h-4 w-4" />
                      </span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Media</span>
                    </div>
                    <h4 className="mt-3 text-xs font-semibold text-foreground">Smart Image Compressor</h4>
                    <p className="mt-1 text-[11px] text-muted-foreground">Compress PNG, JPG and WebP files up to 85% with zero quality loss.</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-primary font-medium">
                      <span>Launch tool</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <SlidersHorizontal className="h-4 w-4" />
                      </span>
                      <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">Utility</span>
                    </div>
                    <h4 className="mt-3 text-xs font-semibold text-foreground">Text & Data Formatter</h4>
                    <p className="mt-1 text-[11px] text-muted-foreground">Count words, validate JSON, clean markup, and format code instantly.</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-primary font-medium">
                      <span>Launch tool</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "organizer" && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="col-span-2 rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                      <span className="text-xs font-bold text-foreground">Active Daily Sprints</span>
                      <span className="text-[10px] font-semibold text-emerald-600">3 of 4 Completed</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="line-through text-muted-foreground">Draft marketing copy for Q4 release</span>
                        </div>
                        <span className="rounded bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">High</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="line-through text-muted-foreground">Export PDF invoices for accounting</span>
                        </div>
                        <span className="rounded bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">Finance</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-3.5 w-3.5 rounded-full border border-primary" />
                          <span className="font-medium text-foreground">Review AI assistant translation accuracy</span>
                        </div>
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">In Progress</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-foreground">Quick Scratchpad</span>
                      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                        &quot;Remember to check API token rate limits before pushing production build tomorrow.&quot;
                      </p>
                    </div>
                    <div className="mt-4 border-t border-border pt-2 text-[10px] text-muted-foreground">
                      Auto-saved locally (Offline ready)
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "ai" && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between border-b border-border pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">AI Copilot Session</span>
                    </div>
                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                      Gemini Multimodal 2.5
                    </span>
                  </div>
                  <div className="mt-3 space-y-2.5 text-xs">
                    <div className="flex justify-end">
                      <span className="rounded-xl bg-primary px-3 py-1.5 text-primary-foreground text-[11px]">
                        Summarize this 10-page market research report into 3 actionable bullets.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 text-[10px]">
                        AI
                      </div>
                      <div className="rounded-xl border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-foreground">
                        <p className="font-semibold text-foreground">Key Takeaways:</p>
                        <p className="mt-1">1. 82% of users prefer single-tab productivity suites over fragmented bookmark lists.</p>
                        <p>2. Client-side utilities decrease file bounce rates by over 60%.</p>
                        <p>3. AI synthesis saves an average of 42 minutes per knowledge worker daily.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
