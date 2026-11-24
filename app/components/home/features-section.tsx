"use client";

import React from "react";
import {
  ShieldCheck,
  Zap,
  Globe2,
  Sparkles,
  Command,
  Database,
  ArrowRight,
  WifiOff,
  Cpu,
} from "lucide-react";
import Link from "next/link";

export function FeaturesSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background glow accent */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Architecture & Advantages</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Engineered for speed, privacy, and focus.
          </h2>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            We stripped away enterprise bloat, intrusive tracking, and slow server queues to give
            you the cleanest, fastest daily companion on the web.
          </p>
        </div>

        {/* SaaS Bento Box Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* Bento Card 1: Large Span 2 */}
          <div className="group relative overflow-hidden rounded-[28px] border border-border/80 bg-card p-8 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl sm:col-span-2">
            <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-100" />
            
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-blue text-primary shadow-sm">
                  <Cpu className="h-6 w-6" />
                </div>
                <div className="mt-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Client-Side WASM Engine
                  </span>
                  <h3 className="mt-2 text-2xl font-bold text-foreground">
                    Zero-Server File Processing
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    Unlike standard web tools that upload your private documents to third-party cloud servers,
                    iUseDaily executes conversions, compression, and text manipulation directly inside your browser’s
                    WebAssembly memory. No upload delays, no server queues, and 100% data sovereignty.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-medium text-foreground">
                <div className="flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1.5 border border-border">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Files Never Leave Device</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1.5 border border-border">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span>0ms Network Transfer Wait</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1.5 border border-border">
                  <Database className="h-4 w-4 text-blue-500" />
                  <span>Zero Cloud Logs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Command Palette */}
          <div className="group relative overflow-hidden rounded-[28px] border border-border/80 bg-card p-8 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-blue text-primary shadow-sm">
              <Command className="h-6 w-6" />
            </div>

            <div className="mt-6">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Keyboard First
              </span>
              <h3 className="mt-2 text-xl font-bold text-foreground">
                Quick Navigation & Search
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Navigate anywhere instantly with built-in search. Find tools, open recent tasks,
                or launch AI prompts without touching your mouse.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <span>Press shortcut</span>
              <kbd className="rounded border border-border bg-card px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                ⌘ + K
              </kbd>
            </div>
          </div>

          {/* Bento Card 3: Offline Ready */}
          <div className="group relative overflow-hidden rounded-[28px] border border-border/80 bg-card p-8 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-blue text-primary shadow-sm">
              <WifiOff className="h-6 w-6" />
            </div>

            <div className="mt-6">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Resilience
              </span>
              <h3 className="mt-2 text-xl font-bold text-foreground">
                Offline-First Persistence
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                No internet? No problem. The tools suite, scratchpad, and daily organizer remain
                fully functional when flying, traveling, or experiencing outages.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Progressive Web App Ready</span>
            </div>
          </div>

          {/* Bento Card 4: Large Span 2 */}
          <div className="group relative overflow-hidden rounded-[28px] border border-border/80 bg-card p-8 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl sm:col-span-2">
            <div className="pointer-events-none absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl transition-opacity group-hover:opacity-100" />
            
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-sm">
                  <Globe2 className="h-6 w-6" />
                </div>
                <div className="mt-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Ecosystem Synergy
                  </span>
                  <h3 className="mt-2 text-2xl font-bold text-foreground">
                    Connected Workflow Intelligence
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    Everything connects. Convert a PDF document in Tools, send its extracted text to the AI Assistant
                    for synthesis, and auto-generate tomorrow&apos;s sprint tasks in the Organizer with a single click.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-primary">
                <span>Experience the unified platform</span>
                <Link href="/register" className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Get started now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
