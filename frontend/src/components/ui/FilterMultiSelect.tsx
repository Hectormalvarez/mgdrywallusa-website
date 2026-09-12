"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterMultiSelectProps {
  /** Visible label for the control, e.g. "Project type". */
  label: string;
  options: FilterOption[];
  /** Currently selected option values. */
  selected: string[];
  onChange: (values: string[]) => void;
  /** Colour theme; `brand` for the primary filter, `accent` for the secondary. */
  tone?: "brand" | "accent";
  /**
   * Which edge of the trigger the panel is anchored to. Use `right` for a
   * control that sits near the right edge of its container, so the panel does
   * not overflow the viewport.
   */
  align?: "left" | "right";
}

/**
 * Compact multi-select filter control.
 *
 * Renders a single trigger button (visible label + summary) that expands into a
 * panel of checkboxes, so several values can be selected without the filter
 * chips taking over the page.
 */
export default function FilterMultiSelect({
  label,
  options,
  selected,
  onChange,
  tone = "brand",
  align = "left",
}: FilterMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = `${useId()}-panel`;

  // Close when clicking outside of this control.
  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  // Escape closes the panel and returns focus to the trigger.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (options.length === 0) return null;

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((current) => current !== value)
        : [...selected, value]
    );
  };

  const summary =
    selected.length === 0
      ? "All"
      : selected.length === 1
        ? options.find((option) => option.value === selected[0])?.label ?? "1 selected"
        : `${selected.length} selected`;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-border/40",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          tone === "accent"
            ? "focus-visible:outline-accent"
            : "focus-visible:outline-brand",
          selected.length > 0 &&
            (tone === "accent"
              ? "border-accent/50 text-accent-strong"
              : "border-brand/50 text-brand")
        )}
      >
        <span>{label}</span>
        <span className="font-normal text-muted">{summary}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={cn(
            "h-4 w-4 text-muted transition-transform duration-200",
            open && "rotate-180"
          )}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={label}
          className={cn(
            "absolute z-30 mt-2 max-h-64 w-56 overflow-auto rounded-lg border border-border bg-surface p-1.5 shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {options.map((option) => {
            const isChecked = selected.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink transition-colors hover:bg-border/40"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(option.value)}
                  className={cn(
                    "h-4 w-4 rounded border-border",
                    tone === "accent" ? "accent-accent" : "accent-brand"
                  )}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
