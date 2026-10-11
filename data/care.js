// ─────────────────────────────────────────────────────────────────────
// care.js · EarthBox Care: refill kits and visit plans (data only)
//
// Plan: CARE-PLAN.md. Homes buy a refill kit matched to their plant group,
// or a visit plan (how long × how often). Businesses ask for a quote on
// care.html. Rules (visit counts, prices, plan links) live in
// scripts/care.js; the cart reads both.
//
// Every price is null until Aayush sets it, and null shows "On enquiry",
// so the whole service works before prices exist. To price:
//   · a kit       → set `price` on it (whole rupees)
//   · visit plans → set visit.perVisit, then termDiscount if wanted
// Checked by scripts/care.test.mjs.
// ─────────────────────────────────────────────────────────────────────

import { elements } from './maker.js';

// What a kit holds, per plant group. Soils follow the studio's requirements
// workbook (03 · Taxonomy). Carnivorous plants get no feed: fertiliser
// burns their roots. The care page says the studio confirms contents.
const KIT = {
  Earth: ['Aroid mix top-up', 'Slow-release organic feed', 'Pruning snips', 'Care card'],
  Fire:  ['Succulent & cactus mix top-up', 'Low-strength liquid feed', 'Precision watering bottle', 'Care card'],
  Water: ['Moss substrate top-up', 'Low-strength liquid feed', 'Fine mister', 'Care card'],
  Air:   ['Aroid mix top-up', 'Foliar feed for epiphytes', 'Fine mister', 'Care card'],
  Aero:  ['Foliar feed for air plants', 'Fine mister', 'Soaking guide', 'Care card'],
  Frost: ['Moss substrate top-up', 'Low-strength liquid feed', 'Fine mister', 'Care card'],
  Bite:  ['Carnivorous mix top-up (no nutrients)', 'Distilled-water reminder card', 'Long tweezers', 'Care card'],
  Moss:  ['Moss substrate top-up', 'Fine mister', 'Moss trimming scissors', 'Care card'],
  Dark:  ['Aroid mix top-up', 'Low-strength liquid feed', 'Leaf-cleaning cloth', 'Care card']
};

export const kits = elements.map(e => ({
  sku: `KIT-${e.id.toUpperCase()}`,
  element: e.id,
  name: `${e.id} refill kit`,
  for: e.heading,
  contents: KIT[e.id],
  price: null
}));

export const visit = {
  durations: [
    { id: 'once', label: 'One visit',  months: 0 },
    { id: '3m',   label: '3 months',   months: 3 },
    { id: '6m',   label: '6 months',   months: 6 },
    { id: '12m',  label: '12 months',  months: 12 }
  ],
  frequencies: [
    { id: 'fortnightly', label: 'Every 2 weeks',  perMonth: 2 },
    { id: 'monthly',     label: 'Every month',    perMonth: 1 },
    { id: 'quarterly',   label: 'Every 3 months', perMonth: 1 / 3 }
  ],
  perVisit: null,                        // rupees per visit, set by the studio
  termDiscount: { '6m': 0, '12m': 0 },   // e.g. 0.05 = 5% off a 6-month plan
  includes: ['Trim, tidy and clean the glass', 'Top up soil and feed', 'Check moisture, light and pests', 'Replace a struggling plant (charged at cost)', 'Photo note after every visit']
};

// What a home customer wants looked after.
export const subjects = [
  { id: 'piece',  label: 'An EarthBox piece',  note: 'A chamber, planter or plant you bought from us.' },
  { id: 'custom', label: 'A custom box',       note: 'A world designed in the Maker. Visits are quoted, as each one is different.' },
  { id: 'own',    label: 'My own plants',      note: 'Plants and terrariums from anywhere. Tell us roughly how many.' }
];

// Mumbai only for visits. Pincodes 400001–400104 are Mumbai; anything else
// is still accepted and the studio confirms.
// ponytail: prefix check, swap for an explicit pincode list if the studio covers Thane/Navi Mumbai.
export const coverage = { city: 'Mumbai', isCovered: (pin) => /^400(0\d\d|10[0-4])$/.test(String(pin)) };

export const businessSites = ['Office', 'Café or restaurant', 'Hotel', 'Clinic', 'Retail store', 'Other'];
