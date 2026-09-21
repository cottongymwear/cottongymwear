import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CATALOG, findVariant } from "./catalog";
import { PREVIEW_RATES } from "./shipping";

test("catalog has a launch subset of cotton gym pieces", () => {
  assert.ok(CATALOG.length >= 8 && CATALOG.length <= 12);
  const categories = new Set(CATALOG.map((item) => item.category));
  for (const category of ["tee", "tank", "shorts", "hoodie", "joggers"]) {
    assert.ok(categories.has(category as never), category);
  }
  assert.ok(CATALOG.filter((item) => item.audience === "men").length >= 3);
  assert.ok(CATALOG.filter((item) => item.audience === "women").length >= 3);
});

test("jersey pieces claim 100% cotton and fleece pieces do not", () => {
  for (const item of CATALOG) {
    if (item.category === "tee" || item.category === "tank") {
      assert.equal(item.fabric.claim, "100");
      assert.match(item.fabric.label, /100% cotton/i);
    } else {
      assert.equal(item.fabric.claim, "blend");
      assert.doesNotMatch(item.fabric.label, /^100% cotton/i);
    }
    assert.ok(item.price > 0);
    assert.ok(item.variants.length >= 9);
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
