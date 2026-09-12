"use client";

interface TagFilterProps {
  tags: string[];
  activeTags: string[];
  onTagToggle: (tag: string) => void;
}

export default function TagFilter({ tags, activeTags, onTagToggle }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="mt-4">
      <p id="tag-filter-label" className="text-sm font-semibold text-ink">
        Finish
      </p>
      <div
        className="mt-2 flex flex-wrap gap-2"
        role="group"
        aria-labelledby="tag-filter-label"
      >
        {tags.map((tag) => {
          const isActive = activeTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              role="checkbox"
              aria-checked={isActive}
              aria-label={tag}
              onClick={() => onTagToggle(tag)}
              className={
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
                (isActive
                  ? "bg-accent text-white"
                  : "border border-accent/30 bg-accent-tint/40 text-accent-strong hover:bg-accent-tint/70")
              }
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
