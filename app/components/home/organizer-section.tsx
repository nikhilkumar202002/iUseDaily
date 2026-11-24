"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ListTodo,
  StickyNote,
  Calendar,
  Flame,
  Check,
  Copy,
} from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  priority: "High" | "Urgent" | "Medium";
  category: string;
  time: string;
  done: boolean;
}

const initialTasks: TaskItem[] = [
  {
    id: "t1",
    title: "Finalize client proposal with compressed PDF",
    priority: "Urgent",
    category: "Work",
    time: "45m",
    done: true,
  },
  {
    id: "t2",
    title: "Audit SVG icons and remove background",
    priority: "High",
    category: "Design",
    time: "30m",
    done: true,
  },
  {
    id: "t3",
    title: "Draft weekly recap using AI Assistant",
    priority: "High",
    category: "Review",
    time: "20m",
    done: false,
  },
  {
    id: "t4",
    title: "Reconcile monthly subscriptions",
    priority: "Medium",
    category: "Finance",
    time: "15m",
    done: false,
  },
];

const timeBlocks = [
  { time: "09:00 AM", title: "Deep Work: Core Utility Engineering", active: true, tag: "Focus" },
  { time: "11:30 AM", title: "Product Roadmap & Asset Review", active: false, tag: "Sync" },
  { time: "02:00 PM", title: "AI Assistant Prompt Optimization", active: false, tag: "Dev" },
  { time: "04:30 PM", title: "Daily Wrap-up & Inbox Zero", active: false, tag: "Admin" },
];

export function OrganizerSection() {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [noteCopied, setNoteCopied] = useState(false);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const handleCopyNote = () => {
    navigator.clipboard.writeText(
      "Sprint Goals:\n• Ship WASM image compressor\n• Test PDF merger with multi-page files\n• Verify zero telemetry on all local client tools"
    );
    setNoteCopied(true);
    setTimeout(() => setNoteCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background glow accent */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header (Centered, Eyebrow Removed) */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Turn chaos into a calm, focused workflow.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            A personal command center engineered for daily clarity. Capture to-dos, manage focus blocks,
            and keep instant scratchpad notes without complex enterprise bloat.
          </p>
        </div>

        {/* 3-Column SaaS Workspace Grid */}
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          
          {/* Card 1: Interactive Sprint Checklist */}
          <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-200 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 sm:p-7">
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ListTodo className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Actionable Checklist</h3>
                    <p className="text-[11px] text-muted-foreground">Click items to complete</p>
                  </div>
                </div>

                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <Flame className="h-3 w-3 fill-current" />
                  <span>{progressPercent}%</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>Progress</span>
                  <span>{completedCount} of {tasks.length} done</span>
                </div>
              </div>

              {/* Tasks List */}
              <div className="mt-4 space-y-2">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                      task.done
                        ? "border-border/50 bg-muted/30 text-muted-foreground"
                        : "border-border bg-card hover:border-emerald-500/40 hover:bg-muted/30 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="shrink-0">
                        {task.done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          task.done ? "line-through text-muted-foreground/80" : "text-foreground font-semibold"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <span
                      className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        task.priority === "Urgent"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : task.priority === "High"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-border/60 pt-3 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Auto-sorts by urgency</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Interactive</span>
            </div>
          </div>

          {/* Card 2: Time-Blocked Daily Focus */}
          <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 sm:p-7">
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Daily Focus Blocks</h3>
                    <p className="text-[11px] text-muted-foreground">Today&apos;s schedule timeline</p>
                  </div>
                </div>

                <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span>Live</span>
                </span>
              </div>

              {/* Timeline Items */}
              <div className="mt-5 space-y-3">
                {timeBlocks.map((block) => (
                  <div
                    key={block.time}
                    className={`relative rounded-xl border p-3.5 transition-all ${
                      block.active
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-muted-foreground">
                        <Clock className="h-3 w-3 text-primary" />
                        {block.time}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          block.active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {block.tag}
                      </span>
                    </div>

                    <p
                      className={`mt-1.5 text-xs font-semibold ${
                        block.active ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {block.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-border/60 pt-3 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Time-blocking method</span>
              <span className="font-semibold text-primary">Zero Overlap</span>
            </div>
          </div>

          {/* Card 3: Instant Scratchpad & Notes */}
          <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-200 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/5 sm:p-7">
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <StickyNote className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Local Scratchpad</h3>
                    <p className="text-[11px] text-muted-foreground">Instant notes & clipboard cache</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyNote}
                  aria-label="Copy scratchpad notes"
                  className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {noteCopied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Note Body */}
              <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground">
                <p className="font-bold text-purple-600 dark:text-purple-400"># Sprint Goals</p>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  <li>• Ship WASM image compressor</li>
                  <li>• Test PDF merger with multi-page files</li>
                  <li>• Verify zero telemetry on all local client tools</li>
                </ul>

                <div className="mt-4 rounded-xl border border-dashed border-border bg-card/60 p-2.5 text-[11px] text-muted-foreground">
                  <span>💡 Tip: Notes persist automatically in browser storage.</span>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-border/60 pt-3 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Encrypted local storage</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">Offline First</span>
            </div>
          </div>
        </div>

        {/* Centered CTA Button below cards */}
        <div className="mt-14 flex justify-center">
          <Link
            href="/organizer"
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-muted"
          >
            <span>Open Personal Workspace</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default OrganizerSection;
