"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ShieldCheck,
  Check,
  Lock,
} from "lucide-react";

export function CtaSection() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      router.push(`/register?email=${encodeURIComponent(email)}`);
    } else {
      router.push("/register");
    }
  };

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 px-6 py-20 text-center text-white shadow-2xl shadow-blue-500/10 sm:px-16 sm:py-28 border border-slate-800">
          
          {/* Glowing background mesh & flares */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 bg-gradient-to-b from-blue-500/20 to-transparent blur-2xl" />

          <div className="relative z-10 mx-auto max-w-3xl">
            {/* Headline */}
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Ready to reclaim your
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                digital focus?
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Join over 50,000+ creators, students, and professionals who save hours every week
              with iUseDaily’s all-in-one productivity suite.
            </p>

            {/* Quick Email Capture / CTA Bar */}
            <form
              onSubmit={handleSignup}
              className="mx-auto mt-10 flex max-w-md flex-col gap-2.5 sm:flex-row sm:items-center"
            >
              <div className="flex h-13 flex-1 items-center rounded-2xl border border-slate-700 bg-slate-800/80 px-4 text-sm shadow-inner backdrop-blur-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 outline-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:opacity-95 hover:shadow-xl active:scale-[0.98]"
              >
                <span>Get started free</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Secondary Action */}
            <div className="mt-4">
              <Link
                href="/tools"
                className="text-xs font-semibold text-slate-400 transition-colors hover:text-white underline underline-offset-4"
              >
                Or explore 50+ tools without an account &rarr;
              </Link>
            </div>

            {/* Trust and Social Proof Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 border-t border-slate-800/80 pt-8 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Instant access in seconds</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-blue-400" />
                <span>Bank-grade local privacy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <span>Zero telemetry or tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CtaSection;
