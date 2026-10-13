# EarthBox accounts: Premium plan, requirements and costs

*13 Oct 2026. Owner chose Premium. Builds on `earthbox-production-discovery.md` (Milestone 5) and `CART.md`. Prices are the providers' public free tiers as of Oct 2026; re-check before launch.*

**TL;DR:** ***Premium accounts can run on ₹0 a month at EarthBox's size. Every service has a free tier that covers a small shop. There are three catches:***
1. ***Vercel's free plan is for non-commercial sites.*** *A shop is commercial, so the honest cost is ₹0 now, and about $20/month once payments go live.*
2. ***Supabase's free database pauses after a week with no visitors.*** *A free daily check keeps it awake.*
3. ***Order history and Care visits only become fully real with online payments*** *(Stage 4), which waits on Aayush's legal answers.*

---

## 1 · What customers get

| Feature | What it does | Phase |
|---|---|---|
| **Sign in with Google**, or **email link** (no passwords) | One tap with Google, or a sign-in link sent by email | A |
| **Saved designs + favourites everywhere** | Maker designs and saved items follow you to any device. On first sign-in, what's in this browser is kept | A |
| **Account page** | Name, phone, delivery address; sign out; **delete my account** (required by India's DPDP Act) | A |
| **Order history** | Every order sent from the cart is saved with its lines and status: *Requested → Paid → Making → Shipped → Delivered*. Aayush updates the status | B |
| **Care plan + visit reminders** | A Care plan shows its visit dates; an email reminder goes out 2 days before each visit; reschedule by WhatsApp link | B |
| **Pay online** | Pay "Ready to order" lines on the site (Razorpay); the order is marked Paid automatically | C (Stage 4) |
| **Newsletter / early access** (opt-in tick box) | Members hear first about new chambers | A (list only) |

**Not included:**
- a member discount (Aayush's decision)
- WhatsApp message reminders (paid; email is free)
- an admin website for Aayush (he uses the Supabase table screen, which is free)

## 2 · Costs

| Service | Used for | Free tier (what's included) | Enough for EarthBox? | Paid tier (only if outgrown) |
|---|---|---|---|---|
| **Supabase** | Sign-in, database (accounts, designs, orders, care plans) | 50,000 monthly users, 500 MB data, Google + email sign-in | Yes, by a wide margin | Pro $25/mo (₹2,200): daily backups, no pausing |
| **Google sign-in** | "Sign in with Google" | Free | Yes | — |
| **Resend** | Sign-in links, order and reminder emails from `hello@earthbox.in` | 3,000 emails/month, 100/day | Yes (a few hundred a month expected) | $20/mo for 50,000 |
| **Vercel** | Hosting + 3 small server functions + 1 daily scheduled job | Hobby is free, **but its terms are for non-commercial use** | **Technically, not once it's a shop** | Pro $20/mo (₹1,760) |
| **Razorpay** (phase C) | Online payment | No setup or monthly fee | — | About 2% per payment, charged per transaction |
| **Domain email** `hello@earthbox.in` | Sender address and trust | Free forwarding: ImprovMX free tier or Cloudflare Email Routing | Yes | Google Workspace ₹136/user/mo if Aayush wants a real inbox |

**Totals:**

| | Phases A–B | From phase C (payments on) |
|---|---|---|
| **Free route** | **₹0/month** | ₹0 + about 2% per payment |
| **Recommended** | ₹0/month | **₹1,760/month** (Vercel Pro, commercial terms) + about 2% per payment |
| **Premium** | ₹3,960/month (+ Supabase Pro for backups and no pausing) | — |

**Free-tier risks and how we handle them:**
- **The database pauses after 7 quiet days:** the daily scheduled job (already needed for reminders) touches it every day.
- **No automatic backups on free:** a weekly free export of the tables to a private GitHub repo, as a scheduled GitHub Action.
- **Email limit of 100 a day:** fine at current volume; an alert if it's ever hit.

## 3 · How it's built (fits the current site)

The site stays static. Supabase handles sign-in and data directly from the browser. Row-level security means every person can only ever read or change their own rows.

Three small Vercel functions are added for what must not happen in the browser:
- `api/order.js`: records an order with server-checked prices
- `api/cron-daily.js`: sends reminders and keeps the database awake
- `api/razorpay-webhook.js`: phase C

**Tables:**

| Table | Holds |
|---|---|
| `profiles` | name, phone, address, newsletter opt-in |
| `saved` | designs and favourites (same codes the cart already uses) |
| `orders` | lines, server-calculated total, status, timestamps |
| `care_plans` | plan code, start date, visit dates, pincode |

**Secrets:** stored only in Vercel environment variables, never in the public repo. The browser gets only Supabase's public key, which row-level security makes safe.

## 4 · Phases, tests, definition of done

**A · Sign-in and saved things.** About 2–3 sessions.
- **What gets built:**
  - Google + email sign-in
  - account page and delete-account
  - saved designs/favourites sync, with the merge on first sign-in
  - newsletter opt-in
  - privacy page update
- **Tests:**
  - unit tests for the merge rules
  - Playwright tests against a test Supabase project: sign in, sync, sign out, delete
  - a row-level security test: user A can't read user B's rows
  - a11y on the new pages
- **Done when:** a design saved on a laptop appears on a phone after signing in.

**B · Orders and Care.** About 2–3 sessions.
- **What gets built:**
  - `api/order.js` records orders, re-priced on the server
  - order history page
  - status changes by Aayush in Supabase, which email the customer
  - Care plan dates and reminder emails from the daily job
- **Tests:**
  - a tampered price is recorded at the real price
  - a reminder is sent exactly once
  - a status change sends an email
- **Done when:** an order sent from the cart appears in the customer's history, and Aayush can move it to "Shipped".

**C · Pay online** (needs Stage 2 legal pages and Razorpay approval in EarthBox's name). About 2 sessions.
- **What gets built:** the earlier plan in `earthbox-production-discovery.md` Milestone 4, now writing to `orders`.

## 5 · What's needed from you / Aayush

**Already answered by the site (checked 13 Oct 2026):**
- **Owner account email:** `aayush.lilani@gmail.com` (`data/site.js`). Use it for Supabase, Google Cloud and Resend, so everything belongs to Aayush.
- **`earthbox.in` DNS is on Vercel** (`ns1/ns2.vercel-dns.com`), with no mail records yet. We can add the email records ourselves through Vercel; nobody else's permission is needed, but the Vercel CLI login on this machine has expired, so run `vercel login` once. This also means `hello@earthbox.in` doesn't exist yet. Free forwarding via **ImprovMX** works with Vercel DNS. Cloudflare Email Routing would need the domain moved to Cloudflare, so we skip it.
- **Delivery area:** "Delivery within Mumbai", studio in Kandivali (footer). Delivery *timing* is still unknown.
- **Refund policy:** the 4-tier schedule is live (12 h full → 20% after shipping) but still unconfirmed (`site-h04`).
- **Still unknown:** legal business name, GST status, delivery timing, Aayush's written OK on refunds.


| # | What | Why | Cost |
|---|---|---|---|
| 1 | A **Supabase account** (free) created with EarthBox's email, and me invited as a member | Data and sign-in should belong to the business | ₹0 |
| 2 | A **Google Cloud project** (free) for "Sign in with Google": create the OAuth client. I'll give exact click steps | Google requires the owner to create it | ₹0 |
| 3 | A **Resend account** (free). DNS records go in via Vercel (we control it) | Emails from `hello@earthbox.in` land in inboxes, not spam | ₹0 |
| 4 | **`hello@earthbox.in`** (doesn't exist yet): forward to `aayush.lilani@gmail.com` via ImprovMX (free, recommended), or a Workspace inbox (₹136/mo) | Replies to order emails | ₹0 / ₹136 |
| 5 | **Decision: Vercel Pro from phase C?** | Commercial-use terms | ₹1,760/mo |
| 6 | **Order statuses and wording** Aayush is happy to maintain (the five above?) | He updates them by hand | — |
| 7 | **Stage 2 answers** (refund wording, delivery area, legal name, GST) | Needed before phase C, and the account emails reference these policies | — |

Keys are never pasted in chat: each one is saved to a private file or straight into Vercel, as with the Sketchfab token.

Tracking: beads epic `site-aom` (phases A, B, C as child tasks).
