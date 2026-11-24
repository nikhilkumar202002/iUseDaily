"use client";

import React from "react";
import Link from "next/link";
import {
  HelpCircle,
  PenTool,
  Languages,
  FileCheck,
  Lightbulb,
  CalendarCheck2,
  Brain,
  Workflow,
  Lock,
  ArrowRight,
} from "lucide-react";

interface AiCapability {
  number: string;
  title: string;
  description: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
}

const capabilities: AiCapability[] = [
  {
    number: "01",
    title: "Ask Anything",
    description:
      "Ask everyday questions, get clear explanations, learn new topics, and troubleshoot common challenges instantly.",
    tag: "Answers",
    icon: HelpCircle,
  },
  {
    number: "02",
    title: "Writing Assistant",
    description:
      "Write emails, messages, job applications, social captions, and polished professional documents with tailored tone.",
    tag: "Drafting",
    icon: PenTool,
  },
  {
    number: "03",
    title: "Translation & Language",
    description:
      "Translate across 50+ languages, correct grammar, rewrite awkward sentences, and polish cross-border communication.",
    tag: "Language",
    icon: Languages,
  },
  {
    number: "04",
    title: "Document Assistant",
    description:
      "Summarize PDFs, explain complex contracts, extract key takeaways, and answer direct questions about uploaded files.",
    tag: "Files & PDFs",
    icon: FileCheck,
  },
  {
    number: "05",
    title: "Ideas & Creativity",
    description:
      "Generate business ideas, brand names, content plans, study projects, and creative solutions whenever you feel stuck.",
    tag: "Ideation",
    icon: Lightbulb,
  },
  {
    number: "06",
    title: "Personal Planning",
    description:
      "Create daily schedules, organize routines, build checklists, and convert messy thoughts into structured, actionable plans.",
    tag: "Planning",
    icon: CalendarCheck2,
  },
  {
    number: "07",
    title: "Smart Problem Solver",
    description:
      "Understand calculations, compare trade-offs, solve everyday logic problems, and make informed decisions with confidence.",
    tag: "Decisions",
    icon: Brain,
  },
  {
    number: "08",
    title: "Connected AI Assistant",
    description:
      "Connects securely with your iUseDaily workspace to organize notes, update tasks, and manage reminders with your permission.",
    tag: "Workspace Sync",
    icon: Workflow,
  },
];

export function AiSection() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-muted/30 py-24 sm:py-32">
      {/* Background glow accent */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header (Centered, No Eyebrow) */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            An intelligent assistant built for everyday life.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Purpose-built to eliminate daily friction. Whether you need fast answers, document summaries,
            smart writing, or an assistant that connects directly to your workspace.
          </p>
        </div>

        {/* 8 Capabilities Grid */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/5"
              >
                <div>
                  {/* Top row with icon & category badge */}
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs font-semibold text-muted-foreground/60">
                      {item.number}
                    </span>
                  </div>

                  {/* Title & Tag */}
                  <div className="mt-5">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {item.tag}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-foreground transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                  <span>Available in Assistant</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Login-Gated Access Callout */}
        <div className="mx-auto mt-14 max-w-3xl rounded-3xl border border-border/80 bg-card p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Lock className="h-6 w-6" />
          </div>

          <h3 className="mt-4 text-xl font-bold text-foreground sm:text-2xl">
            Sign in to start chatting with your AI assistant
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Sign in to your free iUseDaily account to unlock conversational AI chat, save multi-session
            histories, and securely connect the assistant to your personal tasks and notes.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login?redirect=/ai-assistant"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
            >
              <Lock className="h-4 w-4" />
              <span>Sign in to access AI Chat</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
            >
              Create free account
            </Link>
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground">
            🔒 Private & confidential • Prompts never train public foundation models
          </p>
        </div>
      </div>
    </section>
  );
}

export default AiSection;
