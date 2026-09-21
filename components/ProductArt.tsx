import type { Category } from "@/lib/types";

const SILHOUETTE: Record<Category, string> = {
  tee: "M70 78 h18 l8-22 h16 l8 22 h18 l-10 92 H80 Z",
  tank: "M78 74 h44 l6 96 H72 Z M70 86 h14 M116 86 h14",
  shorts: "M62 78 h76 l-8 28 -22 70 h-18 l8-48 -8 48 H78 L70 176 48 106 Z",
  hoodie: "M74 70 q26-28 52 0 l10 18 16-8 -6 28 -8 84 H70 L62 108 54 80 70 88 Z",
  joggers: "M68 70 h64 l-4 36 -16 96 h-16 l6-62 -6 62 h-16 L84 166 68 106 Z",
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
        <rect width="200" height="240" fill="#262a22" />
        <path d={SILHOUETTE[category]} fill={swatch} stroke="#d7c4a3" strokeWidth="2" />
      </svg>
    </div>
  );
}
