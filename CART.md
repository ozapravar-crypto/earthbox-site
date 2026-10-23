# Cart + Saved list

**TL;DR:** Every page has **Saved** and **Cart** in the header. The cart holds two kinds of line and tallies what can be tallied. "Checkout" sends the whole order to the studio on WhatsApp or by email. The studio confirms the total, delivery and lead time, then sends a Razorpay payment link. No money is taken on the site yet.

## Where lines come from

Lines are added from:
- **Product pages:** Add to cart / Save, using the chosen size and material.
- **Catalogue cards** (since 14 Oct 2026): Add and Save on each card, using the shopper's **"Where will it live?"** choice. Indoors → PETG, Sunny window → ABS, Balcony → ASA (`places` in `data/volume-one.js`), plus the piece's first size. The choice is stored as `earthbox-place` and shared with product pages. See `SHOPPING-PLAN.md`.
- **Care** (kits and visit plans), and **"Goes with your order"** in the drawer.

## Two kinds of line

| Kind | What's in it | How it shows | How it counts |
|---|---|---|---|
| **Ready to order** | Volume I pieces with a price per size × material (`pricing` in `data/volume-one.js`) | Price on the right, quantity stepper | Exact: price × qty |
| **Price on enquiry** | Pieces with `pricing: null` (Elemental chambers are coming soon: Saved only, never in the cart, since 12 Oct 2026) | Italic "On enquiry"; chambers also show their published range as "Guide" | Ranges go into the estimate; the rest are counted as "to quote" |

The summary shows: priced items (exact), chambers (guide range), how many items are still to quote, and an **estimated total**.

**When Aayush adds prices,** nothing in the cart changes. Add a `pricing` table to a Volume I piece. The line moves from "On enquiry" to priced automatically.

## Files

| File | Owns |
|---|---|
| `scripts/cart.js` | Rules (pure, exported: `resolve`, `totals`, `buildTotal`, `clean`, `add`/`remove`/`move`/`setQty`, `orderText`) + header buttons + `<dialog>` drawer |
| `scripts/cart.test.mjs` | `node scripts/cart.test.mjs` |
| `styles/components.css` | "Cart + saved list" block at the end |

- **Any page** can add a button: `data-add-line='{"kind":"product","sku":"…","variant":…,"material":…}'` or `data-save-line='…'`. Care plans use `{"kind":"care","code":"<plan code>"}`.
- **Storage:** `localStorage['earthbox-cart']`. It holds ids only, re-read on every page and resolved against `data/`, so unknown SKUs are dropped and prices are always current. It syncs across tabs. Lines for retired custom builds (`kind: "build"`, before 22 Oct 2026) are dropped silently.
- **Analytics:** `cart_add` · `saved_add` · `cart_open` · `cart_send` (whatsapp|form).

## Taking payment later (needs Razorpay KYC in EarthBox's name)

1. **Now:** the studio sends a Razorpay Payment Link per order. No code needed.
2. **Later:** add a small serverless checkout (the Cloudflare Worker, `worker/index.js`; see ACCOUNTS-PLAN.md). It re-prices the cart on the server from the same data, creates the Razorpay order, verifies the signature and handles the webhook. Swap the "Send order" button for "Pay". Only "Ready to order" lines can be charged up front; enquiry lines still need a quote.
