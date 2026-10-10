// ─────────────────────────────────────────────────────────────────────
// data/maker.js · Terrarium Maker catalogue
//
// Chambers come straight from upcoming.js, so names, climates and price
// ranges live in ONE place. Plants are the EarthBox Elemental 45 V3 list
// (SKUs match the Product Requirements workbook, tab 04).
//
// Nothing below is priced. Plants and foundations are "quoted on enquiry"
// until the workbook's Price column is filled — then add `price` here and
// the maker can sum it. See MAKER.md for every gap still open.
// ─────────────────────────────────────────────────────────────────────

import { volumeTwo } from './upcoming.js';

export const chambers = volumeTwo.boxes;

// The nine elemental plant groups · `focus` is the list's own wording.
export const elements = [
  { id: 'Earth', focus: 'Robust growth, diverse variegation' },
  { id: 'Fire',  focus: 'Heat-tolerant, water-storing' },
  { id: 'Water', focus: 'Thrives in moisture-rich air' },
  { id: 'Air',   focus: 'Grows on surfaces, loves airflow' },
  { id: 'Aero',  focus: 'No soil · fed by mist' },
  { id: 'Frost', focus: 'Prefers cooler temperatures' },
  { id: 'Bite',  focus: 'Carnivorous · humidity-dependent' },
  { id: 'Moss',  focus: 'Carpet species for the floor' },
  { id: 'Dark',  focus: 'Low light, deep colour' }
];

// Which plant groups each chamber's climate suits.
// Lab is adjustable, so every group. Spore grows mushroom cultures,
// which are not on the plant list — the studio picks the strain.
export const chamberElements = {
  WaterBox: ['Water'], MossBox: ['Moss'], FireBox: ['Fire'], DarkBox: ['Dark'],
  AeroBox: ['Aero'], AirBox: ['Air'], FrostBox: ['Frost'], BiteBox: ['Bite'],
  LabBox: 'all', SporeBox: []
};

// Soil-free chambers (their own specs: "soil-free growth", "eliminates soil").
export const SOILLESS = ['AirBox', 'AeroBox'];

// `form` only picks the line-drawing used in the preview. It is not a care claim.
export const plants = [
  ['PLT-001', 'Earth', 'Syngonium Neon Pink', 'leaf'],
  ['PLT-002', 'Earth', 'Syngonium Albo Variegata', 'leaf'],
  ['PLT-003', 'Earth', 'Philodendron Pink Princess', 'leaf'],
  ['PLT-004', 'Earth', 'Pothos Marble Queen', 'trail'],
  ['PLT-005', 'Earth', 'Tradescantia Nanouk', 'trail'],
  ['PLT-006', 'Fire',  'Jewel Alocasia', 'leaf'],
  ['PLT-007', 'Fire',  'Tradescantia Pink Fury', 'trail'],
  ['PLT-008', 'Fire',  "Echeveria 'Perle von Nürnberg'", 'rosette'],
  ['PLT-009', 'Fire',  'Haworthia Fasciata', 'rosette'],
  ['PLT-010', 'Fire',  "Burro's Tail", 'trail'],
  ['PLT-011', 'Water', 'Syngonium Gold Allusion', 'leaf'],
  ['PLT-012', 'Water', 'Anthurium Scandens', 'leaf'],
  ['PLT-013', 'Water', 'Peace Lily (petite)', 'leaf'],
  ['PLT-014', 'Water', 'Frosty Fern', 'fern'],
  ['PLT-015', 'Water', 'Java Fern', 'fern'],
  ['PLT-016', 'Air',   'Philodendron Brasil', 'trail'],
  ['PLT-017', 'Air',   'Philodendron Birkin', 'leaf'],
  ['PLT-018', 'Air',   'Monstera Deliciosa (small form)', 'leaf'],
  ['PLT-019', 'Air',   'Rhaphidophora Tetrasperma', 'leaf'],
  ['PLT-020', 'Air',   'Alocasia Zebrina', 'leaf'],
  ['PLT-021', 'Aero',  'Tillandsia Xerographica', 'air'],
  ['PLT-022', 'Aero',  'Tillandsia Ionantha', 'air'],
  ['PLT-023', 'Aero',  'Tillandsia Bulbosa', 'air'],
  ['PLT-024', 'Aero',  'Scindapsus Pictus Exotica', 'trail'],
  ['PLT-025', 'Aero',  'String of Hearts', 'trail'],
  ['PLT-026', 'Frost', 'Umbrella Plant', 'leaf'],
  ['PLT-027', 'Frost', 'Strawberry Begonia', 'rosette'],
  ['PLT-028', 'Frost', "Fatsia 'Spider's Web'", 'leaf'],
  ['PLT-029', 'Frost', "Bird's Nest Fern", 'fern'],
  ['PLT-030', 'Frost', 'Variegated English Ivy', 'trail'],
  ['PLT-031', 'Bite',  'Venus Flytrap', 'trap'],
  ['PLT-032', 'Bite',  'Cape Sundew', 'trap'],
  ['PLT-033', 'Bite',  'Pitcher Plant (Nepenthes)', 'trap'],
  ['PLT-034', 'Bite',  'Butterwort', 'rosette'],
  ['PLT-035', 'Bite',  'North American Pitcher Plant', 'trap'],
  ['PLT-036', 'Moss',  'Pillow Moss', 'moss'],
  ['PLT-037', 'Moss',  'Java Moss', 'moss'],
  ['PLT-038', 'Moss',  'Sheet Moss', 'moss'],
  ['PLT-039', 'Moss',  'Phoenix Moss', 'moss'],
  ['PLT-040', 'Moss',  'Mood Moss', 'moss'],
  ['PLT-041', 'Dark',  'Syngonium Dark Maria', 'leaf'],
  ['PLT-042', 'Dark',  'Philodendron Micans', 'trail'],
  ['PLT-043', 'Dark',  'Anthurium Crystallinum', 'leaf'],
  ['PLT-044', 'Dark',  'Alocasia Black Velvet', 'leaf'],
  ['PLT-045', 'Dark',  'Jewel Orchid', 'leaf']
].map(([id, element, name, form]) => ({ id, element, name, form }));

// Only SOIL-001 is filled in the workbook (tab 07). "Studio's choice" is the
// honest default until the other mixes exist. `suits` = plant groups.
export const substrates = [
  {
    id: 'studio',
    name: 'Studio’s choice',
    note: 'We layer the base to suit your chamber’s climate and plants.',
    look: 'studio'
  },
  {
    id: 'SOIL-001',
    name: 'Aroid Atelier Mix',
    note: '40% orchid bark · 25% coco coir · 20% perlite · 10% charcoal · 5% worm castings',
    suits: ['Earth', 'Air', 'Dark'],
    look: 'aroid'
  }
];

// Starter recipes · every item is a real entry above.
export const recipes = [
  { id: 'misty-forest', name: 'Misty Forest', line: 'A moss floor under constant mist.',
    chamber: 'MossBox', substrate: 'studio', plants: ['PLT-036', 'PLT-037', 'PLT-040'] },
  { id: 'zen-minimal',  name: 'Zen Minimal',  line: 'Two desert forms, a lot of quiet.',
    chamber: 'FireBox', substrate: 'studio', plants: ['PLT-008', 'PLT-009'] },
  { id: 'tiny-jungle',  name: 'Tiny Jungle',  line: 'Velvet leaves in low light.',
    chamber: 'DarkBox', substrate: 'SOIL-001', plants: ['PLT-042', 'PLT-043', 'PLT-045'] }
];

// "Your space" · questions from the workbook's Custom Order Form (tab 06, A + C).
export const spaceQuestions = {
  room:      ['Living room', 'Study', 'Foyer', 'Bedroom', 'Office', 'Gallery', 'Other'],
  household: ['Pets', 'Young children', 'Neither'],
  maturity:  ['Established — full piece on day one', 'Growing — we plant young, you watch it fill in']
};
