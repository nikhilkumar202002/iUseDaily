"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const footerGroups = [
  {
    title: "Platform",
    links: [
      ["All Tools", "/tools"],
      ["PDF Tools", "/tools/pdf"],
      ["Image Tools", "/tools/image"],
      ["Text Tools", "/tools/text"],
      ["Calculators", "/tools/calculators"],
    ],
  },
  {
    title: "Productivity",
    links: [
      ["AI Assistant", "/ai-assistant"],
      ["My Workspace", "/dashboard"],
      ["Tasks & Notes", "/organizer"],
      ["Reminders", "/organizer/reminders"],
      ["Daily Planner", "/organizer/calendar"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["About Us", "/about"],
      ["Blog", "/blog"],
      ["Help Center", "/help"],
      ["Contact", "/contact"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy Policy", "/privacy"],
      ["Terms of Service", "/terms"],
      ["Cookie Policy", "/cookies"],
      ["Disclaimer", "/disclaimer"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">

        {/* Main footer */}
        <div className="grid gap-12 py-16 lg:grid-cols-[1.4fr_2fr]">

          {/* Brand */}
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
                i
              </span>
              <span className="text-xl font-bold tracking-tight">
                iUse<span className="text-primary">Daily</span>
              </span>
            </Link>

            <h3 className="mt-6 text-xl font-semibold tracking-tight">
              Everything you need, every day.
            </h3>

            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Useful online tools, personal productivity and AI
              assistance — all in one place.
            </p>

            <div className="mt-6 flex gap-2">
              {/* GitHub */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-primary hover:bg-surface-blue hover:text-primary"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-primary hover:bg-surface-blue hover:text-primary"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 1 0 0-2.9 1.45 1.45 0 0 0 0 2.9m1.39 9.74V10.13H5.07v8.37h2.78z" />
                </svg>
              </a>

              {/* X / Twitter */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X (Twitter)"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-primary hover:bg-surface-blue hover:text-primary"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h4 className="mb-5 text-sm font-semibold">
                  {group.title}
                </h4>

                <ul className="flex flex-col gap-4">
                  {group.links.map(([label, href]) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-sm text-muted-foreground transition hover:text-primary"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="flex flex-col justify-between gap-6 rounded-2xl border border-border bg-muted/50 p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h3 className="font-semibold">
              Stay updated with iUseDaily
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Product updates, useful tips and everyday inspiration.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="flex w-full max-w-md gap-2"
          >
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="h-11 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            />

            <button
              type="submit"
              className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Subscribe
              <ArrowRight size={15} />
            </button>
          </form>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-border py-7 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © 2026 iUseDaily. All rights reserved.
          </p>

          <p>
            Made for everyday life.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
