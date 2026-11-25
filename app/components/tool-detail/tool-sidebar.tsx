"use client";

import React from "react";

interface ToolSidebarProps {
  title?: string;
  children: React.ReactNode;
}

export function ToolSidebar({
  title = "Configuration",
  children,
}: ToolSidebarProps) {
  return (
    <aside className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      {title && (
        <div className="border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
        </div>
      )}
      <div className="flex flex-col gap-4">{children}</div>
    </aside>
  );
}

export default ToolSidebar;
