"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { tools } from "@/app/config/tools";

export function PopularTools() {
  const featuredTools = tools.filter((tool) => tool.featured);

  return (
    <section className="mb-14">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Featured tools
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Handpicked essentials used by thousands of people every day.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Quick Launch</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featuredTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              href={tool.href}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-blue text-primary transition-all duration-200 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>

                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    Featured
                  </span>
                </div>

                <div className="mt-5">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {tool.category} Tool
                  </span>
                  <h3 className="mt-1 text-base font-bold text-foreground transition-colors group-hover:text-primary">
                    {tool.name}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4 text-xs font-semibold text-primary">
                <span>Launch tool</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default PopularTools;
