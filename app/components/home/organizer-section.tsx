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
} from "lucide-react";

const initialTasks = [
  { id: 1, title: "Review quarterly presentation draft", tag: "Work", due: "Today, 4:00 PM", done: true },
  { id: 2, title: "Compress and send portfolio images", tag: "Creative", due: "Today, 6:30 PM", done: false },
  { id: 3, title: "Plan weekly grocery & meal prep", tag: "Personal", due: "Tomorrow", done: false },
];

export function OrganizerSection() {
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.done).length;

  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Text Content */}
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <CalendarDays className="h-3.5 w-3.5" />
              Personal Workspace
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Organize your days, clear your mind.
            </h2>

            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              A clutter-free space that combines daily tasks, smart reminders, and flexible notes.
              No complex setup — just a clean organizer that helps you stay on track.
            </p>

            {/* Feature List */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-blue text-primary">
                  <ListTodo className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Actionable Checklists</h4>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    Organize daily tasks by priority, tags, and due dates with instant progress tracking.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-blue text-primary">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Smart Reminders</h4>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    Never let important deadlines or daily habits slip through the cracks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-blue text-primary">
                  <StickyNote className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Quick Scratchpad & Notes</h4>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    Jot down quick ideas, links, or draft messages saved right in your browser.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-9">
              <Link
                href="/organizer"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:opacity-95"
              >
                <span>Launch Organizer</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Right Interactive Mock Widget */}
          <div className="relative">
            {/* Background Glow */}
            <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-primary/10 to-sky-500/10 blur-xl" />

            <div className="relative rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div>
                  <h3 className="text-base font-bold text-foreground">Today&apos;s Focus</h3>
                  <p className="text-xs text-muted-foreground">
                    {completedCount} of {tasks.length} tasks completed
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Clock className="h-3 w-3" />
                    Today
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(completedCount / tasks.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Task Items */}
              <div className="mt-5 space-y-2.5">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                      task.done
                        ? "border-border/60 bg-muted/40 text-muted-foreground"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/30 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {task.done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={`text-xs font-medium sm:text-sm ${task.done ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline-block">
                        {task.tag}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {task.due}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Mock Quick Add Input */}
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-border px-3.5 py-2.5 text-xs text-muted-foreground">
                <Plus className="h-4 w-4 text-primary" />
                <span>Click tasks above to toggle completion...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OrganizerSection;
