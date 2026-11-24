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
  Cpu,
  ShieldAlert,
} from "lucide-react";

interface PromptPreset {
  id: string;
  category: string;
  title: string;
  userPrompt: string;
  aiResponse: string;
  tokens: number;
  duration: string;
}

const aiPresets: PromptPreset[] = [
  {
    id: "summarize",
    category: "Document Intelligence",
    title: "PDF / Report Summary",
    userPrompt: "Extract key takeaways and action items from our 14-page vendor agreement.",
    aiResponse:
      "### Executive Summary:\n• **Payment Terms:** Net-30 with a 2% early settlement discount before day 10.\n• **SLA Commitments:** 99.95% uptime with automatic credits for outages exceeding 15m.\n• **Data Protection:** E2E encryption mandated for all resting and in-flight payloads.\n\n**Action Item:** Sign Schedule C and return to legal team by Friday 5 PM.",
    tokens: 312,
    duration: "0.4s",
  },
  {
    id: "email",
    category: "Communication",
    title: "Executive Email Composer",
    userPrompt: "Draft a concise, assertive reply declining an out-of-scope feature request politely.",
    aiResponse:
      "Hi Morgan,\n\nThanks for providing this proposal. While the feature offers clear long-term value, it falls outside our committed Q4 roadmap objectives.\n\nLet’s bookmark this for the Q1 planning sprint so we can allocate proper engineering bandwidth. Appreciate your partnership!\n\nBest,\nAlex",
    tokens: 185,
    duration: "0.3s",
  },
  {
    id: "code",
    category: "Engineering",
    title: "Code & Regex Generator",
    userPrompt: "Write an optimized TypeScript utility to debounce search inputs with cancel capability.",
    aiResponse:
      "```typescript\nexport function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {\n  let timer: NodeJS.Timeout;\n  const debounced = (...args: Parameters<T>) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n  debounced.cancel = () => clearTimeout(timer);\n  return debounced;\n}\n```",
    tokens: 240,
    duration: "0.5s",
  },
  {
    id: "translate",
    category: "Localization",
    title: "Multi-Language Translate",
    userPrompt: "Translate our launch headline to Spanish and German with natural tone.",
    aiResponse:
      "**Spanish:**\n\"El sistema operativo diario para la productividad digital moderna.\"\n\n**German:**\n\"Das alltägliche Betriebssystem für moderne digitale Produktivität.\"",
    tokens: 120,
    duration: "0.2s",
  },
];

export function AiSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const active = aiPresets[activeIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(active.aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden border-t border-border bg-muted/30 py-24 sm:py-32">
      {/* Background radial highlight */}
      <div className="pointer-events-none absolute right-1/4 top-1/2 -z-10 h-[500px] w-[600px] -translate-y-1/2 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          
          {/* Left Column: Interactive SaaS AI Studio */}
          <div className="order-2 lg:order-1 lg:col-span-7">
            <div className="relative">
              {/* Glowing gradient aura */}
              <div className="pointer-events-none absolute -inset-1.5 rounded-[32px] bg-gradient-to-r from-purple-500/20 via-primary/20 to-sky-500/20 blur-xl opacity-75" />

              <div className="relative overflow-hidden rounded-[28px] border border-border/80 bg-card p-6 shadow-2xl sm:p-8">
                {/* AI Console Topbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500 text-white shadow-md shadow-purple-500/25">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">iUseDaily AI Studio</h3>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Latency: {active.duration} • Output: {active.tokens} tokens
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border text-xs">
                    <span className="px-2 py-0.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                      Gemini 2.5 Flash
                    </span>
                  </div>
                </div>

                {/* Preset Prompt Pills */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {aiPresets.map((preset, idx) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        activeIdx === idx
                          ? "bg-foreground text-background shadow-sm"
                          : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>

                {/* Chat Dialog simulation */}
                <div className="mt-5 space-y-4">
                  {/* User query bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[90%] rounded-2xl bg-primary px-4 py-3 text-xs leading-relaxed text-primary-foreground shadow-md shadow-primary/10 sm:text-sm">
                      {active.userPrompt}
                    </div>
                  </div>

                  {/* AI Response Card */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-blue text-primary shadow-sm">
                      <Sparkles className="h-4 w-4" />
                    </div>

                    <div className="relative flex-1 overflow-hidden rounded-2xl border border-border bg-muted/40 p-4 text-xs leading-relaxed text-foreground sm:text-sm">
                      <div className="font-sans whitespace-pre-wrap">
                        {active.aiResponse}
                      </div>

                      {/* Bottom action controls */}
                      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                        <span className="font-mono">Category: {active.category}</span>
                        <button
                          type="button"
                          onClick={handleCopy}
                          aria-label="Copy AI response"
                          className="flex items-center gap-1.5 font-semibold text-primary transition-opacity hover:opacity-80"
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copied ? "Copied to clipboard" : "Copy output"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Input Bar */}
                <div className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 shadow-inner">
                  <input
                    type="text"
                    readOnly
                    value="Ask questions, draft emails, analyze files, code..."
                    className="w-full bg-transparent text-xs text-muted-foreground outline-none cursor-default"
                  />
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                    <Send className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative & Capabilities */}
          <div className="order-1 lg:order-2 lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <WandSparkles className="h-3.5 w-3.5" />
              <span>Next-Gen AI Companion</span>
            </div>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              An AI that actually knows your workflow.
            </h2>

            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Trained for daily productivity tasks. From summarizing 50-page legal contracts in
              seconds to generating spotless code utilities, writing emails, and translating across 50+ languages.
            </p>

            {/* Feature Cards Grid */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-primary/40">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <FileCheck className="h-4 w-4" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-foreground">Deep Document Parsing</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-5">
                  Feed contracts, PDFs, invoices, and research papers for instant synthesis.
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-primary/40">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Languages className="h-4 w-4" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-foreground">Nuanced Localization</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-5">
                  Native-speaker translations preserving context, tone, and idioms.
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-primary/40">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Cpu className="h-4 w-4" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-foreground">Sub-second Latency</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-5">
                  Fast streaming responses optimized for immediate decision making.
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-primary/40">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-foreground">Private Workspace</h4>
                <p className="mt-1 text-xs text-muted-foreground leading-5">
                  Your prompts and documents are never used to train public foundation models.
                </p>
              </div>
            </div>

            <div className="mt-9 flex items-center gap-4">
              <Link
                href="/ai-assistant"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:opacity-95"
              >
                <span>Launch AI Assistant</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AiSection;
