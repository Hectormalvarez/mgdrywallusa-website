"use client";

interface TagFilterProps {
  tags: string[];
  activeTags: string[];
  onTagToggle: (tag: string) => void;
}

export default function TagFilter({ tags, activeTags, onTagToggle }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div
      className="mt-3 flex flex-wrap gap-2"
      role="group"
      aria-label="Filter projects by finish tag"
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
              "rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 " +
              (isActive
                ? "bg-accent text-white"
                : "bg-accent-tint/30 text-accent hover:bg-accent-tint/60")
            }
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
