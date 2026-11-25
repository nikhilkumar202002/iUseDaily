"use client";

import React from "react";
import { ToolBreadcrumbs } from "./tool-breadcrumbs";
import { ToolPageHeader } from "./tool-page-header";
import { ToolWorkspace } from "./tool-workspace";
import { ToolInstructions } from "./tool-instructions";
import { ToolFAQ } from "./tool-faq";
import { RelatedTools } from "./related-tools";
import type { ToolMetadata } from "./types";

interface ToolPageLayoutProps {
  tool: ToolMetadata;
  workspaceContent: React.ReactNode;
  sidebarContent?: React.ReactNode;
}

export function ToolPageLayout({
  tool,
  workspaceContent,
  sidebarContent,
}: ToolPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Breadcrumb Navigation */}
        <ToolBreadcrumbs
          items={[
            { label: "Tools", href: "/tools" },
            { label: tool.category, href: tool.categoryHref },
            { label: tool.name },
          ]}
        />

        {/* Tool Header */}
        <ToolPageHeader
          icon={tool.icon}
          name={tool.name}
          description={tool.description}
          badge={tool.badge}
        />

        {/* Main Workspace with optional configuration sidebar */}
        <ToolWorkspace sidebar={sidebarContent}>
          {workspaceContent}
        </ToolWorkspace>

        {/* Tool Information & Instructions */}
        <ToolInstructions
          toolName={tool.name}
          instructions={tool.instructions}
          features={tool.features}
          privacyNote={tool.privacyNote}
        />

        {/* FAQ Section */}
        <ToolFAQ faqs={tool.faqs} />

        {/* Related Tools */}
        <RelatedTools
          currentToolId={tool.id}
          category={tool.category}
          limit={4}
        />
      </div>
    </div>
  );
}

export default ToolPageLayout;
