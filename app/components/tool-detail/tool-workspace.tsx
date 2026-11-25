"use client";

import React from "react";

interface ToolWorkspaceProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

export function ToolWorkspace({
  children,
  sidebar,
  className = "",
}: ToolWorkspaceProps) {
  if (sidebar) {
    return (
      <div className={`mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 ${className}`}>
        {/* Main processing area */}
        <div className="lg:col-span-8">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {children}
          </div>
        </div>

        {/* Configuration / Options Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-24">{sidebar}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-8 ${className}`}>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}

export default ToolWorkspace;
