# cottongymwear.com

Static affiliate shortlist of gym wear that reads **100% cotton** on Amazon's Fabric type
line. Light editorial UI, swipeable photo decks per category, ordered by the Amazon star
rating captured during the fibre check.

The site lives at the repo root, so Vercel (or any static host) serves it with zero config.

```
index.html            home — hero, featured deck, every category deck
men.html              men's + unisex decks
women.html            women's + unisex decks
guides/               cotton vs polyester · best cotton gym shorts · how we pick
assets/css/styles.css single stylesheet, no frameworks, no webfonts
assets/js/swipe.js    deck drag/arrows/progress + image fallback (progressive enhancement)
data/product-shortlist.csv  the only source of product truth
data/image-status.csv       which ASINs have a public Amazon photo
tools/build.py        generates every HTML page from the CSV
tools/check-images.py refreshes data/image-status.csv
sitemap.xml           generated alongside the pages
```

## The aesthetic

The brief: *if Apple or Nike made a sparse affiliate page for 100% cotton gym wear.* The
older dark, stat-heavy rail layout is gone. What replaced it:

- **Light and quiet.** Off-white `#fbfbf9` canvas, white cards, hairline `#e6e4de` rules,
  near-black ink. No dark surfaces, no accent colour doing the heavy lifting — the product
  photography is the only colour on the page.
- **Negative space first.** Big section padding, a centred hero, one idea per screen.
- **System display type.** SF Pro / Segoe / Roboto stack at 600 weight with tight tracking
  on headings. Zero webfonts, so zero render-blocking requests.
- **Photos, not tables.** Every card leads with a square product image on a soft tile.
- **Swipe decks.** Each category is a horizontally scroll-snapped deck. Touch uses the
  browser's own momentum scrolling; mouse drag is wired up in `swipe.js`. The next card
  always peeks in, a hairline progress thumb tracks position, a "Swipe" label fades after
  the first movement, and arrow buttons appear when a deck overflows.
- **One obvious CTA.** A full-width black "View on Amazon" pill pinned to the bottom of
  every card, aligned across a row.
- **Three words, always.** The brand renders as `Cotton` `Gym` `Wear` — separate spaced
  spans in the header and footer, and spelled out in every `<title>`. Never jammed into
  one word. (The bare domain `cottongymwear.com` is the exception, because it is a domain.)
- **Calm copy.** Short, declarative, no stats dashboard. Honesty lines (fabric string,
  ASIN, caveats) stay on the card but sit quietly at the bottom.

Editing the look means editing `assets/css/styles.css` and the markup helpers in
`tools/build.py` (`card_markup`, `deck_markup`, `page`), then rebuilding.

## Run locally

```bash
python3 -m http.server 8765
# then open http://localhost:8765/
```

Any static server works; the site has no build step at request time and no external
requests (fonts, analytics, CDNs are all absent).

## Editing content

Pages are **generated**. Edit `data/product-shortlist.csv` (products) or the copy strings in
`tools/build.py` (headlines, guide prose, category blurbs), then regenerate:

```bash
python3 tools/build.py          # rewrite index/men/women/guides/sitemap
python3 tools/build.py --check  # non-zero exit if committed pages are stale
```

`--check` is what to wire into CI if you want to guarantee the HTML matches the CSV.

### Product data rules enforced by the generator

- Only rows with `status=qualify` **and** `cotton_pct=100` are rendered. Everything else can
  only appear in the reject log tables, which carry no affiliate links.
- Ratings come from the `Rating x.y` fragment in `why_qualifies`. No rating in the CSV means
  the card shows "Unrated" and sorts last — never a guessed number.
- Prices only render when `price_band` starts with `~$`; otherwise the card says
  "Price on Amazon".
- `reject_notes` on a qualifying row (e.g. heather colourways that are blends) becomes a
  "Solids only" warning chip.
- Rows describing the same garment under several ASINs are merged into one card, with the
  duplicate ASINs shown as secondary links instead of padding the ranking.
- Nothing is hand-written into the HTML, so a fibre percentage cannot be invented by editing
  a page.

### Product photos

Images come from the standard public Amazon catalogue URL for the ASIN:

```
https://m.media-amazon.com/images/P/{ASIN}.01._SCLZZZZZZZ_.jpg
```

Nothing else is ever used — no scraped CDN paths, no stand-in photo of a similar product.

Amazon answers that URL with **HTTP 200 and a 43-byte 1×1 GIF** when an ASIN has no image
there, which means `onerror` never fires. Two layers handle it:

1. `python3 tools/check-images.py` probes every qualifying ASIN once and writes
   `data/image-status.csv` (`asin,image` where image is `ok` or `missing`). The build reads
   that file and emits a typographic placeholder tile instead of an `<img>` for the misses.
   Re-run it when the CSV gains ASINs; if the file is absent the build assumes `ok`.
2. `assets/js/swipe.js` re-checks at runtime — any image that decodes at ≤ 2 px wide, or
   fails outright, swaps to the same placeholder. So a listing that loses its photo later
   degrades gracefully without a rebuild.

Where several ASINs were merged into one card, the photo comes from whichever of those
ASINs has one — they are the same garment by definition of the merge.

## Deploy to Vercel (static, zero config)

The repo root is the site, so no framework preset, build command, or output directory is
needed.

1. **Import** `github.com/cottongymwear/cottongymwear` in Vercel → New Project.
2. Framework preset: **Other**. Build command: *empty*. Output directory: *empty* (root).
3. Deploy. Every push to `main` ships; pull requests get preview URLs.

CLI equivalent:

```bash
npx vercel        # preview deploy
npx vercel --prod # production deploy
```

### Domain notes

- Add `cottongymwear.com` **and** `www.cottongymwear.com` in Vercel → Project → Settings →
  Domains, then pick one as primary (recommended: apex `cottongymwear.com`, with `www`
  redirecting to it) so link equity and the Associates tag land on one host.
- At the registrar: apex `A` record → `76.76.21.21`, and `www` `CNAME` →
  `cname.vercel-dns.com`. Vercel shows the exact values when the domain is added; use
  whatever it prints rather than these defaults if they differ.
- HTTPS is automatic once DNS resolves. Until the domain is live the `*.vercel.app` URL is
  fine for review.
- `SITE_URL` in `tools/build.py` feeds `<link rel="canonical">`, Open Graph URLs, and
  `sitemap.xml`. It is already `https://cottongymwear.com`; change it there (not in the
  HTML) if the live host differs, then rebuild.

## Amazon Associates tag — TODO before launch

Product links are currently plain `https://www.amazon.com/dp/{ASIN}` with
`rel="nofollow sponsored noopener"`. They work today and earn nothing.

To attach tracking once the Associates store id is approved:

1. Set `ASSOCIATES_TAG = "yourstore-20"` at the top of `tools/build.py`.
2. `python3 tools/build.py` — every product link becomes
   `https://www.amazon.com/dp/{ASIN}?tag=yourstore-20`.
3. Commit the regenerated pages and delete the `TODO(associates)` note that the footer
   template prints into each page.

Compliance notes that are already handled:

- The affiliate disclosure appears twice on every page that links to products — under the
  header above the first deck, and the long form in the footer.
- Guide pages without product links (guides index, cotton vs polyester, how we pick) still
  carry the footer disclosure.
- Amazon prices are never presented as current: every price band renders as `~$X` followed
  by "when checked". Keep it that way; Associates rules forbid publishing stale prices as
  live ones.
- Product links keep `rel="nofollow sponsored noopener"`, including the photo link.

## Accessibility and performance

- Skip link, `aria-current` on the active nav item, focus-visible rings, decks reachable by
  keyboard (`tab` into a deck, then arrow keys), labelled arrow buttons,
  `prefers-reduced-motion` honoured.
- Ratings read as text ("4.5 on Amazon"); the star glyph is `aria-hidden`.
- Card photos are decorative (`alt=""`) because the product name sits next to them, and the
  photo link is `aria-hidden` with `tabindex="-1"` so it is not a duplicate tab stop.
- Photos are lazy-loaded with explicit dimensions, so decks do not shift as they load. Apart
  from the Amazon images there are no external requests: no fonts, no analytics, no CDN —
  one CSS file and one ~4 KB JS file.
