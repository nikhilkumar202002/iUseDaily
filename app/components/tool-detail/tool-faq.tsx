"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "./types";

interface ToolFAQProps {
  faqs: FaqItem[];
}

export function ToolFAQ({ faqs }: ToolFAQProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  if (!faqs || faqs.length === 0) return null;

  const toggle = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <section aria-label="Frequently Asked Questions" className="mt-16 space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Frequently Asked Questions
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Got questions? We have answers.
        </p>
      </div>

      <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
        {faqs.map((faq, idx) => {
          const isOpen = openIndexes.includes(idx);
          return (
            <div key={idx} className="transition-colors">
              <button
                type="button"
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between p-6 text-left transition hover:bg-muted/40"
              >
                <span className="text-sm font-semibold text-foreground sm:text-base">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 pt-0 animate-in fade-in duration-200">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ToolFAQ;
