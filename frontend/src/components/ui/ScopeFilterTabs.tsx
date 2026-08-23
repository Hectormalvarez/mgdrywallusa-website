"use client";

import type { PortfolioScope } from "@/types/portfolio";

const TABS: { value: PortfolioScope | "all"; label: string }[] = [
  { value: "all", label: "All Projects" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "adu_renovation", label: "ADU & Remodel" },
];

interface ScopeFilterTabsProps {
  activeScope: PortfolioScope | "all";
  onScopeChange: (scope: PortfolioScope | "all") => void;
}

export default function ScopeFilterTabs({
  activeScope,
  onScopeChange,
}: ScopeFilterTabsProps) {
  return (
    <div
      className="mt-6 flex flex-wrap gap-2"
      role="tablist"
      aria-label="Filter projects by scope"
    >
      {TABS.map((tab) => {
        const isActive = activeScope === tab.value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onScopeChange(tab.value)}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ease-in-out " +
              (isActive
                ? "bg-brand text-white shadow-sm"
                : "bg-border/40 text-muted hover:bg-border/70 hover:text-ink")
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
