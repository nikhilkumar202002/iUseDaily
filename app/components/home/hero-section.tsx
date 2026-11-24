"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Star,
  ChevronRight,
  Play,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background Gradients & Mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-gradient-to-b from-primary/15 via-sky-500/10 to-transparent blur-3xl" />
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-3xl" />
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
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
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
      </div>
    </section>
  );
}

export default HeroSection;
