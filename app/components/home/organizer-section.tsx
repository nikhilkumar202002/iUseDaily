"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ListTodo,
  StickyNote,
  Bell,
  Plus,
  Flame,
  CheckSquare2,
} from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  category: "Engineering" | "Design" | "Strategy" | "Personal";
  priority: "High" | "Medium" | "Urgent";
  timeEstimate: string;
  done: boolean;
}

const initialTasks: TaskItem[] = [
  {
    id: "t1",
    title: "Finalize client proposal with compressed PDF attachments",
    category: "Strategy",
    priority: "Urgent",
    timeEstimate: "45m",
    done: true,
  },
  {
    id: "t2",
    title: "Audit SVG icons and remove background from hero graphics",
    category: "Design",
    priority: "High",
    timeEstimate: "30m",
    done: true,
  },
  {
    id: "t3",
    title: "Draft weekly executive recap using AI Assistant",
    category: "Engineering",
    priority: "High",
    timeEstimate: "20m",
    done: false,
  },
  {
    id: "t4",
    title: "Reconcile monthly SaaS subscriptions and export invoices",
    category: "Personal",
    priority: "Medium",
    timeEstimate: "15m",
    done: false,
  },
];

export function OrganizerSection() {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === "ACTIVE") return !t.done;
    if (activeFilter === "COMPLETED") return t.done;
    return true;
  });

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          
          {/* Left Column: SaaS Narrative & Value Props */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Personal Command Center</span>
            </div>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Turn chaos into a calm, focused workflow.
            </h2>

            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Most productivity apps are bloated with unnecessary enterprise complexity.
              iUseDaily gives you a lean, tactile personal workspace to capture to-dos, store
              instant scratchpad notes, and execute your day without distraction.
            </p>

            {/* Micro Feature Grid */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3.5 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckSquare2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Sprint Checklists & Priorities</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Assign tags, time estimates, and urgency flags. Completed tasks auto-archive cleanly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-primary">
                  <StickyNote className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Zero-Latency Scratchpad</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Paste clipboard text, code snippets, or draft ideas. Saved in real-time to your browser storage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Contextual Habit Reminders</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Subtle notifications keep your highest-leverage tasks top of mind throughout the workday.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-9 flex items-center gap-4">
              <Link
                href="/organizer"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:opacity-95"
              >
                <span>Open Personal Workspace</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Column: SaaS Interactive Dashboard Card */}
          <div className="lg:col-span-7">
            <div className="relative">
              {/* Outer decorative glow */}
              <div className="pointer-events-none absolute -inset-2 rounded-[32px] bg-gradient-to-r from-emerald-500/15 via-primary/15 to-sky-500/15 blur-2xl opacity-75" />

              <div className="relative overflow-hidden rounded-[28px] border border-border/80 bg-card p-6 shadow-2xl sm:p-8">
                {/* Top header bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/25">
                      <ListTodo className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Daily Sprint Board</h3>
                      <p className="text-xs text-muted-foreground">Focus view • {tasks.length} active items</p>
                    </div>
                  </div>

                  {/* Filter pill switcher */}
                  <div className="flex rounded-xl bg-muted/60 p-1 border border-border text-xs">
                    {(["ALL", "ACTIVE", "COMPLETED"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveFilter(filter)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                          activeFilter === filter
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress bar with metrics */}
                <div className="mt-5 rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span>Sprint Velocity: {progressPercent}% done</span>
                    </span>
                    <span className="text-muted-foreground">
                      {completedCount} of {tasks.length} tasks completed
                    </span>
                  </div>

                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Task Item List */}
                <div className="mt-5 space-y-2.5">
                  {filteredTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`group flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                        task.done
                          ? "border-border/50 bg-muted/30 text-muted-foreground"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 transition-transform group-hover:scale-110">
                          {task.done ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          )}
                        </div>

                        <span
                          className={`text-xs font-medium sm:text-sm transition-all ${
                            task.done ? "line-through text-muted-foreground/80" : "text-foreground font-semibold"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 pl-2">
                        <span
                          className={`hidden rounded-md px-2 py-0.5 text-[10px] font-semibold sm:inline-block ${
                            task.priority === "Urgent"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : task.priority === "High"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {task.priority}
                        </span>

                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {task.timeEstimate}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Interactive Scratchpad Footer inside widget */}
                <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/20 p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Plus className="h-3.5 w-3.5 text-primary" />
                      <span>Click any checklist item above to toggle sprint status</span>
                    </span>
                    <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline-block">
                      Local Persistence: Enabled
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OrganizerSection;
