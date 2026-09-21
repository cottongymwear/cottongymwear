export type Audience = "men" | "women" | "unisex";

export type Category = "tee" | "tank" | "long-sleeve";

export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export type CottonClaim = "100";

export type CatalogVariant = {
  sku: string;
  color: string;
  colorId: string;
  size: Size;
  /** Printful catalog variant id (size/colour of the blank). Null until linked. */
  catalogVariantId: number | null;
  /** Printful sync variant id for a designed store product. Null until linked. */
  syncVariantId: number | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  audience: Audience;
  category: Category;
  summary: string;
  description: string;
  /** Retail price in pence (GBP). */
  price: number;
  colors: { id: string; name: string; swatch: string }[];
  sizes: Size[];
  variants: CatalogVariant[];
  fabric: {
    label: string;
    detail: string;
    claim: CottonClaim;
  };
  printful: {
    catalogProductId: number;
    blank: string;
    technique: "dtg";
  };
};

export type ShippingRate = {
  id: string;
  name: string;
  detail: string;
  /** Pence. */
  amount: number;
  currency: "GBP";
};

export type PricedLine = {
  sku: string;
  productId: string;
  name: string;
  color: string;
  size: Size;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  syncVariantId: number | null;
  catalogVariantId: number | null;
};

export type Recipient = {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  postcode: string;
  country: "GB" | "US";
};
