# Shopping experience plan

*14 Oct 2026. Owner brief: "show the exact price like Flipkart, make Add to cart and Save easier, and anything else that makes buying better, in a way that suits EarthBox."*

**TL;DR:** ***"From ₹399" appears because each piece comes in 3 materials, and 2 pieces also come in sizes. On EarthBox the material really answers one question: where will the plant live? So we ask that once, at the top of the Catalogue: Indoors, or Balcony / outdoors. Every card then shows one exact price, with Add and Save buttons right on the card. After that come a delivery date, gifting for Diwali, and an easier last step. One thing to flag first: 23 of the 32 printed pieces are "coming soon", so better buttons alone won't move sales much. Getting more pieces orderable matters as much.***

## What a shopper meets today (checked in the code)

| Where | Today | Problem |
|---|---|---|
| Catalogue card | "From ₹399" (the lowest of 3 materials × sizes) | The price you pay is usually higher, a "bait" feeling. You must open the piece to learn it |
| Catalogue card | One link, no buttons | Add and Save need the product page first: 2–3 taps |
| Product page | Material picker (PETG / ABS / ASA) + size | Material names mean nothing to most buyers |
| Range | **9 of 32** printed pieces can be ordered; 23 are "coming soon" | Most of what a visitor browses can't be bought |
| After "Send order" | The studio confirms by WhatsApp | Fine for a studio, but there's no delivery date and no gifting option |

## How the big sites solve it, and what fits EarthBox

Flipkart and Amazon show the price of a **default choice** (the most-bought size or colour) and let you change it on the page. Shopping sites with materials (IKEA, Etsy makers) name the choice by **use** rather than by material: "outdoor", "kids' room".

EarthBox's materials already map to use. PETG is "standard indoor", and ASA is "outdoor, UV resistant, weatherproof" (from `data/volume-one.js`). So the one question a shopper can actually answer is **"Where will it live?"**

## Status

**Phase 1 shipped (14 Oct).** The owner set the direction: premium, closer to Cosmos than to Pinterest or Flipkart, with the presentation calls left to us. What was built:
- **One "Where will it live?" choice** with three places: **Indoors** (PETG), **Sunny window** (ABS) and **Balcony** (ASA). All three were kept, since every orderable piece comes in all three. The choice is remembered on the device and shared by the Catalogue and the product pages. The line under it names the material ("Prices in ASA: outdoor pro, UV resistant, weatherproof"), so nothing is hidden.
- **Cards show one exact price.** A piece with sizes shows its first size, with a quiet note ("Big Block · 3 sizes").
- **Save** is a small square on the photo; **Add** is a text button by the price, and a full-width bottom row on phones. "Coming soon" cards have Save only; their page still has "Register interest".
- **Product page:** the material buttons read "Indoors · PETG", "Sunny window · ABS" and "Balcony · ASA", open on the shopper's place, and changing one updates the Catalogue.

**Left out on purpose, to keep the Catalogue quiet:**
- **Filters:** with 9 orderable pieces, already listed first in each category, they'd be clutter. Revisit when more pieces go live.
- **Size chips on cards:** only 2 pieces have sizes, so the note plus the product page is enough.

## The plan

### Phase 1: exact prices + one-tap Add/Save (budget: about 1 session, ₹0)
1. **"Where will it live?" switch** at the top of the Catalogue: **Indoors** (PETG) or **Balcony / outdoors** (ASA).
   - It's remembered on this device and starts on Indoors.
   - Every card shows one exact price: "₹429 · indoor".
   - The product page opens on the same choice. Its material picker shows "Indoors · PETG", "Sunny window · ABS (heat resistant)" and "Balcony · ASA (weatherproof)", with the price beside each option.
2. **Sizes:** the card shows the price of the default size, plus "3 sizes" as small tappable chips that change the price on the card. *Default size: the smallest, unless Aayush names a best-seller.*
3. **Add and Save right on the card**, as a cart button and a heart. Add puts in the exact material + size shown, and the cart drawer confirms it ("Added: Capsule Planter · Indoors · ₹429"). "Coming soon" cards get "Notify me" instead of Add.
4. **Filters** that matter here: Ready to order · Indoors / Outdoors · Under ₹500 / ₹500–1,500 / Over ₹1,500.

### Phase 2: confidence to buy (about 1 session; needs 2 answers from Aayush)
5. **Delivery date on every price:** "Made to order · at your door by Tue 21 Oct", worked out from today + the lead time + Mumbai delivery. *Needs:* Aayush's real lead times.
6. **Gifting (Diwali is 8 Nov):** a "This is a gift" tick with a gift note and a different delivery name and address; the price is hidden on the slip. Plus a **Diwali gift sets** row: planter + plant + care kit, at one set price. *Needs:* set prices.
7. **Easier last step:** the cart asks only name, phone and pincode, checks the pincode against Mumbai coverage on the spot ("We deliver to 400101 ✓"), then sends one tidy WhatsApp or email order. That's the same studio-confirms flow as today, with fewer surprises.
8. **Recently viewed** row on the Catalogue and product pages (stored on the device).

### Phase 3: premium (after accounts and payments)
9. **Pay online** on the Razorpay plan (needs the legal answers first), with UPI as the main button.
10. **Saved list on every device** (Accounts phase A) and price-drop / back-in-stock alerts for "Notify me".
11. **"Complete the look"** on product pages: planter + matching plant + moss pole, reusing the "goes with" rules in the cart.
12. **See it in your space:** the Maker's 3D, shown at real size on the phone camera. This is a big piece of work, so it goes last.

## Budget vs premium

| | Budget (recommended now) | Premium |
|---|---|---|
| Price display | "Where will it live?" switch + exact card prices | Same, plus a delivery date and a live "price for your setup" in the cart |
| Buying | Add/Save on cards, pincode check, WhatsApp order | UPI/card payment on site (Razorpay, about 2% a sale) |
| Retention | Saved + recently viewed on this device | Accounts: saved everywhere, alerts, order history |
| Cost | ₹0 | ₹1,760/mo Vercel Pro + about 2% per payment (see `ACCOUNTS-PLAN.md`) |

## Flagged before building
- **Most of the range can't be bought yet.** That's 23 of 32 pieces. Every shopping improvement works only on the 9 that can. Ask Aayush which "coming soon" pieces can go live (with prices) soonest; that's the biggest lever.
- **The default material decides the price people see first.** Indoors (PETG, cheapest) is the honest default for most homes; the switch makes it obvious.
- **ABS** sits between the two and isn't needed for the switch, so it's still offered on the product page as "Sunny window". Aayush may prefer to drop it.
- **Gift sets and delivery dates need real numbers from Aayush.** Until he gives them, they don't go live; nothing is invented.

## How we'll check it (standing rule)
- **Unit tests:**
  - the price for every piece × material × size
  - the switch's default and memory
  - the card Add producing the same cart line as the product page
- **Playwright:**
  - switch → card prices change → Add from the card → cart shows the exact line
  - Save from the card
  - coming-soon cards say "Notify me"
  - filters
- Phone, tablet and desktop; a11y (the switch and the chips must be keyboard and screen-reader friendly); visual baselines; contrast; Lighthouse; QA docs.
