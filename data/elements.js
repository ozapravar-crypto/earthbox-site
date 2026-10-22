// ─────────────────────────────────────────────────────────────────────
// data/elements.js · the nine elemental plant groups + which chamber suits which
//
// Read by Care (refill kits per group, visit plans) and the chamber pages.
// The plant list, foundations and recipes moved to the internal design
// tool (earthbox-studio, D-2026-10-22-a).
// ─────────────────────────────────────────────────────────────────────

// The nine elemental plant groups · `focus` is the list's own wording.
/** @typedef {typeof elements[number]} Element */
export const elements = [
  { id: 'Earth', focus: 'Robust growth, diverse variegation', heading: 'Soil-based classics' },
  { id: 'Fire',  focus: 'Heat-tolerant, water-storing', heading: 'High light & succulents' },
  { id: 'Water', focus: 'Thrives in moisture-rich air', heading: 'High humidity & aquatic-leaning' },
  { id: 'Air',   focus: 'Grows on surfaces, loves airflow', heading: 'The epiphyte collection' },
  { id: 'Aero',  focus: 'No soil · fed by mist', heading: 'Tillandsia & air-feeders' },
  { id: 'Frost', focus: 'Prefers cooler temperatures', heading: 'Cold-tolerant & high-altitude' },
  { id: 'Bite',  focus: 'Carnivorous · humidity-dependent', heading: 'Carnivorous & unique mechanisms' },
  { id: 'Moss',  focus: 'Carpet species for the floor', heading: 'The carpet collection' },
  { id: 'Dark',  focus: 'Low light, deep colour', heading: 'Low light & glowing veins' }
];

// Which plant groups each chamber's climate suits.
// Lab is adjustable, so every group. Spore grows mushroom cultures,
// which are not on the plant list — the studio picks the strain.
/** @type {Record<string, string[] | 'all'>} */
export const chamberElements = {
  WaterBox: ['Water'], MossBox: ['Moss'], FireBox: ['Fire'], DarkBox: ['Dark'],
  AeroBox: ['Aero'], AirBox: ['Air'], FrostBox: ['Frost'], BiteBox: ['Bite'],
  LabBox: 'all', SporeBox: []
};
