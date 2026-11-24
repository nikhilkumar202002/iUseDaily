"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Bot,
  Zap,
} from "lucide-react";

const quickSuggestions = [
  { label: "PDF to Word", href: "/tools" },
  { label: "Compress Image", href: "/tools" },
  { label: "AI Summarizer", href: "/ai-assistant" },
  { label: "Daily Planner", href: "/organizer" },
];

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tools?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
      {/* Background ambient radial gradients */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[450px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 -z-10 h-[300px] w-[500px] rounded-full bg-sky-500/10 blur-[100px]" />

      <div className="mx-auto max-w-5xl text-center">
        {/* Top Announcement Pill */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-primary/40">
          <span className="flex h-2 w-2 rounded-full bg-primary" />
          <span>Your all-in-one daily digital toolkit</span>
          <ArrowUpRight size={13} className="text-primary" />
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          Everything you need.
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-300 dark:to-indigo-400">
            All in one place.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-8">
          Streamline your everyday workflow with fast utility tools, intelligent task planning,
          and a built-in AI assistant designed to get things done without friction.
        </p>

        {/* Search Bar */}
        <div className="mx-auto mt-9 max-w-xl">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-2"
          >
            <div className="flex h-13 flex-1 items-center gap-3 rounded-2xl border border-border bg-card px-4 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools, convert files, ask AI..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition-all hover:opacity-95 hover:shadow-md hover:shadow-primary/30 active:scale-[0.99]"
            >
              <span>Explore tools</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick search tags */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">Popular:</span>
            {quickSuggestions.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full border border-border/80 bg-muted/50 px-2.5 py-1 transition-colors hover:border-primary/50 hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Feature Pills under hero */}
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-card/60 p-3.5 shadow-sm backdrop-blur-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">50+ Online Tools</p>
              <p className="text-[11px] text-muted-foreground">Free, instant & in-browser</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-card/60 p-3.5 shadow-sm backdrop-blur-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">Daily Organizer</p>
              <p className="text-[11px] text-muted-foreground">Tasks, notes & reminders</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-card/60 p-3.5 shadow-sm backdrop-blur-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">AI Digital Assistant</p>
              <p className="text-[11px] text-muted-foreground">Drafting, summarization & answers</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
