// ─────────────────────────────────────────────────────────────────────
// data/volume-one.js · Volume I — 3D Printed Plant Accessories + Plants
//
// 32 products across 5 categories:
//   Planters · Plant Support · Accessories · Mounts · Plant Packets
//
// 3D products: material-based pricing (PETG/ABS/ASA)
// Plant Packets: live plants, priced individually
// ─────────────────────────────────────────────────────────────────────

export const categories = [
  { slug: 'planters',      title: 'Planters',       description: '3D-printed vessels in matte, bisque, and metallic finishes.' },
  { slug: 'plant-support', title: 'Plant Support',  description: 'Moss poles, trellises, and protective growth systems.' },
  { slug: 'accessories',   title: 'Accessories',    description: 'Care tags, watering tools, and companion planters.' },
  { slug: 'mounts',        title: 'Mounts',         description: 'Railing clips and hanging systems for urban spaces.' },
  { slug: 'plant-packets', title: 'Plant Packets',  description: 'Live plants and cuttings to start or expand your collection.' }
];

export const materials = [
  { id: 'petg', name: 'PETG', description: 'Standard indoor, glossy finish' },
  { id: 'abs',  name: 'ABS',  description: 'High strength, matte, heat resistant' },
  { id: 'asa',  name: 'ASA',  description: 'Outdoor pro, UV resistant, weatherproof' }
];

export const volumeOne = [
  // ═══════════════════════════════════════════════════════════════════
  // PLANTERS
  // ═══════════════════════════════════════════════════════════════════
  {
    sku: 'V1-PLT-001',
    name: 'TerraMesh Planter',
    category: 'planters',
    description: 'A bold interplay of structure and softness, the TerraMesh Planter features a textured lattice shell paired with a grounded, minimal base. Designed to elevate everyday plants into sculptural centerpieces, it balances visual depth with a clean, modern silhouette. Perfect as a statement duo or standalone accent.',
    photo: 'terramesh-planter.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PLT-002',
    name: 'Pillow Planter',
    category: 'planters',
    description: 'Inspired by the softness of quilted textures, the Pillow Planter brings a tactile, cushioned aesthetic into modern interiors. Its geometric padding effect adds depth while maintaining a clean, minimal form—designed to make greenery feel warmer and more inviting.',
    photo: 'pillow-planter.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PLT-003',
    name: 'Paper Planter',
    category: 'planters',
    description: 'A sculptural planter defined by sharp, faceted surfaces that catch light and shadow throughout the day. FacetForm turns greenery into a bold visual centerpiece, blending geometric precision with an organic presence. Designed to stand out—whether styled solo or as a pair.',
    photo: 'paper-planter.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PLT-004',
    name: 'Column Planter',
    category: 'planters',
    description: 'A modular vertical planting system designed to maximize space while creating dense, layered greenery. Each unit stacks seamlessly and rotates into multiple positions, allowing you to shape how plants grow and flow. Built for balconies and compact spaces, it transforms small areas into lush, living installations.',
    photo: 'column-planter.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PLT-005',
    name: 'Stackable Planter',
    category: 'planters',
    description: 'A modular planter system designed for compact living spaces, allowing plants to grow vertically through stackable interconnected units. Each module expands the system both upward and sideways, creating flexible configurations for herbs, vegetables, and indoor greenery while maximizing unused space. Clean, scalable, and built to evolve with your space.',
    photo: 'stackable-planter.png',
    variants: [
      { id: 'big',   name: 'Big Block',   description: 'Single block with drainage hole' },
      { id: 'small-block', name: 'Small Block', description: 'Single block with cavity' },
      { id: 'small-circle', name: 'Small Circle', description: 'Single circle with cavity' }
    ],
    pricing: {
      big:   { petg: 1399, abs: 1499, asa: 1799 },
      'small-block':  { petg: 699,  abs: 799,  asa: 1099 },
      'small-circle': { petg: 399,  abs: 499,  asa: 799 }
    },
    status: 'available'
  },
  {
    sku: 'V1-PLT-006',
    name: 'Capsule Planter',
    category: 'planters',
    description: 'A minimalist hanging planter designed as a compact floating capsule for small indoor plants and trailing greens. Its clean suspended form blends into modern interiors while creating a lightweight, sculptural presence that turns unused vertical space into living decor. Soft geometry, simple suspension, effortless greenery.',
    photo: 'capsule-planter.png',
    pricing: { petg: 429, abs: 529, asa: 629 },
    status: 'available'
  },
  {
    sku: 'V1-PLT-007',
    name: 'Glass Garden',
    category: 'planters',
    description: 'A self-contained glass garden designed to bring a living ecosystem into compact spaces. Layered planting structures support moss and small plants within a controlled environment, creating a slow-growing, low-maintenance display. Designed as a desk or shelf piece, it combines nature with form—quiet, contained, and constantly evolving.',
    photo: 'glass-garden.png',
    pricing: { petg: 2899, abs: 3500, asa: 4000 },
    status: 'available'
  },

  // ═══════════════════════════════════════════════════════════════════
  // PLANT SUPPORT
  // ═══════════════════════════════════════════════════════════════════
  {
    sku: 'V1-SUP-001',
    name: 'Vine Arc',
    category: 'plant-support',
    description: 'A vertical support frame designed to guide climbing plants as they grow. Its clean, structured form helps shape natural movement while doubling as a subtle wall accent. Ideal for monstera, pothos, and other climbers—turning growth into a composed, living display.',
    photo: 'vine-arc.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-SUP-002',
    name: 'KAVACH',
    category: 'plant-support',
    description: 'A protective growth tower designed to support and shield your plants as they thrive. The structured mesh enclosure guides vertical growth while protecting against pests, pets, and external damage—creating a controlled micro-environment for healthier plants. Ideal for balconies and compact outdoor spaces.',
    photo: 'kavach.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-SUP-003',
    name: 'Modular Moss Pole',
    category: 'plant-support',
    description: 'A modular growth pole designed to support climbing plants as they mature. Interlocking extension sections allow the pole to scale with plant growth, while the open lattice structure helps roots grip naturally around moss or growing medium. Built for monstera, philodendron, pothos, and other climbing species.',
    photo: 'modular-moss-pole.png',
    pricing: { petg: 999, abs: 1199, asa: 1799 },
    status: 'available'
  },
  {
    sku: 'V1-SUP-004',
    name: 'Moss Pole Dripper',
    category: 'plant-support',
    description: 'A slow-release water reservoir designed for modular moss poles. The Drip Cap attaches directly to the top of the pole, gradually releasing water to keep moss evenly hydrated over time. Helps maintain consistent moisture levels for healthier aerial roots and stronger climbing growth.',
    photo: 'moss-pole-dripper.png',
    pricing: { petg: 499, abs: 599, asa: 799 },
    status: 'available'
  },

  // ═══════════════════════════════════════════════════════════════════
  // ACCESSORIES
  // ═══════════════════════════════════════════════════════════════════
  {
    sku: 'V1-ACC-001',
    name: 'Plant Care Tags',
    category: 'accessories',
    description: 'Minimal plant care markers designed to visually indicate sunlight and watering needs. Each tag uses simple shapes and fill levels to help identify care requirements at a glance—making plant care easier for beginners and collectors alike. Designed to blend naturally into modern plant setups.',
    photo: 'plant-care-tags.png',
    unit: '30 pieces',
    pricing: { petg: 149, abs: 199, asa: 299 },
    status: 'available'
  },
  {
    sku: 'V1-ACC-002',
    name: 'Watering Ring',
    category: 'accessories',
    description: 'A slow-release watering ring designed to evenly hydrate larger indoor plants directly at the root zone. The circular system distributes water gradually around the base of the trunk, reducing runoff, dry spots, and overwatering while making plant care cleaner and more efficient. Simple watering, better absorption, healthier roots.',
    photo: 'watering-ring.png',
    pricing: { petg: 129, abs: 149, asa: 199 },
    status: 'available'
  },
  {
    sku: 'V1-ACC-003',
    name: 'Root Link Companion',
    category: 'accessories',
    description: 'A smart companion planter that shares water with your main pot. RootLink anchors into the soil and features a hollow base that allows excess water to flow directly into the larger planter—reducing waste while keeping both plants hydrated. Designed for layered planting with built-in water flow.',
    photo: 'root-link-companion.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-ACC-004',
    name: 'Hydroponic Planter',
    category: 'accessories',
    description: 'A self-contained indoor growing system designed to bring fresh, thriving plants into compact spaces. Nura combines structured planting modules with integrated lighting and a recirculating irrigation system—creating a controlled environment for consistent, healthy growth. Designed for modern homes, it turns everyday spaces into living, productive gardens.',
    photo: 'hydroponic-planter.png',
    pricing: null,
    status: 'coming-soon'
  },

  // ═══════════════════════════════════════════════════════════════════
  // MOUNTS
  // ═══════════════════════════════════════════════════════════════════
  {
    sku: 'V1-MNT-001',
    name: 'Hanging Garden Pot Mount',
    category: 'mounts',
    description: 'A clip-on railing planter system designed for balconies, window grills, and compact outdoor spaces. The detachable ring mount allows pots to securely hook onto railings without permanent installation, turning unused edges into functional growing space for herbs, flowers, and small plants. Flexible, space-saving, and made for urban gardening.',
    photo: 'hanging-garden-pot-mount.png',
    variants: [
      { id: 'small', name: 'Small', description: 'For smaller pots' },
      { id: 'large', name: 'Large', description: 'For larger pots' }
    ],
    pricing: {
      small: { petg: 159, abs: 189, asa: 269 },
      large: { petg: 169, abs: 199, asa: 249 }
    },
    status: 'available'
  },
  {
    sku: 'V1-ACC-005',
    name: 'Bird Feeder',
    category: 'accessories',
    description: 'A minimalist bird feeder designed to attract small birds to your garden or balcony. Simple, functional design that blends into modern outdoor spaces while providing a reliable feeding station for local wildlife.',
    photo: 'bird-feeder.png',
    pricing: { petg: 399, abs: 499, asa: 599 },
    status: 'available'
  },

  // ═══════════════════════════════════════════════════════════════════
  // PLANT PACKETS — Live plants and cuttings
  // ═══════════════════════════════════════════════════════════════════
  {
    sku: 'V1-PP-001',
    name: 'Tradescantia',
    category: 'plant-packets',
    description: 'A trailing plant with stunning purple and green striped leaves. Fast-growing, easy to propagate, and perfect for hanging baskets or shelves where it can cascade freely.',
    photo: 'tradescantia.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PP-002',
    name: 'Pothos Marble',
    category: 'plant-packets',
    description: 'Classic pothos with elegant white and green marbled leaves. One of the easiest houseplants to grow—thrives in low light and tolerates irregular watering.',
    photo: 'pothos-marble.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PP-003',
    name: 'Pothos Satin',
    category: 'plant-packets',
    description: 'Silvery-green leaves with a satin sheen that catches the light. More compact than other pothos varieties, making it ideal for smaller spaces.',
    photo: 'pothos-satin.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PP-004',
    name: 'Mini Monstera',
    category: 'plant-packets',
    description: 'Compact fenestrated leaves resembling the iconic Monstera deliciosa. A climbing aroid that grows quickly and adds tropical texture to any space.',
    photo: 'mini-monstera.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PP-005',
    name: 'Monstera Adansonii',
    category: 'plant-packets',
    description: 'The Swiss Cheese Vine—distinctive holes in each leaf create a playful, tropical aesthetic. A vigorous climber that pairs beautifully with moss poles.',
    photo: 'monstera-adansonii.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PP-006',
    name: 'Syngonium White',
    category: 'plant-packets',
    description: 'Arrow-shaped leaves in soft white and green. Compact when young, but can climb or trail as it matures. Adaptable to various light conditions.',
    photo: 'syngonium-white.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PP-007',
    name: 'Syngonium Bronze',
    category: 'plant-packets',
    description: 'Deep bronze-green foliage that adds warmth to plant collections. New leaves emerge with a copper tint before maturing to rich green.',
    photo: 'syngonium-bronze.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PP-008',
    name: 'Syngonium Confetti',
    category: 'plant-packets',
    description: 'Speckled pink and green leaves that look like confetti frozen in time. Each leaf is unique—a collector favorite.',
    photo: 'syngonium-confetti.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PP-009',
    name: 'Syngonium Mottled',
    category: 'plant-packets',
    description: 'Striking mottled pattern across arrow-shaped leaves. Bold variegation that stands out in any arrangement.',
    photo: 'syngonium-mottled.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PP-010',
    name: 'Syngonium Pinkline',
    category: 'plant-packets',
    description: 'Delicate pink veins running through green leaves create an elegant, understated look. Low-maintenance and compact.',
    photo: 'syngonium-pinkline.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PP-011',
    name: 'Syngonium Strawberry Ice',
    category: 'plant-packets',
    description: 'Soft pink and cream variegation reminiscent of strawberry ice cream. A rare variety that brightens any collection.',
    photo: 'syngonium-strawberry-ice.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PP-012',
    name: 'Syngonium Dark Maria',
    category: 'plant-packets',
    description: 'Deep, moody green leaves with subtle silver markings. Adds depth and drama to plant shelves and terrariums.',
    photo: 'syngonium-dark-maria.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PP-013',
    name: 'Philodendron Xanadu',
    category: 'plant-packets',
    description: 'Dense, deeply lobed leaves create a sculptural mound of green. A self-heading philodendron that stays compact and bushy.',
    photo: 'philo-xanadu.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PP-014',
    name: 'Philodendron Florida Ghost',
    category: 'plant-packets',
    description: 'New leaves emerge white or pale green before maturing to deeper tones. A stunning, sought-after variety for collectors.',
    photo: 'philo-florida-ghost.png',
    pricing: null,
    status: 'coming-soon'
  },
  {
    sku: 'V1-PP-015',
    name: 'Alocasia',
    category: 'plant-packets',
    description: 'Bold, dramatic leaves with striking veins and architectural presence. A statement plant that commands attention in any room.',
    photo: 'alocasia.png',
    pricing: null,
    status: 'coming-soon'
  }
];

export const enquiryWhatsApp = '918104811584';
