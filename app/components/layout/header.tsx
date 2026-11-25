"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
  ArrowRight,
  Search,
} from "lucide-react";

export interface NavLinkItem {
  label: string;
  href: string;
  badge?: string;
}

const defaultNavLinks: NavLinkItem[] = [
  { label: "Tools", href: "/tools" },
  { label: "Organizer", href: "/organizer" },
  { label: "AI Assistant", href: "/ai-assistant", badge: "AI" },
  { label: "Pricing", href: "/pricing" },
];

function subscribeScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

function getScrollSnapshot() {
  return window.scrollY > 15;
}

function getScrollServerSnapshot() {
  return false;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className={`group relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all duration-200 hover:border-primary/50 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
    >
      <Sun className="h-4 w-4 hidden text-amber-400 transition-transform duration-300 group-hover:rotate-45 dark:block" />
      <Moon className="h-4 w-4 block text-slate-700 transition-transform duration-300 group-hover:-rotate-12 dark:hidden" />
    </button>
  );
}

export function Header({
  navLinks = defaultNavLinks,
}: {
  navLinks?: NavLinkItem[];
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isScrolled = useSyncExternalStore(
    subscribeScroll,
    getScrollSnapshot,
    getScrollServerSnapshot
  );

  // Adjust state when pathname changes during render without an effect (React 19 pattern)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-4 duration-700 ${
        isScrolled || mobileMenuOpen
          ? "bg-background/85 backdrop-blur-xl shadow-sm shadow-black/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* 3-Column Grid Layout */}
        <div className="grid w-full grid-cols-2 items-center md:grid-cols-3">
          
          {/* COLUMN 1: Logo */}
          <div className="flex items-center justify-start">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="group flex items-center gap-2.5 rounded-lg p-0.5 transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="iUseDaily Home - Scroll to top"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform duration-200 group-hover:scale-105">
                <span className="text-lg font-black tracking-tighter">i</span>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-300"></span>
                </span>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                iUse<span className="font-black text-primary">Daily</span>
              </span>
            </Link>
          </div>

          {/* COLUMN 2: Menu (Desktop) */}
          <nav
            aria-label="Main Navigation"
            className="hidden items-center justify-center gap-1 md:flex"
          >
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && Boolean(pathname?.startsWith(link.href)));
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`group relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-muted font-semibold text-primary"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  {link.label}
                  {link.badge && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      <Sparkles className="h-2.5 w-2.5" />
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* COLUMN 3: Search, Dark/Light Mode, Sign in, Get started */}
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            {/* Quick Search Action */}
            <Link
              href="/tools"
              aria-label="Search tools"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Search className="h-4 w-4" />
            </Link>

            {/* Dark / Light Mode Toggle */}
            <ThemeToggle />

            {/* Desktop Auth & CTA Buttons */}
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition-all duration-200 hover:opacity-95 hover:shadow-md hover:shadow-primary/30 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span>Get started</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background/95 px-4 py-5 backdrop-blur-xl md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && Boolean(pathname?.startsWith(link.href)));
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-muted font-semibold text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      <Sparkles className="h-3 w-3" />
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="my-2 border-t border-border pt-2" />

            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
            >
              <span>Get started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
