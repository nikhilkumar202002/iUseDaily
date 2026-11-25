"use client";

import React from "react";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import type { InstructionStep, ToolFeature } from "./types";

interface ToolInstructionsProps {
  toolName: string;
  instructions: InstructionStep[];
  features?: ToolFeature[];
  privacyNote?: string;
}

export function ToolInstructions({
  toolName,
  instructions,
  features,
  privacyNote = "Your files are processed securely in your browser and are never uploaded to or stored on our servers.",
}: ToolInstructionsProps) {
  return (
    <section aria-label="Tool instructions and features" className="mt-16 space-y-12">
      {/* How to use */}
      {instructions && instructions.length > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              How to use {toolName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Follow these simple steps to get your work done in seconds.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {instructions.map((step) => (
              <div
                key={step.step}
                className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {step.step}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Features */}
      {features && features.length > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Key Features
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything you need for fast and reliable processing.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon || CheckCircle2;
              return (
                <div
                  key={idx}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Privacy and Security Notice */}
      <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">Privacy & Security First</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {privacyNote} We prioritize your security: files are handled client-side or automatically purged post-processing without permanent storage or analytics snooping.
          </p>
        </div>
      </div>
    </section>
  );
}

export default ToolInstructions;
