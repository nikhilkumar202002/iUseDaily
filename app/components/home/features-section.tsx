"use client";

import React from "react";
import {
  ShieldCheck,
  Zap,
  Globe2,
  Lock,
  Smartphone,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant & Lightweight",
    description:
      "Lightning-fast utilities that process directly in your browser without cumbersome uploads or waiting queues.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy by Design",
    description:
      "Your documents, images, and notes remain strictly yours. We never sell your data or train public models on your files.",
  },
  {
    icon: Globe2,
    title: "Unified Workspace",
    description:
      "Replace 10+ bookmarks and scattered apps with a single, coherent command center for your everyday routine.",
  },
  {
    icon: Smartphone,
    title: "Seamless Across Devices",
    description:
      "Fully responsive and optimized whether you're working on a desktop workstation, tablet, or phone on the go.",
  },
  {
    icon: Lock,
    title: "No Sign-up Wall",
    description:
      "Get right to work without mandatory sign-ups. Create an account only when you want persistent cloud sync.",
  },
  {
    icon: Sparkles,
    title: "Continuous Updates",
    description:
      "New tools, enhanced AI workflows, and productivity improvements added weekly based on real user feedback.",
  },
];

export function FeaturesSection() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            The iUseDaily Difference
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for everyday efficiency.
          </h2>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Thoughtfully engineered to eliminate micro-frustrations from your digital life.
            Less clutter, faster results.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-blue text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>

                <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
