# Cotton Gym Wear

Direct shop for cotton gym wear. Every piece is a Printful blank whose Black, White, and Navy are 100% cotton. Heather and poly-fleece cuts are not sold. Prices are in GBP. Checkout ships to the United Kingdom and the United States.

This is a print-on-demand shop, separate from any affiliate shortlist. There are no affiliate links and no affiliate disclosure on the checkout path.

## Stack

- Next.js App Router and React
- Catalog in `lib/catalog.ts` (sample data until Printful sync variants are linked)
- Bag in the browser (`localStorage`)
- Checkout: [Stripe Checkout](https://stripe.com/payments/checkout) when `STRIPE_SECRET_KEY` is set, otherwise a preview order that does not charge a card
- Fulfillment: Printful Orders API (`POST /orders`) from the Stripe webhook, using sync variant ids

Printful’s own hosted store was not used. The shop is this site; Printful prints and ships after payment.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm test        # catalog and shipping checks
npm run build   # production build
npm start       # serve the production build
```

Copy `.env.example` to `.env.local` when you are ready to connect services. The shop runs with every variable blank.

## Catalog

Eight products live in `lib/catalog.ts`: men’s and women’s cotton tees, a muscle tank, and a long sleeve. Each one has a Printful catalog product id. Colours are only Black, White, and Navy.

| Piece | Blank | Printful id |
| --- | --- | --- |
| Training Tee | Bella + Canvas 3001 | 71 |
| Heavy Cotton Tee | Gildan 5000 | 438 |
| V-Neck Tee | Bella + Canvas 3005 | 223 |
| Muscle Tank | Bella + Canvas 3480 | 248 |
| Relaxed Tee | Bella + Canvas 6400 | 360 |
| Softstyle Tee | Gildan 64000 | 12 |
| Heavyweight Tee | Comfort Colors 1717 | 586 |
| Long Sleeve | Bella + Canvas 3501 | 356 |

Each variant SKU is the Printful `external_id` to set later, for example `cgw-mens-training-tee-black-m`. Orders need a **sync variant** with that external id. The catalog product id is for reference and for live shipping quotes.

Do not add a short, jogger, hoodie, sock, or bra until that blank’s solid colour is verified 100% cotton. Many Printful fleece and sock blanks are poly blends.

Placeholder art is drawn in the page. Replace it with Printful mockups when designs exist. Do not commit photos you do not have rights to use. The products are not copied from any other retailer’s listings.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | For deploy | Stripe return URLs and canonical links. `http://localhost:3000` locally. Production: `https://cottongymwear.com` once DNS exists. |
| `PRINTFUL_API_KEY` | For live fulfillment | Private token from Printful → Settings → API. |
| `PRINTFUL_STORE_ID` | If the token sees multiple stores | Sent as `X-PF-Store-Id`. |
| `PRINTFUL_AUTO_CONFIRM` | No | `false` (default) creates **draft** orders. `true` submits them for fulfillment and charges your Printful billing method. |
| `STRIPE_SECRET_KEY` | For card payments | Secret key. Without it, checkout is a preview. |
| `STRIPE_WEBHOOK_SECRET` | With Stripe | Signing secret for `POST /api/webhooks/stripe`. |

Never commit `.env.local` or real keys.

## Connect Printful

1. Create a Printful store. Set the store currency to **GBP** so shipping quotes match the shop.
2. Add the eight blanks from `lib/catalog.ts`, solids only: Black, White, Navy. Skip heather, ash, and sport grey.
3. On each sync product, set the external id to the product id (`cgw-mens-training-tee`). On each size/colour variant, set the external id to the SKU (`cgw-mens-training-tee-black-m`).
4. Put the private token in `PRINTFUL_API_KEY`.
5. `GET /api/printful/status` reports how many store products exist and how many SKUs matched. It does not print the token.
6. Leave `PRINTFUL_AUTO_CONFIRM` unset until a draft order in the Printful dashboard looks right.

Live shipping rates (`POST /shipping/rates`, currency `GBP`) replace the sample UK/US rates only after every line in the bag has a catalog variant id from that sync. Until then the checkout shows the sample rates in `lib/shipping.ts`.

The Stripe webhook creates the Printful order with `sync_variant_id` and an `external_id` derived from the Checkout Session id. Unlinked SKUs are reported and not retried. Printful errors that look temporary return HTTP 500 so Stripe retries.

Sample checkout rates use the ids `STANDARD` and `EXPRESS`. Printful drafts are created with `STANDARD` until the quote itself came from Printful, so an express sample rate does not send an unknown shipping code. Upgrade the service on the draft in the Printful dashboard if the customer paid for the faster sample rate.

## Connect Stripe

1. Create a Stripe account and use test keys first.
2. Set `STRIPE_SECRET_KEY`.
3. Point a webhook at `https://<your-host>/api/webhooks/stripe` for `checkout.session.completed`.
4. Set `STRIPE_WEBHOOK_SECRET`.
5. Locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

Checkout collects the address on this site (UK default, US optional), charges the catalog price plus shipping in GBP, and redirects to Stripe only when the secret key is present.

## Deploy on Vercel

1. Import the GitHub repository. Framework preset: Next.js.
2. Add the environment variables above for Preview and Production. Use the preview URL as `NEXT_PUBLIC_SITE_URL` until the domain resolves.
3. Deploy. `npm run build` is the build command.
4. When `cottongymwear.com` is registered, add the apex and `www` in Vercel → Domains and set `NEXT_PUBLIC_SITE_URL=https://cottongymwear.com`. HTTPS follows once DNS points at Vercel.

## Still to do before a public launch

- Buy and connect `cottongymwear.com`. DNS is outside this repo. Until then, the Vercel preview URL is enough. Set `NEXT_PUBLIC_SITE_URL` to the host you are actually using.
- Open the Printful account, pay for fulfillment there, upload the artwork, and link every SKU.
- Turn on Stripe live keys only after a test-mode payment creates a Printful **draft**.
- Set `PRINTFUL_AUTO_CONFIRM=true` only when drafts should be produced and shipped.
- Swap placeholder art for Printful mockups.
