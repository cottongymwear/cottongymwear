#!/usr/bin/env python3
"""Record which ASINs have a public Amazon catalogue image.

Amazon answers the /images/P/{ASIN} URL with HTTP 200 and a 43-byte 1x1 GIF when
an ASIN has no image there, so the only way to know ahead of time is to fetch it.
The result is cached in data/image-status.csv; tools/build.py reads that file and
renders a typographic placeholder instead of a dead tile for the misses.

This never invents a product or an image: it only marks ok / missing.

Usage:
    python3 tools/check-images.py            # refresh data/image-status.csv
    python3 tools/check-images.py --dry-run  # print results, write nothing
"""

from __future__ import annotations

import argparse
import csv
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "product-shortlist.csv"
STATUS_PATH = ROOT / "data" / "image-status.csv"
IMAGE_URL = "https://m.media-amazon.com/images/P/{asin}.01._SCLZZZZZZZ_.jpg"

# Amazon's "no image" GIF is 43 bytes. Anything that small is not a photo.
MIN_BYTES = 200


def asins() -> list[str]:
    with CSV_PATH.open(newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    found = [
        row["asin"].strip()
        for row in rows
        if row["status"].strip().lower() == "qualify" and row["cotton_pct"].strip() == "100"
    ]
    return sorted(dict.fromkeys(a for a in found if a))


def probe(asin: str) -> str:
    request = urllib.request.Request(
        IMAGE_URL.format(asin=asin),
        headers={"User-Agent": "Mozilla/5.0 (cottongymwear build check)"},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read(4096)
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        print(f"  {asin}: fetch failed ({exc}) — leaving as ok", file=sys.stderr)
        return "ok"
    if body[:3] == b"GIF" or len(body) < MIN_BYTES:
        return "missing"
    return "ok"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="print results without writing")
    args = parser.parse_args()

    rows = []
    for asin in asins():
        state = probe(asin)
        print(f"{asin}\t{state}")
        rows.append((asin, state))

    if args.dry_run:
        return 0

    with STATUS_PATH.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["asin", "image"])
        writer.writerows(rows)
    missing = sum(1 for _, state in rows if state == "missing")
    print(f"wrote {STATUS_PATH.relative_to(ROOT)} — {len(rows)} ASINs, {missing} without a photo")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
