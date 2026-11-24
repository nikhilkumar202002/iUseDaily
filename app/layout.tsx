
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "./components/providers/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iUseDaily – Free Online Tools, AI Assistant & Daily Planner",
  description:
    "Simplify everyday life with iUseDaily. Explore free online tools, organize tasks and reminders, and get things done faster with AI assistance.",
  applicationName: "iUseDaily",
  keywords: [
    "free online tools",
    "daily productivity tools",
    "AI assistant",
    "online utilities",
    "task organizer",
    "daily planner",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
