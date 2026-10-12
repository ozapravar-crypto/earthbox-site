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
export const chamberElements = {
  WaterBox: ['Water'], MossBox: ['Moss'], FireBox: ['Fire'], DarkBox: ['Dark'],
  AeroBox: ['Aero'], AirBox: ['Air'], FrostBox: ['Frost'], BiteBox: ['Bite'],
  LabBox: 'all', SporeBox: []
};

// Soil-free chambers (their own specs: "soil-free growth", "eliminates soil").
export const SOILLESS = ['AirBox', 'AeroBox'];

// `form` only picks the line-drawing used in the preview. It is not a care claim.
/**
 * Plant row: [id, group, name, shape, botanical] → { id, element, name, form, botanical }.
 * id 'PLT-nnn' unique · element ∈ elements[].id · form ∈ keys of forms.
 * Optional later: price (whole rupees), light, care, humidity, photo — see the note below.
 * Checked by scripts/data.test.mjs.
 */
export const plants = [
  ['PLT-001', 'Earth', 'Syngonium Neon Pink', 'leaf', "Syngonium podophyllum 'Neon'"],
  ['PLT-002', 'Earth', 'Syngonium Albo Variegata', 'leaf', "Syngonium podophyllum 'Albo Variegatum'"],
  ['PLT-003', 'Earth', 'Philodendron Pink Princess', 'leaf', "Philodendron erubescens 'Pink Princess'"],
  ['PLT-004', 'Earth', 'Pothos Marble Queen', 'trail', "Epipremnum aureum 'Marble Queen'"],
  ['PLT-005', 'Earth', 'Tradescantia Nanouk', 'trail', "Tradescantia albiflora 'Nanouk'"],
  ['PLT-006', 'Fire',  'Jewel Alocasia', 'leaf', "Alocasia cuprea"],
  ['PLT-007', 'Fire',  'Tradescantia Pink Fury', 'trail', "Tradescantia 'Pink Fury'"],
  ['PLT-008', 'Fire',  "Echeveria 'Perle von Nürnberg'", 'rosette', "Echeveria 'Perle von Nürnberg'"],
  ['PLT-009', 'Fire',  'Haworthia Fasciata', 'rosette', "Haworthiopsis fasciata"],
  ['PLT-010', 'Fire',  "Burro's Tail", 'trail', "Sedum morganianum"],
  ['PLT-011', 'Water', 'Syngonium Gold Allusion', 'leaf', "Syngonium podophyllum 'Gold Allusion'"],
  ['PLT-012', 'Water', 'Anthurium Scandens', 'leaf', "Anthurium scandens"],
  ['PLT-013', 'Water', 'Peace Lily (petite)', 'leaf', "Spathiphyllum wallisii (compact)"],
  ['PLT-014', 'Water', 'Frosty Fern', 'fern', "Selaginella kraussiana 'Variegata'"],
  ['PLT-015', 'Water', 'Java Fern', 'fern', "Microsorum pteropus"],
  ['PLT-016', 'Air',   'Philodendron Brasil', 'trail', "Philodendron hederaceum 'Brasil'"],
  ['PLT-017', 'Air',   'Philodendron Birkin', 'leaf', "Philodendron 'Birkin'"],
  ['PLT-018', 'Air',   'Monstera Deliciosa (small form)', 'leaf', "Monstera deliciosa (compact)"],
  ['PLT-019', 'Air',   'Rhaphidophora Tetrasperma', 'leaf', "Rhaphidophora tetrasperma"],
  ['PLT-020', 'Air',   'Alocasia Zebrina', 'leaf', "Alocasia zebrina"],
  ['PLT-021', 'Aero',  'Tillandsia Xerographica', 'air', "Tillandsia xerographica"],
  ['PLT-022', 'Aero',  'Tillandsia Ionantha', 'air', "Tillandsia ionantha"],
  ['PLT-023', 'Aero',  'Tillandsia Bulbosa', 'air', "Tillandsia bulbosa"],
  ['PLT-024', 'Aero',  'Scindapsus Pictus Exotica', 'trail', "Scindapsus pictus 'Exotica'"],
  ['PLT-025', 'Aero',  'String of Hearts', 'trail', "Ceropegia woodii"],
  ['PLT-026', 'Frost', 'Umbrella Plant', 'leaf', "Darmera peltata"],
  ['PLT-027', 'Frost', 'Strawberry Begonia', 'rosette', "Saxifraga stolonifera"],
  ['PLT-028', 'Frost', "Fatsia 'Spider's Web'", 'leaf', "Fatsia japonica 'Spider's Web'"],
  ['PLT-029', 'Frost', "Bird's Nest Fern", 'fern', "Asplenium nidus"],
  ['PLT-030', 'Frost', 'Variegated English Ivy', 'trail', "Hedera helix variegata"],
  ['PLT-031', 'Bite',  'Venus Flytrap', 'trap', "Dionaea muscipula"],
  ['PLT-032', 'Bite',  'Cape Sundew', 'trap', "Drosera capensis"],
  ['PLT-033', 'Bite',  'Pitcher Plant (Nepenthes)', 'trap', "Nepenthes alata"],
  ['PLT-034', 'Bite',  'Butterwort', 'rosette', "Pinguicula spp."],
  ['PLT-035', 'Bite',  'North American Pitcher Plant', 'trap', "Sarracenia spp."],
  ['PLT-036', 'Moss',  'Pillow Moss', 'moss', "Leucobryum glaucum"],
  ['PLT-037', 'Moss',  'Java Moss', 'moss', "Taxiphyllum barbieri"],
  ['PLT-038', 'Moss',  'Sheet Moss', 'moss', "Hypnum cupressiforme"],
  ['PLT-039', 'Moss',  'Phoenix Moss', 'moss', "Fissidens fontanus"],
  ['PLT-040', 'Moss',  'Mood Moss', 'moss', "Dicranum scoparium"],
  ['PLT-041', 'Dark',  'Syngonium Dark Maria', 'leaf', "Syngonium 'Dark Maria'"],
  ['PLT-042', 'Dark',  'Philodendron Micans', 'trail', "Philodendron hederaceum 'Micans'"],
  ['PLT-043', 'Dark',  'Anthurium Crystallinum', 'leaf', "Anthurium crystallinum"],
  ['PLT-044', 'Dark',  'Alocasia Black Velvet', 'leaf', "Alocasia reginula 'Black Velvet'"],
  ['PLT-045', 'Dark',  'Jewel Orchid', 'leaf', "Ludisia discolor"]
].map(([id, element, name, form, botanical]) => ({ id, element, name, form, botanical }));

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

// ── Discovery (search, map, guided search) ─────────────────────────────
// The workbook's per-plant Light, Care, Humidity, Price and Photo columns are
// all empty (tab 04, 0 of 45). So discovery filters on what IS known: the
// plant group, its chamber's climate and its shape. When a column is filled,
// add the field to the plant row above and a filter in scripts/plant-search.js.
// Schema extension, one per plant:  light: 'low'|'indirect'|'bright',
// care: 'easy'|'moderate'|'high', humidity: '60–80 %', price: 1200, photo: 'x.webp'.

// Shape labels for `form` (assigned per species from its growth habit).
export const forms = {
  leaf: 'Broad leaf', trail: 'Trailing', rosette: 'Rosette', air: 'Air plant',
  fern: 'Fern', moss: 'Moss carpet', trap: 'Pitcher / trap'
};

// 3D plant models for the Maker's preview (scripts/maker-3d.js). Presentation
// only, like `form`: indicative shapes, not photos of our stock.
// Files live in assets/plants3d/ (sources + licences: assets/plants3d/CREDITS.md).
// A plant uses `plants[id]` if it has an entry, else `forms[form]`; `null` or
// no entry = the procedural low-poly plant. Options per model:
//   scale  multiplies the fitted size (1 = fill the chamber like the others)
//   yaw    extra turn in radians, to show the model's best side
//   tint   false keeps the model's own colours (default: foliage takes the
//          plant group's colour + any colour its name states, like the procedural plants)
// Changing a model's look? Give the file a new name: /assets is cached for a year.
/**
 * @typedef {{ file: string, scale?: number, yaw?: number, tint?: boolean }} PlantModel
 * @type {{ base: string, forms: Record<string, PlantModel|null>, plants: Record<string, PlantModel|null> }}
 */
export const models = {
  base: 'assets/plants3d/',
  forms: {
    // `textured: true` = a realistic scan that keeps its own texture (Poly Haven,
    // 12 Oct 2026); the Maker tints it gently toward the plant's colour.
    leaf:    { file: 'leaf-syngonium.glb', textured: true },   // heart/arrow leaves: Syngonium, Philodendron, Alocasia…
    // Sketchfab CC BY models (12 Oct 2026), credited on maker.html.
    trail:   { file: 'trail-pothos-real.glb', textured: true },
    rosette: { file: 'rosette-echeveria-purple.glb', textured: true, tint: false, scale: .3 },   // Echeveria 'Perle' is purple
    air:     { file: 'air-tillandsia.glb', textured: true },
    fern:    { file: 'fern-male.glb', textured: true },
    moss:    { file: 'moss-cushion.glb' },            // stylised still beats every moss scan found
    trap:    null                                     // each trap plant has its own model below
  },
  plants: {
    'PLT-018': { file: 'leaf-monstera-real.glb', textured: true },   // Monstera
    'PLT-019': { file: 'leaf-monstera-real.glb', textured: true, scale: .9 },   // Rhaphidophora (split leaves)
    'PLT-004': { file: 'trail-pothos-marble.glb', textured: true, tint: false },   // Pothos Marble Queen (variegated)
    'PLT-005': { file: 'trail-pothos.glb' },          // Tradescantia Nanouk: colour is the point, stylised
    'PLT-007': { file: 'trail-pothos.glb' },          // Tradescantia Pink Fury: same
    'PLT-032': { file: 'trap-sundew.glb', textured: true, tint: false },       // Cape Sundew
    'PLT-033': { file: 'trap-nepenthes.glb', textured: true, tint: false },    // Pitcher Plant (Nepenthes)
    'PLT-035': { file: 'trap-sarracenia.glb', textured: true, tint: false },   // North American Pitcher Plant
    'PLT-026': { file: 'leaf-monstera.glb' },         // Umbrella Plant
    'PLT-028': { file: 'leaf-monstera.glb' },         // Fatsia 'Spider's Web'
    'PLT-009': { file: 'rosette-haworthia.glb', textured: true },   // Haworthia (scan)
    'PLT-012': { file: 'leaf-anthurium.glb', textured: true },      // Anthurium Scandens
    'PLT-043': { file: 'leaf-anthurium.glb', textured: true },      // Anthurium Crystallinum
    'PLT-013': { file: 'leaf-anthurium.glb', textured: true, scale: .9 },   // Peace Lily: same family, closest shape
    // Colour is the point of these, and a scan's green texture can't be tinted
    // pink or near-black, so they keep the stylised (exactly coloured) model.
    'PLT-001': { file: 'leaf-heart.glb' },            // Syngonium Neon Pink
    'PLT-003': { file: 'leaf-heart.glb' },            // Philodendron Pink Princess
    'PLT-041': { file: 'leaf-heart.glb' },            // Syngonium Dark Maria
    'PLT-044': { file: 'leaf-heart.glb' },            // Alocasia Black Velvet
    'PLT-045': { file: 'leaf-heart.glb' },            // Jewel Orchid
    'PLT-027': { file: 'rosette-flat.glb' },          // Strawberry Begonia
    'PLT-034': { file: 'rosette-flat.glb' },          // Butterwort
    'PLT-031': { file: 'trap-flytrap-real.glb', textured: true, tint: false },   // Venus Flytrap, original textures
    'PLT-015': { file: 'fern-strap.glb', textured: true },          // Java Fern (strap leaves, scan)
    'PLT-029': { file: 'fern-strap.glb', textured: true, scale: 1.1 }   // Bird's Nest Fern
  }
};

// Guided search answers → the real fields they act on.
// looks: studio mapping from each group's heading + the Maker recipes
// (Misty Forest = Moss, Zen Minimal = Fire, Tiny Jungle = Dark). To confirm with Aayush.
export const guide = {
  looks: [
    { id: 'woodland',  label: 'Woodland',  line: 'Lush, layered, forest-like',          groups: ['Moss', 'Frost', 'Water'] },
    { id: 'minimal',   label: 'Minimal',   line: 'Clean, sculptural, understated',      groups: ['Fire', 'Aero'] },
    { id: 'tropical',  label: 'Tropical',  line: 'Abundant, vibrant, leafy',            groups: ['Earth', 'Air', 'Dark'] },
    { id: 'colourful', label: 'Colourful', line: 'Patterned leaves, contrasting colour', groups: ['Earth', 'Dark'] }
  ],
  // Every chamber has its own grow light, so room light only nudges the order.
  light: [
    { id: 'low',      label: 'Low light',              prefers: ['Dark'] },
    { id: 'indirect', label: 'Bright, indirect light', prefers: [] },
    { id: 'bright',   label: 'Bright light',           prefers: ['Fire'] },
    { id: 'unsure',   label: 'I’m not sure',           prefers: [] }
  ],
  // No plant has a care rating yet: the answer goes to the studio with the enquiry.
  care: [
    { id: 'Easy',     label: 'Easy care',     line: 'Something forgiving' },
    { id: 'Moderate', label: 'Moderate care', line: 'A little regular attention is fine' },
    { id: 'High',     label: 'High care',     line: 'Happy to tend it often' }
  ],
  roles: [
    { id: 'foliage', label: 'Lush foliage',       forms: ['leaf', 'fern'] },
    { id: 'ground',  label: 'Ground cover',       forms: ['moss'] },
    { id: 'trail',   label: 'Trailing stems',     forms: ['trail'] },
    { id: 'sculpt',  label: 'A sculptural accent', forms: ['rosette', 'air', 'trap'] }
  ]
};
