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
    <div className="mt-6">
      <p id="scope-filter-label" className="text-sm font-semibold text-ink">
        Project type
      </p>
      <div
        className="mt-2 flex flex-wrap gap-2"
        role="tablist"
        aria-labelledby="scope-filter-label"
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
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand " +
                (isActive
                  ? "bg-brand text-white shadow-sm"
                  : "border border-border bg-surface text-ink hover:bg-border/40")
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
