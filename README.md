# cottongymwear.com

Static affiliate shortlist of gym wear that reads **100% cotton** on Amazon's Fabric type
line. Dark UI, horizontal scroll-snap rails per category, cards ranked by the Amazon star
rating captured during the fibre check.

The site lives at the repo root, so Vercel (or any static host) serves it with zero config.

```
index.html            home — every category rail
men.html              men's + unisex rails
women.html            women's + unisex rails
guides/               cotton vs polyester · best cotton gym shorts · how we pick
assets/css/styles.css single stylesheet, no frameworks, no webfonts
assets/js/rails.js    rail arrows + edge fades (progressive enhancement)
data/product-shortlist.csv  the only source of product truth
tools/build.py        generates every HTML page from the CSV
sitemap.xml           generated alongside the pages
```

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

- The affiliate disclosure appears twice on every page that links to products — a callout
  above the first rail and the long form in the footer.
- Guide pages without product links (guides index, cotton vs polyester, how we pick) still
  carry the footer disclosure.
- Amazon prices are never hard-stated as current: cards say "About ~$X when we checked".
  Keep it that way; Associates rules forbid publishing stale prices as live ones.

## Accessibility and performance

- Skip link, `aria-current` on the active nav item, focus-visible rings, rails reachable by
  keyboard (`tab` into the rail, then arrow keys), labelled rail buttons, `prefers-reduced-motion`
  honoured.
- Ratings expose a text value plus an `aria-label` on the star graphic.
- No images, fonts, or third-party scripts: one CSS file and one ~2 KB JS file.
