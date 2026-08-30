import type { PortfolioItem } from "@/lib/api";
import PortfolioCard from "@/components/portfolio/PortfolioCard";

interface PortfolioGridProps {
  items: PortfolioItem[];
  onImageClick: (item: PortfolioItem, galleryIndex: number) => void;
}

/**
 * Renders a responsive grid of portfolio cards.
 * Pure presentational — data fetching and filtering are handled by the parent.
 */
export default function PortfolioGrid({ items, onImageClick }: PortfolioGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ease-in-out">
      {items.map((item) => (
        <PortfolioCard
          key={item.id}
          item={item}
          onImageClick={(galleryIndex) => onImageClick(item, galleryIndex)}
        />
      ))}
    </div>
  );
}
