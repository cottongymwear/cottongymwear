import { useId } from "react";
import type { Product } from "@/lib/types";

export type GarmentKind = "tee" | "v-neck" | "tank" | "long-sleeve";

type Shape = {
  body: string;
  inside: string;
  rib: string;
  seams: string[];
  shadows: string[];
};

const CREW_NECK = "M158 64 C170 92 230 92 242 64";
const V_NECK = "M158 64 Q180 100 200 124 Q220 100 242 64";
const TEE_SLEEVES_AND_BODY =
  "Q272 70 308 86 L372 146 L336 184 L302 160 C300 250 302 330 306 400 Q200 412 94 400 C98 330 100 250 98 160 L64 184 L28 146 L92 86 Q128 70 158 64 Z";
const TEE_SEAMS = [
  "M92 86 Q106 124 98 160",
  "M308 86 Q294 124 302 160",
  "M37 138 L73 176",
  "M363 138 L327 176",
  "M95 386 Q200 398 305 386",
];
const BODY_SHADOWS = ["M146 176 C158 250 144 320 156 388", "M256 190 C246 262 260 330 248 388"];

/** Flat-lay silhouettes drawn on a 400 × 480 canvas, centred on x = 200. */
const SHAPES: Record<GarmentKind, Shape> = {
  tee: {
    body: `${CREW_NECK} ${TEE_SLEEVES_AND_BODY}`,
    inside: `M158 64 Q200 50 242 64 C230 90 170 90 158 64 Z`,
    rib: `${CREW_NECK} L251 68 C236 104 164 104 149 68 Z`,
    seams: TEE_SEAMS,
    shadows: BODY_SHADOWS,
  },
  "v-neck": {
    body: `${V_NECK} ${TEE_SLEEVES_AND_BODY}`,
    inside: `M158 64 Q200 50 242 64 Q220 100 200 124 Q180 100 158 64 Z`,
    rib: `${V_NECK} L251 68 Q226 112 200 140 Q174 112 149 68 Z`,
    seams: TEE_SEAMS,
    shadows: BODY_SHADOWS,
  },
  "long-sleeve": {
    body: `${CREW_NECK} Q272 70 308 86 C334 150 354 280 366 370 L334 382 C324 300 310 226 302 172 C300 260 302 330 306 400 Q200 412 94 400 C98 330 100 260 98 172 C90 226 76 300 66 382 L34 370 C46 280 66 150 92 86 Q128 70 158 64 Z`,
    inside: `M158 64 Q200 50 242 64 C230 90 170 90 158 64 Z`,
    rib: `${CREW_NECK} L251 68 C236 104 164 104 149 68 Z`,
    seams: [
      "M92 86 Q108 130 98 172",
      "M308 86 Q292 130 302 172",
      "M36 354 L68 366",
      "M364 354 L332 366",
      "M95 386 Q200 398 305 386",
    ],
    shadows: [...BODY_SHADOWS, "M80 190 C74 260 70 320 62 362", "M320 190 C326 260 330 320 338 362"],
  },
  tank: {
    body: "M150 56 L180 56 C186 108 214 108 220 56 L250 56 C252 112 268 150 302 170 C298 260 300 330 304 404 Q200 416 96 404 C100 330 102 260 98 170 C132 150 148 112 150 56 Z",
    inside: "M180 56 Q200 68 220 56 C214 108 186 108 180 56 Z",
    rib: "M180 56 C186 108 214 108 220 56 L228 56 C222 120 178 120 172 56 Z",
    seams: [
      "M244 56 C247 114 264 154 296 176",
      "M156 56 C153 114 136 154 104 176",
      "M99 390 Q200 402 301 390",
    ],
    shadows: ["M160 200 C170 270 156 330 166 390", "M244 190 C234 270 248 330 240 390"],
  },
};

export function garmentKind(product: Pick<Product, "category" | "neckline">): GarmentKind {
  if (product.category === "tee" && product.neckline === "v") return "v-neck";
  return product.category;
}

function isDark(hex: string): boolean {
  const value = hex.replace("#", "");
  if (value.length !== 6) return true;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
}

/** An SVG group; place it inside an <svg> using the 400 × 480 coordinate space. */
export function Garment({
  kind,
  swatch,
  transform,
}: {
  kind: GarmentKind;
  swatch: string;
  transform?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const shape = SHAPES[kind];
  const dark = isDark(swatch);
  const seam = dark ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.13)";

  return (
    <g transform={transform}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={shape.body} />
        </clipPath>
        <linearGradient id={`${id}-light`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={dark ? 0.1 : 0.5} />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={dark ? 0.22 : 0.07} />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#1c1a16" floodOpacity="0.14" />
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1c1a16" floodOpacity="0.08" />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <path d={shape.body} fill={swatch} filter={`url(#${id}-shadow)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <path d={shape.body} fill={`url(#${id}-light)`} />
        <g filter={`url(#${id}-soft)`} fill="none" strokeLinecap="round">
          {shape.shadows.map((d) => (
            <path key={d} d={d} stroke="#000" strokeOpacity={dark ? 0.15 : 0.06} strokeWidth="18" />
          ))}
          <path d="M200 110 C196 210 204 310 200 396" stroke="#fff" strokeOpacity={dark ? 0.035 : 0.35} strokeWidth="56" />
        </g>
        <path d={shape.inside} fill="#000" fillOpacity={dark ? 0.35 : 0.1} />
        <path d={shape.rib} fill="#000" fillOpacity={dark ? 0.18 : 0.045} />
        <g fill="none" stroke={seam} strokeWidth="1.4" strokeLinecap="round">
          {shape.seams.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </g>
      {dark ? null : <path d={shape.body} fill="none" stroke="#000" strokeOpacity="0.09" strokeWidth="1.2" />}
    </g>
  );
}
