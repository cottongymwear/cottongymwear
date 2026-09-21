import type { Category } from "@/lib/types";

const SILHOUETTE: Record<Category, string> = {
  tee: "M70 78 h18 l8-22 h16 l8 22 h18 l-10 92 H80 Z",
  tank: "M78 74 h44 l6 96 H72 Z",
  "long-sleeve": "M46 78 h22 l8-16 h12 l6 16 h20 l6-16 h12 l8 16 h22 l-14 92 H60 Z",
};

export function ProductArt({
  category,
  swatch,
  title,
}: {
  category: Category;
  swatch: string;
  title: string;
}) {
  return (
    <div className="art">
      <svg
        viewBox="0 0 200 240"
        role={title ? "img" : "presentation"}
        aria-label={title || undefined}
        aria-hidden={title ? undefined : true}
      >
        <rect width="200" height="240" fill="#f2f1ed" />
        <path d={SILHOUETTE[category]} fill={swatch} stroke="#c8c4ba" strokeWidth="2" />
      </svg>
    </div>
  );
}
