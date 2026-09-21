import type { Audience, Category, Product, Size } from "./types";

/**
 * Sample retail catalog for Cotton Gym Wear.
 *
 * Jersey tees and tanks map to Printful blanks whose solid colours are 100% cotton.
 * Fleece shorts, the hoodie, and joggers are cotton-faced blends — labeled as such.
 * Heather colourways are omitted on purpose.
 *
 * `variants[].syncVariantId` and `catalogVariantId` stay null until a Printful
 * store product is linked (see lib/printful.ts). Match sync variants by SKU,
 * which is also the Printful external_id to set on each variant.
 */

const COLORS = [
  { id: "black", name: "Black", swatch: "#141414" },
  { id: "white", name: "White", swatch: "#f3f0e8" },
  { id: "navy", name: "Navy", swatch: "#1b2744" },
] as const;

const MENS_SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];
const WOMENS_SIZES: Size[] = ["XS", "S", "M", "L", "XL"];
const UNISEX_SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];

const JERSEY = {
  label: "100% cotton",
  detail:
    "Solid colours on this blank are 100% cotton. Heather colourways are blends, so they are not sold here.",
  claim: "100" as const,
};

function variantsFor(productId: string, sizes: Size[]): Product["variants"] {
  const variants: Product["variants"] = [];
  for (const color of COLORS) {
    for (const size of sizes) {
      variants.push({
        sku: `${productId}-${color.id}-${size.toLowerCase()}`,
        color: color.name,
        colorId: color.id,
        size,
        catalogVariantId: null,
        syncVariantId: null,
      });
    }
  }
  return variants;
}

function product(
  input: Omit<Product, "colors" | "variants"> & { sizes: Size[] },
): Product {
  return {
    ...input,
    colors: COLORS.map((color) => ({ ...color })),
    variants: variantsFor(input.id, input.sizes),
  };
}

export const CATALOG: Product[] = [
  product({
    id: "cgw-mens-training-tee",
    slug: "mens-training-tee",
    name: "Training Tee",
    audience: "men",
    category: "tee",
    summary: "Light cotton crew for lifting and the rest of the day.",
    description:
      "A straight cotton crew with a bit of room through the chest. Made for the gym floor and the walk home, not a race tee.",
    price: 3200,
    sizes: MENS_SIZES,
    fabric: JERSEY,
    printful: {
      catalogProductId: 71,
      blank: "Bella + Canvas 3001",
      technique: "dtg",
    },
  }),
  product({
    id: "cgw-mens-muscle-tank",
    slug: "mens-muscle-tank",
    name: "Muscle Tank",
    audience: "men",
    category: "tank",
    summary: "Sleeveless cotton jersey with a deeper armhole.",
    description:
      "Cut for shoulder work and warm rooms. The jersey is light, so it dries faster than a fleece layer between sets.",
    price: 2800,
    sizes: MENS_SIZES,
    fabric: JERSEY,
    printful: {
      catalogProductId: 248,
      blank: "Bella + Canvas 3480",
      technique: "dtg",
    },
  }),
  product({
    id: "cgw-mens-fleece-short",
    slug: "mens-fleece-short",
    name: "Fleece Training Short",
    audience: "men",
    category: "shorts",
    summary: "Midweight cotton-rich fleece short with a 9 inch fit.",
    description:
      "A warm-up short, not a running split. Cotton-faced fleece with an elastic waist — easy over compression shorts.",
    price: 3800,
    sizes: MENS_SIZES,
    fabric: {
      label: "80% cotton / 20% polyester",
      detail:
        "Independent Trading Co. IND20SRT is a cotton-rich fleece, not 100% cotton jersey. Confirm the fibre line on the blank in Printful before launch.",
      claim: "blend",
    },
    printful: {
      catalogProductId: 482,
      blank: "Independent Trading Co. IND20SRT",
      technique: "dtg",
    },
  }),
  product({
    id: "cgw-womens-relaxed-tee",
    slug: "womens-relaxed-tee",
    name: "Relaxed Tee",
    audience: "women",
    category: "tee",
    summary: "Relaxed cotton crew with a dropped shoulder.",
    description:
      "A women’s relaxed tee in cotton jersey. Enough ease to train in, plain enough to wear out of the gym.",
    price: 3200,
    sizes: WOMENS_SIZES,
    fabric: JERSEY,
    printful: {
      catalogProductId: 360,
      blank: "Bella + Canvas 6400",
      technique: "dtg",
    },
  }),
  product({
    id: "cgw-womens-v-neck",
    slug: "womens-v-neck-tee",
    name: "V-Neck Tee",
    audience: "women",
    category: "tee",
    summary: "Cotton jersey v-neck for training and easy days.",
    description:
      "A lighter neckline in the same 100% cotton jersey idea as the crew. Solid colours only.",
    price: 3200,
    sizes: WOMENS_SIZES,
    fabric: {
      label: "100% cotton",
      detail:
        "Bella + Canvas 6005 solids are 100% cotton. The Printful catalog product id is left unset until you confirm it with GET /products — link the SKU by external id either way.",
      claim: "100",
    },
    printful: {
      catalogProductId: null,
      blank: "Bella + Canvas 6005",
      technique: "dtg",
    },
  }),
  product({
    id: "cgw-womens-muscle-tank",
    slug: "womens-muscle-tank",
    name: "Muscle Tank",
    audience: "women",
    category: "tank",
    summary: "Cotton muscle tank with a high neck and open armhole.",
    description:
      "A women’s jersey tank for lifting. Pair it with the studio short on cooler floors.",
    price: 2800,
    sizes: WOMENS_SIZES,
    fabric: {
      label: "100% cotton",
      detail:
        "Bella + Canvas 6008 solids are 100% cotton. Confirm the Printful catalog product id before you rely on live shipping quotes; external SKU matching still works without it.",
      claim: "100",
    },
    printful: {
      catalogProductId: null,
      blank: "Bella + Canvas 6008",
      technique: "dtg",
    },
  }),
  product({
    id: "cgw-womens-studio-short",
    slug: "womens-studio-short",
    name: "Studio Short",
    audience: "women",
    category: "shorts",
    summary: "Cotton-rich fleece short for warm-ups and studio work.",
    description:
      "A short fleece layer, not a split running short. The fibre is a cotton blend — read the label before you treat it like jersey.",
    price: 3600,
    sizes: WOMENS_SIZES,
    fabric: {
      label: "Cotton-rich fleece",
      detail:
        "Printful’s women’s fleece shorts are cotton/poly blends, not 100% cotton. Pick the blank in your Printful store and set its external ids to these SKUs. Do not describe this one as 100% cotton.",
      claim: "blend",
    },
    printful: {
      catalogProductId: null,
      blank: "Women’s cotton-rich fleece short (confirm blank)",
      technique: "dtg",
    },
  }),
  product({
    id: "cgw-heavyweight-tee",
    slug: "heavyweight-tee",
    name: "Heavyweight Tee",
    audience: "unisex",
    category: "tee",
    summary: "Garment-dyed heavyweight cotton with a broken-in hand.",
    description:
      "A heavier ringspun tee for people who want cotton that feels substantial. Unisex sizing. Solid pigment colours only.",
    price: 3600,
    sizes: UNISEX_SIZES,
    fabric: {
      label: "100% cotton",
      detail:
        "Comfort Colors 1717 is 100% ring-spun cotton. We list black, white, and navy — not the heathered pigment shades.",
      claim: "100",
    },
    printful: {
      catalogProductId: 586,
      blank: "Comfort Colors 1717",
      technique: "dtg",
    },
  }),
  product({
    id: "cgw-warmup-hoodie",
    slug: "warm-up-hoodie",
    name: "Warm-Up Hoodie",
    audience: "unisex",
    category: "hoodie",
    summary: "Cotton-faced fleece hoodie for before and after training.",
    description:
      "A premium pullover for the walk in and the cool-down. The face feels like cotton; the fleece is a blend, and the product says so.",
    price: 6200,
    sizes: UNISEX_SIZES,
    fabric: {
      label: "65% cotton / 35% polyester",
      detail:
        "Cotton Heritage M2580 is a cotton-faced fleece: 65/35 cotton/polyester (heathers differ). It is not a 100% cotton garment.",
      claim: "blend",
    },
    printful: {
      catalogProductId: 380,
      blank: "Cotton Heritage M2580",
      technique: "dtg",
    },
  }),
  product({
    id: "cgw-warmup-joggers",
    slug: "warm-up-joggers",
    name: "Warm-Up Joggers",
    audience: "unisex",
    category: "joggers",
    summary: "Cotton-faced fleece joggers with a tapered leg.",
    description:
      "Cuffed fleece for warm-ups and easy days. Slimmer than a lounge pant — check the size guide and size up if you want room.",
    price: 5400,
    sizes: UNISEX_SIZES,
    fabric: {
      label: "Cotton-faced fleece blend",
      detail:
        "Cotton Heritage M7580 is cotton-faced fleece, in the same family as the M2580 hoodie (a cotton/poly blend, not 100% cotton). Confirm the current mill spec in Printful before launch.",
      claim: "blend",
    },
    printful: {
      catalogProductId: 412,
      blank: "Cotton Heritage M7580",
      technique: "dtg",
    },
  }),
];

export const CATEGORY_LABEL: Record<Category, string> = {
  tee: "Tees",
  tank: "Tanks",
  shorts: "Shorts",
  hoodie: "Hoodies",
  joggers: "Joggers",
};

export const AUDIENCE_LABEL: Record<Audience, string> = {
  men: "Men",
  women: "Women",
  unisex: "Unisex",
};

export function getProduct(slug: string): Product | undefined {
  return CATALOG.find((item) => item.slug === slug);
}

export function findVariant(sku: string) {
  for (const item of CATALOG) {
    const variant = item.variants.find((entry) => entry.sku === sku);
    if (variant) return { product: item, variant };
  }
  return undefined;
}

export function filterProducts(
  audience: string | undefined,
  category: string | undefined,
): Product[] {
  const audienceOk = audience === "men" || audience === "women" ? audience : "all";
  const categoryOk =
    category === "tee" ||
    category === "tank" ||
    category === "shorts" ||
    category === "hoodie" ||
    category === "joggers"
      ? category
      : "all";

  return CATALOG.filter((item) => {
    const matchesAudience =
      audienceOk === "all" || item.audience === audienceOk || item.audience === "unisex";
    const matchesCategory = categoryOk === "all" || item.category === categoryOk;
    return matchesAudience && matchesCategory;
  });
}

export function formatGbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}
