#!/usr/bin/env python3
"""Generate the cottongymwear.com static site from data/product-shortlist.csv.

Only rows with status=qualify and cotton_pct=100 are ever rendered, and every
fact on a card (rating, price band, brand, caveats) is read from the CSV. If a
field is missing the card says so instead of guessing.

Usage:
    python3 tools/build.py            # write pages into the repo root
    python3 tools/build.py --check    # fail if the committed pages are stale
"""

from __future__ import annotations

import argparse
import csv
import html
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "product-shortlist.csv"

SITE_NAME = "Cotton Gym Wear"
SITE_URL = "https://cottongymwear.com"
# TODO(associates): set to your Amazon Associates store id (e.g. "cottongym-20")
# to append ?tag=... to every product link. Leave empty until the tag is issued.
ASSOCIATES_TAG = ""

RATING_RE = re.compile(r"Rating\s+([0-5](?:\.\d)?)")
FABRIC_RE = re.compile(r"Verified Fabric type on amazon\.com product page:\s*(.+?)\.\s*(?:Rating|100% cotton)")

DISCLOSURE_SHORT = (
    "<strong>As an Amazon Associate I earn from qualifying purchases.</strong> "
    "Links go to amazon.com. We only list gear shown as 100% cotton on Amazon\u2019s "
    "Fabric type line at check time."
)
DISCLOSURE_LONG = (
    "<strong>As an Amazon Associate I earn from qualifying purchases.</strong> "
    "Links go to amazon.com. Prices, stock, and fibre claims change \u2014 rankings use "
    "Amazon star ratings captured during our fibre-check pass and will drift. Every pick "
    "is listed as <strong>100% cotton</strong> on Amazon\u2019s Fabric type at check time; "
    "re-check the materials line on the listing before you buy."
)


@dataclass
class Category:
    key: str
    title: str
    blurb: str
    rank_note: str
    card_note: str


CATEGORIES = [
    Category(
        "tee",
        "Tees & tanks",
        "Breathable crew, v-neck, and muscle cuts for lifting and everyday training.",
        "Ranked by Amazon star rating from our fibre-check pass. The same ASIN can change \u2014 re-check before buying.",
        "Best for lifting and light training \u2014 not a marathon shirt.",
    ),
    Category(
        "shorts",
        "Shorts",
        "Jersey cotton shorts for weights and gym-to-street \u2014 not slick running shorts.",
        "Ranked by Amazon star rating. Russell\u2019s \u201ccotton\u201d shorts came back 50/50, so they are excluded.",
        "Cotton jersey feel; check inseam and pockets on the listing.",
    ),
    Category(
        "joggers",
        "Joggers & pants",
        "Cuffed and open-bottom cotton for warm-ups, cool-downs, and the walk home.",
        "Ranked by Amazon star rating. Prefer solid colors where heathers on the same ASIN are blends.",
        "Gym bag and everyday wear; prefer solids if the heathers are blends.",
    ),
    Category(
        "socks",
        "Socks",
        "True 100% cotton crews are rare and mostly unbranded multipacks.",
        "Ranked by Amazon star rating. Thin brand coverage \u2014 check the seller yourself.",
        "Multipack crew \u2014 confirm the seller and size chart.",
    ),
    Category(
        "bra",
        "Bras",
        "Verified 100% cotton support barely exists; almost every \u201ccotton\u201d bra is a blend.",
        "Only the bras that passed the fibre check appear here. Low-impact, not high-impact kit.",
        "Low-impact support, organic cotton positioning \u2014 not a HIIT bra.",
    ),
]
CATEGORY_BY_KEY = {c.key: c for c in CATEGORIES}


@dataclass
class Product:
    name: str
    brand: str
    gender: str
    category: str
    asin: str
    price_band: str
    rating: float | None
    fabric: str
    caveat: str
    variant_asins: list[str] = field(default_factory=list)

    @property
    def untitled(self) -> bool:
        """Some CSV rows carry the ASIN in the name column instead of a title."""
        return self.name.strip().upper() == self.asin.upper()

    @property
    def display_name(self) -> str:
        if self.untitled:
            garment = {
                "tee": "tee",
                "shorts": "shorts",
                "joggers": "joggers",
                "socks": "socks",
                "bra": "bra",
            }[self.category]
            audience = {"men": "men\u2019s ", "women": "women\u2019s ", "unisex": ""}.get(self.gender, "")
            return f"Unbranded {audience}100% cotton {garment} \u2014 title not stated"
        return self.name

    @property
    def display_brand(self) -> str:
        brand = self.brand.strip()
        if not brand or brand.lower() in {"see listing", "check listing"}:
            return "Brand not stated \u2014 check listing"
        return brand

    @property
    def has_price(self) -> bool:
        return self.price_band.strip().startswith("~$")

    @property
    def display_price(self) -> str:
        return self.price_band.strip() if self.has_price else "Price on Amazon"

    @property
    def sort_key(self) -> tuple:
        return (-(self.rating or -1), self.display_name.lower())

    def link(self) -> str:
        url = f"https://www.amazon.com/dp/{self.asin}"
        if ASSOCIATES_TAG:
            url += f"?tag={ASSOCIATES_TAG}"
        return url

    def description(self, card_note: str) -> str:
        opening = self.display_brand if self.brand.strip() and self.brand.lower() not in {"see listing", "check listing"} else "This listing"
        bits = [f"{opening}. Fabric type on Amazon read {self.fabric} at check.", card_note]
        if self.has_price:
            bits.append(f"About {self.price_band.strip()} when we checked.")
        return " ".join(bits)


def load_products() -> tuple[list[Product], list[dict]]:
    with CSV_PATH.open(newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))

    qualified: list[Product] = []
    rejected: list[dict] = []
    for row in rows:
        status = row["status"].strip().lower()
        if status == "reject":
            rejected.append(row)
            continue
        if status != "qualify" or row["cotton_pct"].strip() != "100":
            continue
        if row["category"].strip() not in CATEGORY_BY_KEY:
            continue

        why = row["why_qualifies"]
        rating_match = RATING_RE.search(why)
        fabric_match = FABRIC_RE.search(why)
        qualified.append(
            Product(
                name=row["name"].strip(),
                brand=row["brand"].strip(),
                gender=row["gender"].strip().lower(),
                category=row["category"].strip(),
                asin=row["asin"].strip(),
                price_band=row["price_band"],
                rating=float(rating_match.group(1)) if rating_match else None,
                fabric=(fabric_match.group(1).strip() if fabric_match else "100% Cotton"),
                caveat=row["reject_notes"].strip(),
            )
        )

    return merge_duplicate_listings(qualified), rejected


def merge_duplicate_listings(products: list[Product]) -> list[Product]:
    """Fold repeat listings of the same product into one card.

    The shortlist contains the same garment under several ASINs (Champion lounge
    shorts, Hanes women's joggers, the unbranded sock multipack). Showing them as
    separate ranked cards reads like padding, so the duplicates become secondary
    ASIN links on the primary card instead of being dropped.
    """
    merged: dict[tuple, Product] = {}
    for product in products:
        # Untitled rows only carry an ASIN, so they can never be proven identical.
        key = (
            (product.asin,)
            if product.untitled
            else (product.category, product.gender, product.name.strip().lower(), product.brand.strip().lower())
        )
        existing = merged.get(key)
        if existing is None:
            merged[key] = product
            continue
        primary, secondary = (existing, product)
        if product.has_price and not existing.has_price:
            primary, secondary = product, existing
            primary.variant_asins = existing.variant_asins
        primary.variant_asins.append(secondary.asin)
        primary.caveat = primary.caveat or secondary.caveat
        merged[key] = primary
    return list(merged.values())


def rails_for(products: list[Product], genders: set[str] | None = None) -> list[tuple[Category, list[Product]]]:
    rails = []
    for category in CATEGORIES:
        items = [p for p in products if p.category == category.key]
        if genders is not None:
            items = [p for p in items if p.gender in genders]
        if items:
            rails.append((category, sorted(items, key=lambda p: p.sort_key)))
    return rails


# --------------------------------------------------------------------------- #
# rendering
# --------------------------------------------------------------------------- #


def e(text: str) -> str:
    return html.escape(text, quote=True)


def stars_markup(rating: float | None) -> str:
    if rating is None:
        return (
            '<p class="rating rating--none"><span class="rating-value">Unrated</span>'
            '<span class="rating-meta">no star rating on the listing</span></p>'
        )
    pct = round(rating / 5 * 100, 1)
    return (
        '<p class="rating">'
        f'<span class="rating-value">{rating:.1f}</span>'
        f'<span class="stars" role="img" aria-label="{rating:.1f} out of 5 stars on Amazon">'
        '<span class="stars-track">\u2605\u2605\u2605\u2605\u2605</span>'
        f'<span class="stars-fill" style="width:{pct}%">\u2605\u2605\u2605\u2605\u2605</span>'
        "</span>"
        '<span class="rating-meta">Amazon</span>'
        "</p>"
    )


def card_markup(product: Product, rank: int, category: Category) -> str:
    chips = ['<li class="chip chip--cotton">100% cotton</li>']
    if product.caveat:
        chips.append('<li class="chip chip--warn">Solids only \u2014 heathers may be blends</li>')
    if product.display_brand.startswith("Brand not stated"):
        chips.append('<li class="chip chip--warn">Verify the seller</li>')

    variants = ""
    if product.variant_asins:
        links = " ".join(
            f'<a href="https://www.amazon.com/dp/{e(asin)}"'
            ' rel="nofollow sponsored noopener" target="_blank">' + e(asin) + "</a>"
            for asin in sorted(product.variant_asins)
        )
        variants = f'<p class="variants">Same product, other ASIN: {links}</p>'

    return f"""        <article class="card">
          <p class="rank"><span class="rank-hash">#</span>{rank}</p>
          {stars_markup(product.rating)}
          <h3 class="card-title" title="{e(product.display_name)}">{e(product.display_name)}</h3>
          <p class="brand">{e(product.display_brand)}</p>
          <ul class="chips">{''.join(chips)}</ul>
          <p class="desc">{e(product.description(category.card_note))}</p>
          {variants}
          <p class="asin">ASIN {e(product.asin)}</p>
          <p class="price">{e(product.display_price)}</p>
          <a class="btn btn--accent card-cta" href="{e(product.link())}" rel="nofollow sponsored noopener" target="_blank">
            View on Amazon<span aria-hidden="true">\u2197</span>
          </a>
        </article>"""


def rail_markup(category: Category, products: list[Product], index: int) -> str:
    rail_id = f"rail-{category.key}"
    cards = "\n".join(card_markup(p, i + 1, category) for i, p in enumerate(products))
    count = len(products)
    return f"""<section class="rail-section" id="{category.key}">
  <div class="rail-head">
    <div class="rail-head-copy">
      <h2>{e(category.title)} <span class="count">{count} pick{'' if count == 1 else 's'}</span></h2>
      <p class="rail-blurb">{e(category.blurb)}</p>
      <p class="rank-note">{e(category.rank_note)}</p>
    </div>
    <div class="rail-nav" data-rail-nav="{rail_id}">
      <button class="rail-btn" type="button" data-dir="-1" aria-label="Scroll {e(category.title)} left" aria-controls="{rail_id}">\u2039</button>
      <button class="rail-btn" type="button" data-dir="1" aria-label="Scroll {e(category.title)} right" aria-controls="{rail_id}">\u203a</button>
    </div>
  </div>
  <div class="rail-wrap">
    <div class="rail" id="{rail_id}" tabindex="0" role="group" aria-label="{e(category.title)} \u2014 scroll horizontally">
{cards}
    </div>
  </div>
</section>"""


def page(
    *,
    slug: str,
    title: str,
    description: str,
    body: str,
    depth: int = 0,
    active: str,
    has_product_links: bool = True,
) -> tuple[str, str]:
    prefix = "../" if depth else ""

    def nav_link(href: str, label: str, key: str) -> str:
        current = ' aria-current="page"' if key == active else ""
        return f'<a href="{prefix}{href}"{current}>{label}</a>'

    nav = "\n      ".join(
        [
            nav_link("index.html", "Home", "home"),
            nav_link("men.html", "Men", "men"),
            nav_link("women.html", "Women", "women"),
            nav_link("guides/index.html" if not depth else "index.html", "Guides", "guides"),
        ]
    )

    disclosure = (
        f'<aside class="disclosure" aria-label="Affiliate disclosure"><p>{DISCLOSURE_SHORT}</p></aside>'
        if has_product_links
        else ""
    )

    canonical = f"{SITE_URL}/{slug}" if slug != "index.html" else f"{SITE_URL}/"

    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{e(title)}</title>
<meta name="description" content="{e(description)}" />
<link rel="canonical" href="{e(canonical)}" />
<meta name="theme-color" content="#0a0a09" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="{e(SITE_NAME)}" />
<meta property="og:title" content="{e(title)}" />
<meta property="og:description" content="{e(description)}" />
<meta property="og:url" content="{e(canonical)}" />
<link rel="icon" href="{prefix}assets/favicon.svg" type="image/svg+xml" />
<link rel="stylesheet" href="{prefix}assets/css/styles.css" />
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="header-inner">
    <a class="logo" href="{prefix}index.html">
      <span class="logo-mark" aria-hidden="true"></span>
      <span class="logo-text">Cotton<span>Gym</span>Wear</span>
    </a>
    <nav aria-label="Primary">
      {nav}
    </nav>
  </div>
</header>
<main id="main">
{disclosure}
{body}
</main>
<footer class="site-footer">
  <div class="footer-grid">
    <div>
      <p class="footer-title">{e(SITE_NAME)}</p>
      <p class="fine">A shortlist of gym wear that reads 100% cotton on Amazon\u2019s Fabric type line. No invented fibre percentages, no blends smuggled in.</p>
    </div>
    <nav class="footer-nav" aria-label="Footer">
      <a href="{prefix}index.html">Home</a>
      <a href="{prefix}men.html">Men</a>
      <a href="{prefix}women.html">Women</a>
      <a href="{prefix}guides/index.html">Guides</a>
      <a href="{prefix}guides/how-we-pick.html">How we pick</a>
    </nav>
  </div>
  <p class="disclosure-long">{DISCLOSURE_LONG}</p>
  <p class="fine">cottongymwear.com \u2014 product links are plain amazon.com/dp/ASIN.
  <!-- TODO(associates): set ASSOCIATES_TAG in tools/build.py once the Amazon Associates store id is approved, then rebuild so every link carries ?tag=... -->
  Associates tracking tag not yet attached.</p>
</footer>
<script src="{prefix}assets/js/rails.js" defer></script>
</body>
</html>
"""
    return slug, doc


# --------------------------------------------------------------------------- #
# pages
# --------------------------------------------------------------------------- #


def hero_stats(products: list[Product], rejected: list[dict]) -> str:
    rails = rails_for(products)
    items = [
        (str(len(products)), "listings passed the fibre check"),
        (str(len(rails)), "categories on the rails"),
        (str(len(rejected)), "\u201ccotton\u201d listings rejected as blends"),
    ]
    cells = "".join(
        f'<li><span class="stat-num">{e(num)}</span><span class="stat-label">{e(label)}</span></li>'
        for num, label in items
    )
    return f'<ul class="stats">{cells}</ul>'


def build_home(products: list[Product], rejected: list[dict]) -> tuple[str, str]:
    rails = "\n".join(rail_markup(c, items, i) for i, (c, items) in enumerate(rails_for(products)))
    body = f"""<section class="hero">
  <div class="hero-inner">
    <p class="eyebrow">Fibre-checked on amazon.com</p>
    <h1>100% cotton gym wear that isn\u2019t polyester cosplay</h1>
    <p class="lede">A ranked shortlist of real <strong>100% cotton</strong> tees, shorts, joggers, socks, and the rare bra that survives a materials check \u2014 for lifting, light training, and gym-to-street.</p>
    <div class="cta-row">
      <a class="btn btn--accent" href="men.html">Shop men</a>
      <a class="btn btn--ghost" href="women.html">Shop women</a>
      <a class="btn btn--quiet" href="guides/how-we-pick.html">How we pick</a>
    </div>
    {hero_stats(products, rejected)}
  </div>
</section>
<section class="rules">
  <h2 class="rules-title">The only two rules</h2>
  <ol class="rules-list">
    <li><strong>Fabric type decides.</strong> If Amazon\u2019s materials line says blend, it never reaches a rail \u2014 no matter what the title claims.</li>
    <li><strong>No invented numbers.</strong> Ratings and prices are what we saw at check time, and the cards say so.</li>
  </ol>
</section>
{rails}
<section class="guides-teaser">
  <h2>Guides, not a blog mill</h2>
  <div class="guide-cards">
    <a class="guide-card" href="guides/cotton-vs-polyester.html"><h3>Cotton vs polyester for the gym</h3><p>Where cotton actually wins, and where it loses. No plastic-fabric rant.</p><span class="guide-go">Read <span aria-hidden="true">\u2192</span></span></a>
    <a class="guide-card" href="guides/best-cotton-gym-shorts.html"><h3>Best 100% cotton gym shorts</h3><p>The shorts that passed, plus the famous \u201ccotton\u201d pair that is 50/50.</p><span class="guide-go">Read <span aria-hidden="true">\u2192</span></span></a>
    <a class="guide-card" href="guides/how-we-pick.html"><h3>How we pick</h3><p>The five-step fibre check, the reject log, and what we refuse to do.</p><span class="guide-go">Read <span aria-hidden="true">\u2192</span></span></a>
  </div>
</section>"""
    return page(
        slug="index.html",
        title="100% cotton gym wear, ranked \u00b7 Cotton Gym Wear",
        description="Ranked 100% cotton gym wear on amazon.com \u2014 tees, shorts, joggers, socks, and bras that pass a Fabric type check.",
        body=body,
        active="home",
    )


def build_gender_page(products: list[Product], gender: str) -> tuple[str, str]:
    genders = {gender, "unisex"}
    rails = rails_for(products, genders)
    jump = "".join(
        f'<a class="jump" href="#{c.key}">{e(c.title)}</a>' for c, _ in rails
    )
    if gender == "men":
        heading = "Men\u2019s 100% cotton gym wear"
        lede = "Cotton for the gym bag, weighted toward lifting and everyday training rather than marathon kits. Unisex listings appear here too."
        note = "Champion, Hanes, Russell Athletic, and Comfort Colors carry most of this list \u2014 which is what happens when you filter on Fabric type instead of marketing."
    else:
        heading = "Women\u2019s 100% cotton gym wear"
        lede = "Cotton pieces for lifting, studio work, walking, and everyday wear. Unisex listings appear here too."
        note = "Pure cotton bras and stretch shorts barely exist: most \u201ccotton\u201d versions came back 92\u201395% cotton with spandex, so they sit in the reject log instead of a rail."

    body = f"""<section class="page-intro">
  <p class="eyebrow">{e('Men' if gender == 'men' else 'Women')}</p>
  <h1>{e(heading)}</h1>
  <p class="lede">{e(lede)}</p>
  <p class="rank-note">{e(note)}</p>
  <nav class="jump-nav" aria-label="Categories">{jump}</nav>
</section>
""" + "\n".join(rail_markup(c, items, i) for i, (c, items) in enumerate(rails))

    return page(
        slug=f"{gender}.html",
        title=f"{'Men' if gender == 'men' else 'Women'} \u00b7 Cotton Gym Wear",
        description=f"{heading} on amazon.com \u2014 ranked by Amazon star rating, verified 100% cotton on the Fabric type line.",
        body=body,
        active=gender,
    )


def build_guides_index() -> tuple[str, str]:
    body = """<section class="page-intro">
  <p class="eyebrow">Guides</p>
  <h1>Three guides, no filler</h1>
  <p class="lede">Enough to decide what to buy and to sanity-check our fibre claims. That is the whole library.</p>
</section>
<section class="guides-teaser">
  <div class="guide-cards">
    <a class="guide-card" href="cotton-vs-polyester.html"><h3>Cotton vs polyester for the gym</h3><p>Sweat, smell, drying time, and the workouts where synthetics still win.</p><span class="guide-go">Read <span aria-hidden="true">\u2192</span></span></a>
    <a class="guide-card" href="best-cotton-gym-shorts.html"><h3>Best 100% cotton gym shorts</h3><p>Every pair that passed the check, men\u2019s and women\u2019s, plus the rejects.</p><span class="guide-go">Read <span aria-hidden="true">\u2192</span></span></a>
    <a class="guide-card" href="how-we-pick.html"><h3>How we pick</h3><p>The five-step check, the reject log, and the rules we will not bend.</p><span class="guide-go">Read <span aria-hidden="true">\u2192</span></span></a>
  </div>
</section>"""
    return page(
        slug="guides/index.html",
        title="Guides \u00b7 Cotton Gym Wear",
        description="Short pillar guides on cotton gym wear: cotton vs polyester, the best 100% cotton gym shorts, and how we verify fibre content.",
        body=body,
        depth=1,
        active="guides",
        has_product_links=False,
    )


def build_cotton_vs_polyester() -> tuple[str, str]:
    body = """<section class="page-intro">
  <p class="eyebrow">Guide</p>
  <h1>Cotton vs polyester for the gym</h1>
  <p class="lede">Both fabrics have a job. This is where each one earns it \u2014 without pretending cotton wins every workout.</p>
</section>
<div class="prose">
  <h2>Where cotton wins</h2>
  <ul class="bullets">
    <li><strong>Weights and low-to-moderate intensity.</strong> You are resting between sets, not sustaining a heart rate for an hour, so drying speed matters less than feel.</li>
    <li><strong>Against skin.</strong> A natural fibre, no microplastic-shed story to defend.</li>
    <li><strong>Odour after a wash.</strong> Plenty of people find poly holds smell through the laundry in a way cotton does not.</li>
    <li><strong>Gym-to-street.</strong> A cotton tee and jersey shorts read as clothes, not a compression costume.</li>
  </ul>
  <h2>Where polyester wins</h2>
  <ul class="bullets">
    <li><strong>Long runs and HIIT.</strong> It moves moisture and dries faster, so it stays lighter when you are soaked.</li>
    <li><strong>Cold and wet conditions</strong>, where a saturated cotton tee turns into a heavy, cold layer.</li>
    <li><strong>Chafe-prone sessions.</strong> A wet cotton seam over 10km is its own punishment.</li>
  </ul>
  <h2>The honest summary</h2>
  <p>If cardio is your main event, a synthetic kit is probably the right tool and this site is not your main shop. If you lift, walk, do studio work, or simply want natural fibre against your skin, cotton is a perfectly good default \u2014 and it is far harder to find at 100% than the marketing suggests.</p>
  <h2>Reading the listing like we do</h2>
  <p>Ignore the title. Scroll to <strong>Fabric type</strong> (sometimes <em>Material composition</em>) on the Amazon product page. Watch for two traps: a single listing whose heather colourways drop to 60/40 cotton-poly, and \u201ccotton\u201d activewear that is 95% cotton with 5% spandex. Both fail our check.</p>
  <p class="prose-cta"><a class="btn btn--accent" href="../men.html">Men\u2019s picks</a> <a class="btn btn--ghost" href="../women.html">Women\u2019s picks</a></p>
</div>"""
    return page(
        slug="guides/cotton-vs-polyester.html",
        title="Cotton vs polyester for the gym \u00b7 Cotton Gym Wear",
        description="An honest comparison of cotton and polyester gym clothes: where cotton wins, where synthetics win, and how to read an Amazon Fabric type line.",
        body=body,
        depth=1,
        active="guides",
        has_product_links=False,
    )


def build_best_shorts(products: list[Product], rejected: list[dict]) -> tuple[str, str]:
    shorts = [p for p in products if p.category == "shorts"]
    mens = sorted([p for p in shorts if p.gender in {"men", "unisex"}], key=lambda p: p.sort_key)
    womens = sorted([p for p in shorts if p.gender in {"women", "unisex"}], key=lambda p: p.sort_key)
    rejected_shorts = [r for r in rejected if r["category"].strip() == "shorts"]

    def rail(title: str, blurb: str, items: list[Product], key: str) -> str:
        category = Category(
            key,
            title,
            blurb,
            CATEGORY_BY_KEY["shorts"].rank_note,
            CATEGORY_BY_KEY["shorts"].card_note,
        )
        return rail_markup(category, items, 0)

    reject_rows = "\n".join(
        f"        <tr><td>{e(r['name'].strip() or r['asin'])}</td><td>{e(r['reject_notes'].strip())}</td></tr>"
        for r in rejected_shorts
    )
    buying_notes = """  <h2>How to buy without getting burned</h2>
  <ul class="bullets">
    <li>Check <strong>Fabric type</strong> on the listing, then check it again for your colour \u2014 heathers are frequently blends.</li>
    <li>Cotton jersey shrinks. If you are between sizes, size up or expect a shorter inseam after the first wash.</li>
    <li>Pockets and inseam length vary between the same brand\u2019s ASINs; read the bullet points, not the photo.</li>
  </ul>"""

    body = f"""<section class="page-intro">
  <p class="eyebrow">Guide</p>
  <h1>Best 100% cotton gym shorts</h1>
  <p class="lede">Titles say cotton; the Fabric type line decides. Everything below passed, ranked by Amazon star rating.</p>
  <p class="rank-note">Cotton jersey shorts are for lifting and gym-to-street. If you want quick-dry running shorts, buy synthetics \u2014 we will not pretend otherwise.</p>
</section>
{rail("Men\u2019s and unisex", "Jersey cotton shorts for weights and gym-to-street.", mens, "shorts-men")}
{rail("Women\u2019s and unisex", "The women\u2019s shorts that survived the check \u2014 a short list on purpose.", womens, "shorts-women")}
<section class="wide">
  <h2>The rejects worth naming</h2>
  <p class="wide-lede">These sell as cotton shorts. They are not 100% cotton, so they get no rail and no affiliate link \u2014 only a note.</p>
  <div class="table-wrap">
    <table class="reject-table">
      <thead><tr><th>Listing</th><th>Why it failed</th></tr></thead>
      <tbody>
{reject_rows}
      </tbody>
    </table>
  </div>
</section>
<div class="prose">
{buying_notes}
</div>"""
    return page(
        slug="guides/best-cotton-gym-shorts.html",
        title="Best 100% cotton gym shorts \u00b7 Cotton Gym Wear",
        description="The 100% cotton gym shorts that passed an Amazon Fabric type check, ranked by star rating, plus the \u201ccotton\u201d shorts that turned out to be blends.",
        body=body,
        depth=1,
        active="guides",
    )


def build_how_we_pick(products: list[Product], rejected: list[dict]) -> tuple[str, str]:
    reject_rows = "\n".join(
        f"        <tr><td>{e(r['name'].strip() or r['asin'])}</td>"
        f'<td class="cell-category">{e(CATEGORY_BY_KEY[r["category"].strip()].title if r["category"].strip() in CATEGORY_BY_KEY else r["category"].strip())}</td>'
        f"<td>{e(r['reject_notes'].strip())}</td></tr>"
        for r in rejected
    )
    body = f"""<section class="page-intro">
  <p class="eyebrow">Guide</p>
  <h1>How we pick</h1>
  <p class="lede">One pass, five steps, and a reject log we publish instead of hiding.</p>
</section>
<div class="prose">
  <ol class="steps">
    <li><strong>Find gym-relevant amazon.com listings</strong> by category \u2014 tees, shorts, joggers, socks, bras.</li>
    <li><strong>Read the Fabric type or materials line</strong> on the product page itself, not the title or the ad copy.</li>
    <li><strong>Only 100% cotton makes a rail.</strong> Everything else goes to the reject log below, with the exact composition we saw.</li>
    <li><strong>Rank each rail by the Amazon star rating</strong> recorded during that check. Ratings move; the cards tell you that.</li>
    <li><strong>Flag the traps</strong> \u2014 listings where solids are 100% cotton but heathers are blends get a \u201csolids only\u201d warning.</li>
  </ol>
  <h2>What we will not do</h2>
  <ul class="bullets">
    <li>Invent a fibre percentage, a rating, or a price.</li>
    <li>List a blend because a category looks thin. That is why the bra rail holds {len([p for p in products if p.category == 'bra'])} item and the socks rail is short.</li>
    <li>Pretend cotton beats synthetics for every workout.</li>
  </ul>
</div>
<section class="wide">
  <h2>Reject log <span class="count">{len(rejected)} listings</span></h2>
  <p class="wide-lede">Each of these markets itself as cotton. None of them passed. No affiliate links here \u2014 they are documentation, not picks.</p>
  <div class="table-wrap">
    <table class="reject-table">
      <thead><tr><th>Listing</th><th>Category</th><th>Why it failed</th></tr></thead>
      <tbody>
{reject_rows}
      </tbody>
    </table>
  </div>
  <p class="prose-cta"><a class="btn btn--accent" href="../index.html">Back to the shortlist</a></p>
</section>"""
    return page(
        slug="guides/how-we-pick.html",
        title="How we pick \u00b7 Cotton Gym Wear",
        description="Our five-step fibre check for 100% cotton gym wear on Amazon, plus the full reject log of \u201ccotton\u201d listings that turned out to be blends.",
        body=body,
        depth=1,
        active="guides",
        has_product_links=False,
    )


def build_404() -> tuple[str, str]:
    body = """<section class="page-intro">
  <p class="eyebrow">404</p>
  <h1>That page went missing in the wash</h1>
  <p class="lede">The link is dead, but the shortlist is not. Start from a rail instead.</p>
  <div class="cta-row">
    <a class="btn btn--accent" href="index.html">Home</a>
    <a class="btn btn--ghost" href="men.html">Men</a>
    <a class="btn btn--ghost" href="women.html">Women</a>
    <a class="btn btn--quiet" href="guides/index.html">Guides</a>
  </div>
</section>"""
    return page(
        slug="404.html",
        title="Page not found \u00b7 Cotton Gym Wear",
        description="That page does not exist. Jump back to the ranked 100% cotton gym wear shortlist.",
        body=body,
        active="none",
        has_product_links=False,
    )


def build_sitemap(slugs: list[str]) -> tuple[str, str]:
    urls = "\n".join(
        f"  <url><loc>{SITE_URL}/{'' if slug == 'index.html' else slug}</loc></url>" for slug in slugs
    )
    return "sitemap.xml", (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n"
        "</urlset>\n"
    )


def build_all() -> dict[str, str]:
    products, rejected = load_products()
    pages = [
        build_home(products, rejected),
        build_gender_page(products, "men"),
        build_gender_page(products, "women"),
        build_guides_index(),
        build_cotton_vs_polyester(),
        build_best_shorts(products, rejected),
        build_how_we_pick(products, rejected),
    ]
    output = dict(pages)
    output.update([build_404()])
    slug, doc = build_sitemap([slug for slug, _ in pages])
    output[slug] = doc
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify committed pages match the data")
    args = parser.parse_args()

    output = build_all()
    stale = []
    for slug, doc in output.items():
        path = ROOT / slug
        if args.check:
            if not path.exists() or path.read_text(encoding="utf-8") != doc:
                stale.append(slug)
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(doc, encoding="utf-8")
        print(f"wrote {slug}")

    if args.check:
        if stale:
            print("stale pages: " + ", ".join(sorted(stale)), file=sys.stderr)
            print("run: python3 tools/build.py", file=sys.stderr)
            return 1
        print(f"{len(output)} generated files are up to date")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
