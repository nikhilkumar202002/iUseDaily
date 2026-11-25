"use client";

import React from "react";

interface ToolSidebarProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function ToolSidebar({
  title = "Configuration",
  children,
  className = "",
}: ToolSidebarProps) {
  return (
    <aside
      className={`flex h-full flex-col justify-between gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 ${className}`}
    >
      <div className="flex flex-1 flex-col gap-4">
        {title && (
          <div className="border-b border-border pb-3.5">
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-4">{children}</div>
      </div>
    </aside>
  );
}

export default ToolSidebar;
