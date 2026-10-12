# EarthBox Care: what to sell, at what price, and what the page needs

*12 Oct 2026. Research: Mumbai market scan (sources and dates in the appendix). Prices are suggestions for Aayush to approve; nothing is live yet. The site shows "On enquiry" until prices are set in `data/care.js`.*

**TL;DR:** ***Sell three things, in this order of importance:***
1. ***Refill kits, ₹499–₹799.*** *Easy margin, no travel, and they ship.*
2. ***Visits every 3 months for EarthBox owners, ₹999 a visit.*** *This is the real reason to buy a terrarium from a studio and not a nursery.*
3. ***Office care, by quote, from ₹1,499 a visit.***

***A gardener visit in Mumbai costs ₹500–₹1,000. Nobody in India publishes a terrarium-care price, so EarthBox can own that line. But ₹999 a visit only pays its way if a helper makes the visit, or visits are grouped by area. If Aayush does every visit himself, charge ₹1,499. Answer the 5 questions in §5 before launch; the rest of the site is ready.***

---

## 1 · What Care is for (the thinking)

**Care exists to keep a ₹6,000–₹12,500 glass world alive after it leaves the studio.** Most terrariums die in the first year from overwatering, mould in the monsoon, or the wrong light. When one dies, the customer doesn't come back, and tells friends terrariums "don't work". So Care:
- protects the sale and the brand;
- gives repeat income: a 12-month plan earns more than one more planter;
- is the most natural thing to sell after a purchase.

**Who it's for, in priority order:**
1. **People who bought from EarthBox.** They already trust the studio, the visit is predictable, and it's the easiest sale. Offer care at checkout and on the order-confirmation message.
2. **People with their own terrariums or delicate plants** (from Ugaoo, a workshop, a gift). Larger market, but less predictable work. Mali-type jobs (balcony pots) dilute the brand.
3. **Small businesses:** cafés, clinics, boutique offices with 2–10 showpieces. Higher value per visit, but they want invoices, schedules and replacements.

**What Care is not:** a gardening service. Don't promise balcony or society-garden upkeep. Ordinary gardeners do that for ₹500, and EarthBox can't win on price there.

---

## 2 · Suggested prices

Two tiers, as always: **launch** (conservative, to win first customers) and **premium** (if Aayush makes every visit himself, or once there's demand).

### Visits (homes)
| | Launch | Premium | Why |
|---|---|---|---|
| **Per visit** (up to 3 pieces, about an hour, at one address) | **₹999** | **₹1,499** | Mumbai gardeners charge ₹500–₹1,000 a visit. Terrarium care is specialist work, but no one publishes a specialist price, so start just at the top of the familiar range |
| 6-month plan discount | 5% | 5% | Comparable plans give 0–8% |
| 12-month plan discount | 10% | 8% | Rewards paying up front |
| Extra piece beyond 3 | ₹150 per visit | ₹250 per visit | Quote for now *(site change needed to charge automatically)* |
| Far zone (south of Bandra, Thane, Navi Mumbai) | +₹300 per visit | +₹500 per visit | Travel from Kandivali roughly doubles. Quote for now |
| First visit (assessment, longest) | free on 6/12-month plans; else +₹300 | free on plans; else +₹500 | Weak evidence either way; keep it simple |
| Custom Maker box | quote, from ₹1,499 | quote, from ₹1,999 | Each is different |

**What these come to (launch):**

| Plan | Price |
|---|---|
| 12 months, every 3 months (4 visits) | **₹3,596 a year**. The headline plan for closed terrariums |
| 12 months, monthly (12 visits) | **₹10,789 a year**. A Mumbai garden plan costs about ₹10,000 |
| 6 months, monthly | **₹5,694** |

### Refill kits
| Band | Plant groups | Launch | Premium |
|---|---|---|---|
| A · Light | Air plants (Aero), Moss, Succulents (Fire) | **₹499** | ₹699 |
| B · Standard | Earth, Water, Air, Frost, Dark | **₹649** | ₹899 |
| C · Specialist | Carnivorous (Bite) | **₹799** | ₹1,099 |

**Costs and comparison:** a kit costs an estimated ₹250–₹600 to make, so these prices are 1.6–2× cost. Ugaoo's general kits are ₹649–₹1,499; EarthBox's are matched to the plant group.

### Businesses (a starting guide for quotes, not shown as fixed prices)
- **Per visit:** ₹1,499 a visit for up to 5 pieces, plus ₹200 per extra piece.
- **Or per piece:** ₹250 per piece per month, monthly visit included.
- **Minimum:** 3 months, ₹2,500/month.
- **Premium tier:** ₹2,499 a visit, or ₹400 per piece, with a 6-month minimum.
- **Replacements:** at cost.

Office plant-rental firms charge ₹90–₹200 per plant, but they supply cheap pot plants in bulk. EarthBox looks after showpieces.

---

## 3 · The money check (why the visit price matters)

One visit from Kandivali to a nearby suburb takes about 2–2.5 hours door to door. The estimated cost:

| Who makes the visit | Cost, nearby | Cost, far |
|---|---|---|
| A trained helper (~₹100/h) | **₹700–₹1,000** | ₹1,000–₹1,600 |
| Aayush himself (time valued at ₹500/h) | **₹1,500–₹1,900** | ₹2,300–₹3,500 |

**So:**
- ₹999 works only with a helper, or with 2–3 homes grouped on one trip, for example "Borivali Tuesdays".
- If Aayush makes every visit, launch at ₹1,499.
- Every 3 months is the right default for closed terrariums. It's honest, and it keeps visits low enough to group.

---

## 4 · What the Care page needs (built vs to do)

**Built:**
- a planner for homes: kit or visits, how long × how often, pincode
- a business quote form
- cart lines, and order messages that show the plan
- "Keep it thriving" on planter pages and in the Maker
- cart suggestions
- the site shows the price automatically as soon as `data/care.js` has numbers

**Do before launch (small, once §5 is answered):**
1. **Set the prices** in `data/care.js`: `perVisit`, `termDiscount`, and each kit's `price`. A five-minute job once approved.
2. **Say what a visit is**, on the page in one line: "Up to 3 pieces · about an hour · trim, clean the glass, top up soil and feed, check for mould and pests, photo note after." Vague services are the most common complaint in this market.
3. **Say where:** "Kandivali to Andheri at the base price; further on request". Visitors in Thane shouldn't book and then be refused.
4. **Make "Every 3 months" the default** for closed terrariums, and explain why in one line: "closed jars need very little; over-watering kills more terrariums than neglect". This builds trust; fortnightly visits for a closed jar looks like upselling.
5. **A short "what's not included" line:** replacement plants and new soil are charged at cost.
6. **Cancellation and refunds:** reschedule with 24 hours' notice; unused visits on a plan refunded. Others do this, and it makes a 12-month plan feel safe.
7. **Show the business "from" price:** "Offices and cafés from ₹1,499 a visit". The form stays for quotes.

**Later (when there's demand):**
- **Charge extras in the cart:** extra pieces, far-zone surcharge, first-visit fee. These need a small site change; until then they go in the quote.
- **A "monsoon check" one-off visit,** promoted June–September, when mould is the number-one terrarium killer in Mumbai.
- **Care at checkout:** after someone orders a planter or a Maker design, the confirmation offers the matching kit or a plan. The cart already suggests it.
- **A care log:** the photo notes after each visit, kept per customer. A real reason to stay subscribed.

**Not now:** online payment for plans. It needs Razorpay KYC; the studio sends a payment link, as for every order.

---

## 5 · Questions only Aayush can answer (blocks launch)

1. **Who makes the visits:** you, or a helper you'll train? This decides ₹999 or ₹1,499.
2. **How far will you go:** western suburbs only, or all of Mumbai with a surcharge?
3. **Own plants:** will you look after terrariums and plants that didn't come from EarthBox, or only terrariums? *(Recommendation: terrariums and delicate indoor plants only, no balcony pots.)*
4. **When a plant dies:** replace at cost, or one free replacement a year on 12-month plans?
5. **What's in each kit:** which mix and feed, how many grams. This confirms the bands above.

**Can wait:**
- the business minimum contract
- GST registration (likely not needed below ₹20 lakh of services; check with a CA)
- whether to offer offices in year one

---

## Appendix: sources (all checked 12 Oct 2026)

**Visits (Mumbai):**
- Chintaman Gardeners: ₹500–₹800 a visit, ₹1,500–₹3,000 a month. chintamangardener.in
- Elanters home gardener: ₹599 a visit. elanters.com/product/home-gardener
- Ander Baher balcony upkeep: ₹999 a visit. anderbaher.in/services/balcony-upkeep
- Greenlands, Malad: ₹9,999 a year for 12 visits, up to 10 plants. greenlands.co.in
- Ugaoo and Urban Company: prices not published.

**Plans (other cities):**
- Garden of Joy: ₹5,400 for 6 visits, ₹10,000 for 12. gardenofjoy.in
- Spaces & Wellbeing: ₹329–₹599 a month. spacesandwellbeing.com

**Offices:**
- Kayjay, Mumbai: ₹200 per plant per month, 50-plant minimum. indiamart.com
- Plantsguru, Pune: ₹87–₹160 per plant per month. plantsguru.com
- Interioforest, Mumbai: from ₹3,500 a month. interioforest.com

**Kit parts:**
- Ugaoo succulent mix 5 kg: ₹369–₹399.
- Ugaoo plant tonic 500 ml: ₹279.
- Terrarium tweezers 27 cm: ₹312 (Flipkart).
- Ugaoo kits: ₹649–₹1,499.
- Terrarium Labs DIY kit: ₹1,400.

**Costs:**
- Mumbai auto fare from 1 Sep 2026: ₹27 for the first 1.5 km, then ₹18.22/km (Free Press Journal).
- Zone I minimum wage: about ₹535–₹575 a day.

**Evidence gaps:**
- No published Indian terrarium-maintenance price was found.
- Carnivorous-mix and air-plant-feed prices are estimates.
- A cheap fix: phone Ugaoo, Ander Baher and Greenlands as a customer and ask for one visit for 3 terrariums in Kandivali.

Full working, tables and links: `CARE-RESEARCH-2026-10-12.md`.
