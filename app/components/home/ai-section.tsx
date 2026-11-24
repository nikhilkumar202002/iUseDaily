"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Send,
  WandSparkles,
  Languages,
  FileCheck,
  ArrowRight,
  Check,
  Copy,
} from "lucide-react";

const samplePrompts = [
  {
    title: "Summarize Document",
    prompt: "Summarize this 5-page report into 3 bullet takeaways.",
    response:
      "1. Q3 productivity rose 28% after adopting unified web tools.\n2. Manual file conversions reduced by 4 hours per employee/week.\n3. Team communication velocity improved by 35% with daily sync notes.",
  },
  {
    title: "Polish Email",
    prompt: "Make this client follow-up sound polite yet decisive.",
    response:
      "Hi Alex,\n\nFollowing up on our discussion yesterday. We’re on track to deliver the finalized assets by Thursday 3 PM. Let me know if you’d like any early adjustments before then!\n\nBest,\nJordan",
  },
  {
    title: "Daily Plan",
    prompt: "Create an energizing 3-hour morning focus block.",
    response:
      "• 8:00 - 8:45 AM: Deep Work on high-impact creative tasks\n• 8:45 - 9:00 AM: Hydrate, screen break & stretch\n• 9:00 - 9:50 AM: Code review & technical documentation\n• 9:50 - 10:00 AM: Inbox triage & priority alignment",
  },
];

export function AiSection() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const active = samplePrompts[selectedIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(active.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="border-t border-border bg-muted/40 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Interactive Prompt Showcase */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
              {/* Top AI badge bar */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">iUseDaily AI Assistant</h3>
                    <p className="text-[11px] text-muted-foreground">Always ready to assist</p>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {samplePrompts.map((p, i) => (
                    <button
                      key={p.title}
                      type="button"
                      onClick={() => setSelectedIdx(i)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        selectedIdx === i
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      }`}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Dialog simulation */}
              <div className="mt-5 space-y-4">
                {/* User Prompt */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-xs text-primary-foreground sm:text-sm">
                    {active.prompt}
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-blue text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="relative flex-1 rounded-2xl border border-border bg-muted/50 p-4 text-xs leading-relaxed text-foreground sm:text-sm">
                    <pre className="font-sans whitespace-pre-wrap">{active.response}</pre>
                    <button
                      type="button"
                      onClick={handleCopy}
                      aria-label="Copy AI response"
                      className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-primary transition-colors hover:opacity-80"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? "Copied!" : "Copy response"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Simulated Prompt Input */}
              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3">
                <input
                  type="text"
                  readOnly
                  value="Ask anything: writing, summaries, calculations, ideas..."
                  className="w-full bg-transparent text-xs text-muted-foreground outline-none cursor-default"
                />
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                  <Send className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Right Text Description */}
          <div className="order-1 lg:order-2">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              <WandSparkles className="h-3.5 w-3.5" />
              Intelligent Companion
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Instant answers and smart assistance.
            </h2>

            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Supercharge your daily routine with an AI that summarizes long texts, drafts emails,
              translates languages, and answers everyday questions in seconds.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <FileCheck className="h-4 w-4" />
                </div>
                <h4 className="font-semibold text-foreground text-sm">Smart Summaries</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-5">
                  Distill lengthy articles, notes, and PDF reports into clean bullet points.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Languages className="h-4 w-4" />
                </div>
                <h4 className="font-semibold text-foreground text-sm">Real-time Translation</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-5">
                  Translate texts naturally across 50+ languages with contextual accuracy.
                </p>
              </div>
            </div>

            <div className="mt-9">
              <Link
                href="/ai-assistant"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:opacity-95"
              >
                <span>Try AI Assistant</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AiSection;
