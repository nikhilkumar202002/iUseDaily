
"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  FileText,
  Image,
  FileType,
  Calculator,
  CalendarDays,
  CheckSquare,
  Sparkles,
  WandSparkles,
  Zap,
  ShieldCheck,
  Globe2,
} from "lucide-react";
import { useState } from "react";

const popularTools = [
  {
    name: "PDF Converter",
    description: "Convert files to and from PDF.",
    icon: FileType,
    category: "PDF",
  },
  {
    name: "Image Compressor",
    description: "Reduce image size without the hassle.",
    icon: Image,
    category: "IMAGE",
  },
  {
    name: "Word Counter",
    description: "Count words and characters instantly.",
    icon: FileText,
    category: "TEXT",
  },
  {
    name: "Percentage Calculator",
    description: "Calculate percentages in seconds.",
    icon: Calculator,
    category: "CALCULATOR",
  },
];

const modules = [
  {
    number: "01",
    title: "Everyday Tools",
    description:
      "A collection of practical tools to help you handle everyday digital tasks quickly and easily.",
    features: ["PDF & file tools", "Image utilities", "Text tools", "Calculators"],
    icon: Zap,
    href: "/tools",
    label: "Explore tools",
  },
  {
    number: "02",
    title: "Personal Organizer",
    description:
      "Bring your tasks, notes, reminders and plans together in one organized personal space.",
    features: ["Task management", "Notes & lists", "Reminders", "Daily planning"],
    icon: CalendarDays,
    href: "/organizer",
    label: "Explore organizer",
  },
  {
    number: "03",
    title: "AI Assistant",
    description:
      "Get help with writing, ideas, summaries, translations and everyday questions.",
    features: ["AI writing", "Summarization", "Translation", "Everyday assistance"],
    icon: Sparkles,
    href: "/ai-assistant",
    label: "Meet your assistant",
  },
];

function HeroSection() {
  const [search, setSearch] = useState("");

  return (
    <section className="relative overflow-hidden px-5 pb-24 pt-24 sm:px-8 sm:pt-32">
      <div className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[110px]" />

      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
          <Sparkles size={14} className="text-primary" />
          Your everyday digital companion
          <ArrowUpRight size={13} />
        </div>

        <h1 className="text-4xl font-bold leading-[1.12] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
          Everything you need.
          <br />
          <span className="text-primary">All in one place.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
          Simplify your everyday life with useful online tools, smarter
          organization and an AI assistant that helps you get things done.
        </p>

        <div className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row">
          <div className="flex h-14 flex-1 items-center gap-3 rounded-full border border-border bg-card px-5 shadow-sm focus-within:border-primary">
            <Search size={19} className="shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="What do you need today?"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Link
            href={search.trim() ? `/tools?q=${encodeURIComponent(search)}` : "/tools"}
            className="flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Explore tools <ArrowRight size={17} />
          </Link>
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          Free everyday tools · Personal workspace · AI-powered assistance
        </p>
      </div>
    </section>
  );
}

function ToolsSection() {
  return (
    <section className="border-y border-border bg-muted/50 px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Everyday essentials
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tools that make life easier.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Useful solutions for the little things you do every day.
            </p>
          </div>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            View all tools <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                href="/tools"
                key={tool.name}
                className="group rounded-2xl border border-border bg-card p-6 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="mb-7 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-blue text-primary">
                    <Icon size={21} />
                  </span>
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
                    {tool.category}
                  </span>
                </div>
                <h3 className="font-semibold">{tool.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {tool.description}
                </p>
                <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-primary">
                  Use tool
                  <ArrowUpRight
                    size={14}
                    className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ModulesSection() {
  return (
    <section className="px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            One platform. More possibilities.
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your everyday life, better organized.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Everything works together to give you a simpler, more productive
            digital experience.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.number}
                className="flex flex-col rounded-2xl border border-border bg-card p-7 sm:p-8"
              >
                <div className="mb-8 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-blue text-primary">
                    <Icon size={23} />
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {module.number} / 03
                  </span>
                </div>

                <h3 className="text-xl font-bold">{module.title}</h3>
                <p className="mt-3 min-h-20 text-sm leading-7 text-muted-foreground">
                  {module.description}
                </p>

                <ul className="mt-6 flex flex-col gap-3">
                  {module.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-blue text-primary">
                        <CheckSquare size={12} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={module.href}
                  className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                >
                  {module.label} <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const benefits = [
    {
      icon: ShieldCheck,
      title: "Simple and accessible",
      description: "An easy-to-use experience designed for everyone.",
    },
    {
      icon: Globe2,
      title: "Made for everyday use",
      description: "Useful solutions you can access whenever you need them.",
    },
    {
      icon: WandSparkles,
      title: "Smarter with AI",
      description: "Get intelligent help with everyday tasks and ideas.",
    },
  ];

  return (
    <section className="border-y border-border bg-muted/50 px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            The iUseDaily difference
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            Less effort. More everyday progress.
          </h2>
        </div>

        <div className="grid gap-10 md:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.title} className="text-center">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-blue text-primary">
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold">{benefit.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary px-7 py-16 text-center text-white sm:px-14">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
          <Sparkles size={23} />
        </div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Make every day a little easier.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-blue-100">
          Discover useful tools, stay organized and get more done with
          iUseDaily.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          Get started for free <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ToolsSection />
      <ModulesSection />
      <BenefitsSection />
      <CTASection />
    </main>
  );
}
