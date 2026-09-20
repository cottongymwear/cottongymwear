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
IMAGE_STATUS_PATH = ROOT / "data" / "image-status.csv"

SITE_NAME = "Cotton Gym Wear"
SITE_URL = "https://cottongymwear.com"
# TODO(associates): set to your Amazon Associates store id (e.g. "cottongym-20")
# to append ?tag=... to every product link. Leave empty until the tag is issued.
ASSOCIATES_TAG = ""

# Standard public Amazon catalogue image. 500px square for the ASINs that have
# one; see tools/check-images.py for the ones that do not.
IMAGE_URL = "https://m.media-amazon.com/images/P/{asin}.01._SCLZZZZZZZ_.jpg"

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
        "Crew, v-neck, and muscle cuts for lifting and everyday training.",
        "Ordered by the Amazon star rating recorded during our fibre check.",
        "Made for lifting and light training.",
    ),
    Category(
        "shorts",
        "Shorts",
        "Jersey cotton for weights and the walk home \u2014 not running shorts.",
        "Ordered by star rating. Russell\u2019s \u201ccotton\u201d shorts came back 50/50, so they are not here.",
        "Cotton jersey feel; check the inseam on the listing.",
    ),
    Category(
        "joggers",
        "Joggers & pants",
        "Cuffed and open-bottom cotton for warm-ups and cool-downs.",
        "Ordered by star rating. Prefer solids where heathers on the same listing are blends.",
        "Gym bag and everyday wear.",
    ),
    Category(
        "socks",
        "Socks",
        "True 100% cotton crews are rare, and mostly unbranded multipacks.",
        "Ordered by star rating. Thin brand coverage \u2014 check the seller yourself.",
        "Multipack crew \u2014 confirm the seller and size chart.",
    ),
    Category(
        "bra",
        "Bras",
        "Verified 100% cotton support barely exists. This is what passed.",
        "Low-impact only. Almost every other \u201ccotton\u201d bra is a blend.",
        "Low-impact support \u2014 not a HIIT bra.",
    ),
]
CATEGORY_BY_KEY = {c.key: c for c in CATEGORIES}

GARMENT_LABEL = {
    "tee": "Tee",
    "shorts": "Shorts",
    "joggers": "Joggers",
    "socks": "Socks",
    "bra": "Bra",
}


def load_image_status() -> dict[str, str]:
    """ASIN -> 'ok' | 'missing', refreshed by tools/check-images.py."""
    if not IMAGE_STATUS_PATH.exists():
        return {}
    with IMAGE_STATUS_PATH.open(newline="", encoding="utf-8") as fh:
        return {
            row["asin"].strip(): row["image"].strip().lower()
            for row in csv.DictReader(fh)
            if row.get("asin")
        }


IMAGE_STATUS = load_image_status()


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
            return "Brand not stated"
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

    @property
    def image_asin(self) -> str | None:
        """The ASIN whose catalogue photo we render, or None if there is none.

        Merged listings are the same garment under several ASINs, so if the
        primary has no photo a duplicate's photo still shows the right product.
        """
        for asin in [self.asin, *sorted(self.variant_asins)]:
            if IMAGE_STATUS.get(asin, "ok") == "ok":
                return asin
        return None

    def link(self) -> str:
        url = f"https://www.amazon.com/dp/{self.asin}"
        if ASSOCIATES_TAG:
            url += f"?tag={ASSOCIATES_TAG}"
        return url


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
    separate cards reads like padding, so the duplicates become secondary ASIN
    links on the primary card instead of being dropped.
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


def decks_for(products: list[Product], genders: set[str] | None = None) -> list[tuple[Category, list[Product]]]:
    decks = []
    for category in CATEGORIES:
        items = [p for p in products if p.category == category.key]
        if genders is not None:
            items = [p for p in items if p.gender in genders]
        if items:
            decks.append((category, sorted(items, key=lambda p: p.sort_key)))
    return decks


def featured(products: list[Product], limit: int = 8) -> list[Product]:
    """One pick per category first, then the next best by rating. Deterministic."""
    best = [items[0] for _, items in decks_for(products)]
    taken = {p.asin for p in best}
    rest = sorted((p for p in products if p.asin not in taken), key=lambda p: p.sort_key)
    return (sorted(best, key=lambda p: p.sort_key) + rest)[:limit]


# --------------------------------------------------------------------------- #
# rendering
# --------------------------------------------------------------------------- #


def e(text: str) -> str:
    return html.escape(text, quote=True)


def media_markup(product: Product) -> str:
    asin = product.image_asin
    fallback = (
        '<span class="media-fallback">'
        f'<span class="fallback-mark">{e(SITE_NAME)}</span>'
        '<span class="fallback-note">No catalogue photo \u2014 see the listing</span>'
        "</span>"
    )
    image = ""
    if asin:
        image = (
            f'<img src="{e(IMAGE_URL.format(asin=asin))}" alt="" loading="lazy"'
            ' decoding="async" width="500" height="500" draggable="false" />'
        )
    return (
        f'<a class="media" href="{e(product.link())}" rel="nofollow sponsored noopener"'
        ' target="_blank" tabindex="-1" aria-hidden="true">'
        f"{fallback}{image}</a>"
    )


def rating_markup(product: Product) -> str:
    if product.rating is None:
        return '<span class="rating">No rating yet</span>'
    return (
        '<span class="rating">'
        f'<span class="star" aria-hidden="true">\u2605</span> {product.rating:.1f} on Amazon'
        "</span>"
    )


def card_markup(product: Product) -> str:
    chips = ['<li class="chip chip--cotton">100% cotton</li>']
    if product.caveat:
        chips.append('<li class="chip chip--warn">Solids only</li>')
    if product.display_brand == "Brand not stated":
        chips.append('<li class="chip chip--warn">Verify the seller</li>')

    card_note = CATEGORY_BY_KEY[product.category].card_note
    fine = [f"Fabric type read {product.fabric} at check.", card_note, f"ASIN {product.asin}."]
    if product.variant_asins:
        fine.append("Also listed as " + ", ".join(sorted(product.variant_asins)) + ".")

    return f"""        <article class="card">
          {media_markup(product)}
          <div class="card-body">
            <p class="card-kicker"><span>{e(product.display_brand)}</span><span>{e(GARMENT_LABEL[product.category])}</span></p>
            <h3 class="card-title">{e(product.display_name)}</h3>
            <p class="card-meta"><span class="price">{e(product.display_price)}</span>{rating_markup(product)}</p>
            <ul class="chips">{''.join(chips)}</ul>
            <p class="card-fine">{e(' '.join(fine))}</p>
            <a class="btn btn--solid card-cta" href="{e(product.link())}" rel="nofollow sponsored noopener" target="_blank">
              View on Amazon<span aria-hidden="true">\u2197</span>
            </a>
          </div>
        </article>"""


def deck_markup(
    *,
    deck_id: str,
    title: str,
    blurb: str,
    note: str,
    products: list[Product],
    section_id: str | None = None,
) -> str:
    cards = "\n".join(card_markup(p) for p in products)
    count = len(products)
    anchor = f' id="{e(section_id)}"' if section_id else ""
    return f"""<section class="section deck-section"{anchor}>
  <div class="section-head">
    <div class="section-copy">
      <p class="eyebrow">{count} pick{'' if count == 1 else 's'}</p>
      <h2>{e(title)}</h2>
      <p class="blurb">{e(blurb)}</p>
      <p class="note">{e(note)}</p>
    </div>
    <div class="deck-nav" data-deck-nav="{deck_id}">
      <button class="deck-btn" type="button" data-dir="-1" aria-label="Show previous {e(title)}" aria-controls="{deck_id}">\u2039</button>
      <button class="deck-btn" type="button" data-dir="1" aria-label="Show more {e(title)}" aria-controls="{deck_id}">\u203a</button>
    </div>
  </div>
  <div class="deck" id="{deck_id}" tabindex="0" role="group" aria-label="{e(title)} \u2014 swipe or scroll horizontally">
{cards}
  </div>
  <div class="deck-progress" data-deck-progress="{deck_id}">
    <span class="deck-hint">Swipe</span>
    <span class="deck-track"><span class="deck-thumb"></span></span>
  </div>
</section>"""


def category_deck(category: Category, products: list[Product], suffix: str = "") -> str:
    return deck_markup(
        deck_id=f"deck-{category.key}{suffix}",
        title=category.title,
        blurb=category.blurb,
        note=category.rank_note,
        products=products,
        section_id=category.key,
    )


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
    # The brand is three words everywhere it is rendered, never jammed together.
    wordmark = "".join(f'<span class="logo-word">{e(word)}</span>' for word in SITE_NAME.split())

    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{e(title)}</title>
<meta name="description" content="{e(description)}" />
<link rel="canonical" href="{e(canonical)}" />
<meta name="theme-color" content="#fbfbf9" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="{e(SITE_NAME)}" />
<meta property="og:title" content="{e(title)}" />
<meta property="og:description" content="{e(description)}" />
<meta property="og:url" content="{e(canonical)}" />
<link rel="icon" href="{prefix}assets/favicon.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://m.media-amazon.com" crossorigin />
<link rel="stylesheet" href="{prefix}assets/css/styles.css" />
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="header-inner">
    <a class="logo" href="{prefix}index.html" aria-label="{e(SITE_NAME)} \u2014 home">{wordmark}</a>
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
      <p class="fine">Gym wear that reads 100% cotton on Amazon\u2019s Fabric type line. No invented fibre percentages, no blends smuggled in.</p>
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
<script src="{prefix}assets/js/swipe.js" defer></script>
</body>
</html>
"""
    return slug, doc


# --------------------------------------------------------------------------- #
# pages
# --------------------------------------------------------------------------- #


def build_home(products: list[Product], rejected: list[dict]) -> tuple[str, str]:
    picks = featured(products)
    decks = "\n".join(category_deck(c, items) for c, items in decks_for(products))
    body = f"""<section class="hero">
  <div class="hero-inner">
    <p class="eyebrow">100% cotton \u00b7 checked on amazon.com</p>
    <h1>Cotton. Nothing blended in.</h1>
    <p class="lede">A short, honest list of gym wear that reads 100% cotton on Amazon\u2019s Fabric type line. Tees, shorts, joggers, socks, and the rare bra that passes.</p>
    <div class="cta-row">
      <a class="btn btn--solid" href="men.html">Shop men</a>
      <a class="btn btn--outline" href="women.html">Shop women</a>
      <a class="btn btn--text" href="guides/how-we-pick.html">How we pick</a>
    </div>
    <p class="hero-fine">{len(products)} listings passed the check. {len(rejected)} sold as cotton did not.</p>
  </div>
</section>
{deck_markup(
    deck_id="deck-featured",
    title="Featured",
    blurb="The highest-rated piece from each category, then the next best.",
    note="Swipe or drag to browse. Every card links straight to the amazon.com listing.",
    products=picks,
)}
{decks}
<section class="statement">
  <p>If the Fabric type line says blend, it never reaches this page.</p>
  <p class="note">Titles lie. The materials line does not. That single rule is why some categories here hold one product instead of ten.</p>
</section>
<section class="section">
  <div class="section-head">
    <div class="section-copy">
      <p class="eyebrow">Guides</p>
      <h2>Three guides, no filler.</h2>
    </div>
  </div>
  <div class="guide-cards">
    <a class="guide-card" href="guides/cotton-vs-polyester.html"><h3>Cotton vs polyester</h3><p>Where cotton wins, and the workouts where it does not.</p><span class="guide-go">Read <span aria-hidden="true">\u2192</span></span></a>
    <a class="guide-card" href="guides/best-cotton-gym-shorts.html"><h3>Best cotton gym shorts</h3><p>Every pair that passed, plus the famous \u201ccotton\u201d pair that is 50/50.</p><span class="guide-go">Read <span aria-hidden="true">\u2192</span></span></a>
    <a class="guide-card" href="guides/how-we-pick.html"><h3>How we pick</h3><p>The five-step fibre check and the full reject log.</p><span class="guide-go">Read <span aria-hidden="true">\u2192</span></span></a>
  </div>
</section>"""
    return page(
        slug="index.html",
        title="Cotton Gym Wear \u2014 100% cotton gym clothes, checked on Amazon",
        description="A short shortlist of 100% cotton gym wear on amazon.com \u2014 tees, shorts, joggers, socks, and bras that pass a Fabric type check.",
        body=body,
        active="home",
    )


def build_gender_page(products: list[Product], gender: str) -> tuple[str, str]:
    genders = {gender, "unisex"}
    decks = decks_for(products, genders)
    jump = "".join(f'<a class="jump" href="#{c.key}">{e(c.title)}</a>' for c, _ in decks)
    if gender == "men":
        heading = "Men\u2019s cotton."
        lede = "Cotton for the gym bag \u2014 weighted toward lifting and everyday training rather than marathons. Unisex listings appear here too."
        note = "Champion, Hanes, Russell Athletic, and Comfort Colors carry most of this list. That is what happens when you filter on Fabric type instead of marketing."
    else:
        heading = "Women\u2019s cotton."
        lede = "Cotton for lifting, studio work, walking, and everything after. Unisex listings appear here too."
        note = "Pure cotton bras and stretch shorts barely exist: most \u201ccotton\u201d versions came back 92\u201395% cotton with spandex, so they sit in the reject log instead of on this page."

    body = f"""<section class="page-intro">
  <p class="eyebrow">{e('Men' if gender == 'men' else 'Women')}</p>
  <h1>{e(heading)}</h1>
  <p class="lede">{e(lede)}</p>
  <p class="note">{e(note)}</p>
  <nav class="jump-nav" aria-label="Categories">{jump}</nav>
</section>
""" + "\n".join(category_deck(c, items) for c, items in decks)

    return page(
        slug=f"{gender}.html",
        title=f"{'Men' if gender == 'men' else 'Women'} \u00b7 Cotton Gym Wear",
        description=f"{'Men' if gender == 'men' else 'Women'}\u2019s 100% cotton gym wear on amazon.com \u2014 verified on the Fabric type line, ordered by Amazon star rating.",
        body=body,
        active=gender,
    )


def build_guides_index() -> tuple[str, str]:
    body = """<section class="page-intro">
  <p class="eyebrow">Guides</p>
  <h1>Three guides, no filler.</h1>
  <p class="lede">Enough to decide what to buy and to sanity-check our fibre claims. That is the whole library.</p>
</section>
<section class="section">
  <div class="guide-cards">
    <a class="guide-card" href="cotton-vs-polyester.html"><h3>Cotton vs polyester</h3><p>Sweat, smell, drying time, and the workouts where synthetics still win.</p><span class="guide-go">Read <span aria-hidden="true">\u2192</span></span></a>
    <a class="guide-card" href="best-cotton-gym-shorts.html"><h3>Best cotton gym shorts</h3><p>Every pair that passed the check, plus the rejects worth naming.</p><span class="guide-go">Read <span aria-hidden="true">\u2192</span></span></a>
    <a class="guide-card" href="how-we-pick.html"><h3>How we pick</h3><p>The five-step check, the reject log, and the rules we will not bend.</p><span class="guide-go">Read <span aria-hidden="true">\u2192</span></span></a>
  </div>
</section>"""
    return page(
        slug="guides/index.html",
        title="Guides \u00b7 Cotton Gym Wear",
        description="Short guides on cotton gym wear: cotton vs polyester, the best 100% cotton gym shorts, and how we verify fibre content.",
        body=body,
        depth=1,
        active="guides",
        has_product_links=False,
    )


def build_cotton_vs_polyester() -> tuple[str, str]:
    body = """<section class="page-intro">
  <p class="eyebrow">Guide</p>
  <h1>Cotton vs polyester.</h1>
  <p class="lede">Both fabrics have a job. This is where each one earns it \u2014 without pretending cotton wins every workout.</p>
</section>
<div class="prose">
  <h2>Where cotton wins</h2>
  <ul class="bullets">
    <li><strong>Weights and low-to-moderate intensity.</strong> You rest between sets, so drying speed matters less than feel.</li>
    <li><strong>Against skin.</strong> A natural fibre, with no microplastic-shed story to defend.</li>
    <li><strong>Odour after a wash.</strong> Plenty of people find poly holds smell through the laundry in a way cotton does not.</li>
    <li><strong>Gym to street.</strong> A cotton tee and jersey shorts read as clothes, not a costume.</li>
  </ul>
  <h2>Where polyester wins</h2>
  <ul class="bullets">
    <li><strong>Long runs and HIIT.</strong> It moves moisture and dries faster, so it stays lighter when you are soaked.</li>
    <li><strong>Cold and wet conditions</strong>, where a saturated cotton tee turns into a heavy, cold layer.</li>
    <li><strong>Chafe-prone sessions.</strong> A wet cotton seam over 10km is its own punishment.</li>
  </ul>
  <h2>The honest summary</h2>
  <p>If cardio is your main event, a synthetic kit is probably the right tool and this is not your shop. If you lift, walk, do studio work, or simply want natural fibre against your skin, cotton is a fine default \u2014 and far harder to find at 100% than the marketing suggests.</p>
  <h2>Reading a listing like we do</h2>
  <p>Ignore the title. Scroll to <strong>Fabric type</strong> (sometimes <em>Material composition</em>) on the product page. Watch for two traps: a listing whose heather colourways drop to 60/40 cotton-poly, and \u201ccotton\u201d activewear that is 95% cotton with 5% spandex. Both fail our check.</p>
  <p class="prose-cta"><a class="btn btn--solid" href="../men.html">Men\u2019s picks</a> <a class="btn btn--outline" href="../women.html">Women\u2019s picks</a></p>
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
    shorts_category = CATEGORY_BY_KEY["shorts"]

    reject_rows = "\n".join(
        f"        <tr><td>{e(r['name'].strip() or r['asin'])}</td><td>{e(r['reject_notes'].strip())}</td></tr>"
        for r in rejected_shorts
    )

    body = f"""<section class="page-intro">
  <p class="eyebrow">Guide</p>
  <h1>Best cotton gym shorts.</h1>
  <p class="lede">Titles say cotton; the Fabric type line decides. Everything below passed.</p>
  <p class="note">Cotton jersey shorts are for lifting and gym-to-street. If you want quick-dry running shorts, buy synthetics \u2014 we will not pretend otherwise.</p>
</section>
{deck_markup(
    deck_id="deck-shorts-men",
    title="Men\u2019s and unisex",
    blurb="Jersey cotton shorts for weights and the walk home.",
    note=shorts_category.rank_note,
    products=mens,
)}
{deck_markup(
    deck_id="deck-shorts-women",
    title="Women\u2019s and unisex",
    blurb="The women\u2019s shorts that survived the check \u2014 a short list on purpose.",
    note=shorts_category.rank_note,
    products=womens,
)}
<section class="wide">
  <h2>The rejects worth naming</h2>
  <p class="wide-lede">These sell as cotton shorts. They are not 100% cotton, so they get no card and no affiliate link \u2014 only a note.</p>
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
  <h2>How to buy without getting burned</h2>
  <ul class="bullets">
    <li>Check <strong>Fabric type</strong> on the listing, then check it again for your colour \u2014 heathers are frequently blends.</li>
    <li>Cotton jersey shrinks. Between sizes, size up or expect a shorter inseam after the first wash.</li>
    <li>Pockets and inseam vary between the same brand\u2019s ASINs; read the bullet points, not the photo.</li>
  </ul>
</div>"""
    return page(
        slug="guides/best-cotton-gym-shorts.html",
        title="Best 100% cotton gym shorts \u00b7 Cotton Gym Wear",
        description="The 100% cotton gym shorts that passed an Amazon Fabric type check, plus the \u201ccotton\u201d shorts that turned out to be blends.",
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
  <h1>How we pick.</h1>
  <p class="lede">One pass, five steps, and a reject log we publish instead of hiding.</p>
</section>
<div class="prose">
  <ol class="steps">
    <li><strong>Find gym-relevant amazon.com listings</strong> by category \u2014 tees, shorts, joggers, socks, bras.</li>
    <li><strong>Read the Fabric type or materials line</strong> on the product page itself, not the title or the ad copy.</li>
    <li><strong>Only 100% cotton gets a card.</strong> Everything else goes to the reject log below, with the exact composition we saw.</li>
    <li><strong>Order each category by the Amazon star rating</strong> recorded during that check. Ratings move; the cards say so.</li>
    <li><strong>Flag the traps</strong> \u2014 listings where solids are 100% cotton but heathers are blends carry a \u201csolids only\u201d note.</li>
  </ol>
  <h2>What we will not do</h2>
  <ul class="bullets">
    <li>Invent a fibre percentage, a rating, or a price.</li>
    <li>List a blend because a category looks thin. That is why the bra section holds {len([p for p in products if p.category == 'bra'])} item.</li>
    <li>Pretend cotton beats synthetics for every workout.</li>
  </ul>
  <h2>Product photos</h2>
  <p>Images come straight from Amazon\u2019s public catalogue URL for each ASIN. Some listings have no image there, so those cards show a plain placeholder rather than a stand-in photo of a different product.</p>
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
  <p class="prose-cta"><a class="btn btn--solid" href="../index.html">Back to the shortlist</a></p>
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
  <h1>That page went missing in the wash.</h1>
  <p class="lede">The link is dead, but the shortlist is not.</p>
  <div class="cta-row" style="margin-top:28px">
    <a class="btn btn--solid" href="index.html">Home</a>
    <a class="btn btn--outline" href="men.html">Men</a>
    <a class="btn btn--outline" href="women.html">Women</a>
    <a class="btn btn--text" href="guides/index.html">Guides</a>
  </div>
</section>"""
    return page(
        slug="404.html",
        title="Page not found \u00b7 Cotton Gym Wear",
        description="That page does not exist. Jump back to the 100% cotton gym wear shortlist.",
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
