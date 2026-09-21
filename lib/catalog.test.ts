import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CATALOG, findVariant } from "./catalog";
import { PREVIEW_RATES } from "./shipping";

test("catalog is eight or more verified cotton solids", () => {
  assert.ok(CATALOG.length >= 8 && CATALOG.length <= 12);
  const categories = new Set(CATALOG.map((item) => item.category));
  assert.ok(categories.has("tee"));
  assert.ok(categories.has("tank"));
  assert.equal(categories.has("shorts" as never), false);
  assert.ok(CATALOG.some((item) => item.audience === "men"));
  assert.ok(CATALOG.some((item) => item.audience === "women"));
});

test("every piece is a 100% cotton solid with a Printful blank id", () => {
  const colours = new Set(["black", "white", "navy"]);
  for (const item of CATALOG) {
    assert.equal(item.fabric.claim, "100");
    assert.match(item.fabric.label, /100% cotton/i);
    assert.doesNotMatch(item.fabric.label, /polyester|blend/i);
    assert.equal(typeof item.printful.catalogProductId, "number");
    assert.ok(item.price > 0);
    assert.ok(item.variants.length >= 9);
    for (const variant of item.variants) {
      assert.ok(colours.has(variant.colorId));
    }
  }
});

test("SKUs are unique and resolve", () => {
  const skus = CATALOG.flatMap((item) => item.variants.map((variant) => variant.sku));
  assert.equal(new Set(skus).size, skus.length);
  const found = findVariant(skus[0]);
  assert.ok(found);
  assert.equal(found.variant.syncVariantId, null);
});

test("sample shipping covers the UK and the US in GBP", () => {
  assert.ok(PREVIEW_RATES.GB.length >= 1);
  assert.ok(PREVIEW_RATES.US.length >= 1);
  for (const rate of [...PREVIEW_RATES.GB, ...PREVIEW_RATES.US]) {
    assert.equal(rate.currency, "GBP");
    assert.ok(rate.amount > 0);
  }
});

test("storefront source has no affiliate links", () => {
  const files = [
    "lib/catalog.ts",
    "app/page.tsx",
    "app/about/page.tsx",
    "README.md",
  ];
  for (const file of files) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(text, /amazon\.com|associates tag|amzn/i, file);
  }
});
