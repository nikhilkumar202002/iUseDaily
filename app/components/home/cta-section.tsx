"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Check } from "lucide-react";

export function CtaSection() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12 sm:py-20 shadow-2xl shadow-primary/20">
        {/* Ambient background blur elements */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sky-300/20 blur-2xl" />

        <div className="relative z-10 mx-auto max-w-2xl">
          {/* Icon Badge */}
          <div className="mx-auto mb-6 flex h-13 w-13 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Sparkles className="h-6 w-6 text-white" />
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Make every day a little easier.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">
            Discover free everyday tools, organize your priorities, and get more done
            faster with iUseDaily.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/register"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-blue-600 shadow-md transition-all hover:bg-blue-50 active:scale-[0.98] sm:w-auto"
            >
              <span>Get started for free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/tools"
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:w-auto"
            >
              Explore all tools
            </Link>
          </div>

          {/* Trust points */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-blue-100">
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-white" />
              <span>Free forever tools</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-white" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-white" />
              <span>Private & secure</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CtaSection;
