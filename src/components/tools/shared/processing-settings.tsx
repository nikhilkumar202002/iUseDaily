"use client";

import React from "react";
import { Sliders } from "lucide-react";
import type { PdfProcessingOptions, ImageProcessingOptions } from "./types";

interface SettingsContainerProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SettingsContainer({
  title = "Configuration",
  icon = <Sliders className="h-4 w-4 text-primary" />,
  children,
  className = "",
}: SettingsContainerProps) {
  return (
    <aside
      className={`flex h-full flex-col justify-between gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 ${className}`}
    >
      <div className="flex flex-1 flex-col gap-5">
        {title && (
          <div className="flex items-center gap-2.5 border-b border-border pb-3.5">
            {icon}
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-4">{children}</div>
      </div>
    </aside>
  );
}

/**
 * Reusable PDF processing settings panel
 */
export interface PdfSettingsProps {
  settings: PdfProcessingOptions;
  onChange: (updated: PdfProcessingOptions) => void;
  disabled?: boolean;
}

export function PdfSettings({
  settings,
  onChange,
  disabled = false,
}: PdfSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Output Filename
        </label>
        <div className="relative">
          <input
            type="text"
            value={settings.outputFilename}
            onChange={(e) =>
              onChange({ ...settings, outputFilename: e.target.value })
            }
            disabled={disabled}
            placeholder="document.pdf"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-muted-foreground">
            .pdf
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <label className="flex items-center gap-2.5 text-xs font-medium text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(settings.includeBookmarks)}
            onChange={(e) =>
              onChange({ ...settings, includeBookmarks: e.target.checked })
            }
            disabled={disabled}
            className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary"
          />
          <span>Include bookmarks table of contents</span>
        </label>
      </div>

      {settings.compressionLevel !== undefined && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Compression Level
          </label>
          <select
            value={settings.compressionLevel}
            onChange={(e) =>
              onChange({
                ...settings,
                compressionLevel: e.target.value as "none" | "low" | "medium" | "high",
              })
            }
            disabled={disabled}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="none">None (Maximum quality)</option>
            <option value="low">Low (Recommended)</option>
            <option value="medium">Medium</option>
            <option value="high">High (Smallest size)</option>
          </select>
        </div>
      )}
    </div>
  );
}

/**
 * Reusable Image processing settings panel
 */
export interface ImageSettingsProps {
  settings: ImageProcessingOptions;
  onChange: (updated: ImageProcessingOptions) => void;
  disabled?: boolean;
}

export function ImageSettings({
  settings,
  onChange,
  disabled = false,
}: ImageSettingsProps) {
  return (
    <div className="space-y-4">
      {/* Output Format */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Target Format
        </label>
        <select
          value={settings.outputFormat}
          onChange={(e) =>
            onChange({
              ...settings,
              outputFormat: e.target.value as ImageProcessingOptions["outputFormat"],
            })
          }
          disabled={disabled}
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        >
          <option value="original">Keep original format</option>
          <option value="image/png">PNG (Lossless)</option>
          <option value="image/jpeg">JPEG (Compressed)</option>
          <option value="image/webp">WebP (Modern & Compact)</option>
        </select>
      </div>

      {/* Quality Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-foreground">Quality</label>
          <span className="font-mono text-muted-foreground">{settings.quality}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          value={settings.quality}
          onChange={(e) =>
            onChange({ ...settings, quality: Number(e.target.value) })
          }
          disabled={disabled}
          className="h-2 w-full cursor-pointer accent-primary disabled:opacity-50"
        />
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground">Width (px)</label>
          <input
            type="number"
            value={settings.width || ""}
            onChange={(e) =>
              onChange({
                ...settings,
                width: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="Auto"
            disabled={disabled}
            className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-foreground">Height (px)</label>
          <input
            type="number"
            value={settings.height || ""}
            onChange={(e) =>
              onChange({
                ...settings,
                height: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="Auto"
            disabled={disabled}
            className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Maintain Aspect Ratio */}
      <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={settings.maintainAspectRatio}
          onChange={(e) =>
            onChange({ ...settings, maintainAspectRatio: e.target.checked })
          }
          disabled={disabled}
          className="h-4 w-4 rounded border-border text-primary accent-primary"
        />
        <span>Preserve original aspect ratio</span>
      </label>
    </div>
  );
}

export default SettingsContainer;
