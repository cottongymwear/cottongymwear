import type { Product } from "@/lib/types";
import { Garment, garmentKind } from "./Garment";

export function ProductArt({
  product,
  colorId,
  title = "",
  className = "art",
}: {
  product: Pick<Product, "category" | "neckline" | "colors">;
  colorId?: string;
  title?: string;
  className?: string;
}) {
  const color = product.colors.find((entry) => entry.id === colorId) ?? product.colors[0];
  return (
    <div className={className}>
      <svg
        viewBox="0 -10 400 500"
        role={title ? "img" : undefined}
        aria-label={title || undefined}
        aria-hidden={title ? undefined : true}
        focusable="false"
      >
        <Garment
          kind={garmentKind(product)}
          swatch={color?.swatch ?? "#141414"}
          transform="translate(200 240) scale(0.84) translate(-200 -240)"
        />
      </svg>
    </div>
  );
}
