# Cotton Gym Wear

Direct shop for cotton gym wear. Jersey tees and tanks are 100% cotton solids. Fleece shorts, the hoodie, and the joggers are cotton-faced blends and are labeled that way. Prices are in GBP. Checkout ships to the United Kingdom and the United States.

This replaced the old static Amazon shortlist. There are no affiliate links.

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

Ten products live in `lib/catalog.ts`: men’s and women’s tees, tanks, and shorts, plus a heavyweight tee, hoodie, and joggers. Each variant SKU is the Printful `external_id` to set later, for example `cgw-mens-training-tee-black-m`.

Known Printful catalog product ids are filled in where the public catalog page confirms them (Bella + Canvas 3001 is `71`, and so on). A few women’s blanks still have `catalogProductId: null` until you confirm the id with `GET /products`. Orders do not need that id. They need a **sync variant** whose `external_id` is the SKU.

Placeholder art is drawn in the page. Replace it with Printful mockup URLs when designs exist. Do not commit photos you do not have rights to use.

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
2. Add the ten blanks from `lib/catalog.ts`, solids only: Black, White, Navy. Skip heather colours on the jersey styles.
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

- Register or connect `cottongymwear.com` if the purchase is still pending.
- Open the Printful account, upload the real artwork, and link every SKU.
- Turn on Stripe live keys only after a test-mode payment creates a Printful **draft**.
- Set `PRINTFUL_AUTO_CONFIRM=true` only when drafts should be produced and shipped.
- Swap placeholder art for Printful mockups.
- Confirm the women’s v-neck, muscle tank, and studio short blanks (catalog ids are intentionally unset).
