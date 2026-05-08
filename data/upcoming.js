// ─────────────────────────────────────────────────────────────────────
// data/upcoming.js · Volumes II + III — Coming soon
// 10 boxes with rich content + photos (RuinBox removed per Aayush).
// Each box has: sku, name, tagline, description (multi-paragraph),
// specs, illustration (SVG line drawing) + photo (real product render).
// Bite has photo only (no illustration provided).
// ─────────────────────────────────────────────────────────────────────

export const volumeTwo = {
  title:       'Elemental Boxes',
  subtitle:    'Climate-controlled vitrines',
  description: 'Ten chambers. Each tuned to a specific atmosphere — the same architecture, ten dialects.',
  status:      'Coming soon',

  boxes: [
    {
      sku: 'WaterBox', name: 'Water',
      tagline: 'Flow. Reflection. Clarity.',
      description: [
        'A sculpted micro-ecosystem that captures the quiet power of moving water. The Water Box features a precision-engineered sheet flow that cascades over a minimal ledge into a still, reflective pool below — creating a continuous loop of motion and calm.',
        'Encased in a sharp, modern matte-black frame, the design balances natural elements with architectural form. Subtle aquatic life, textured stone, and controlled lighting come together to produce depth, contrast, and atmosphere in a compact footprint.',
        'Built as part of the EarthBox system, it transforms water from a background element into a visual experience — measured, intentional, and alive.'
      ],
      illustration: 'water.svg', photo: 'water-main.jpg',
      size: '320 × 240 × 240 mm', weight: '4.5 kg',
      temp: '20 – 30 °C', humidity: '70 – 100 %',
      light: 'Aquatic LED · timer', power: '12 V',
      capacity: '5 – 8 plants', plants: 'Aquatic plants',
      edition: 'Standard', price: '₹8,000 – ₹12,000',
      lead: '7 – 10 days', warranty: '1 year'
    },
    {
      sku: 'MossBox', name: 'Moss',
      tagline: 'A living object where nature quietly reclaims form.',
      description: [
        'Moss Box is a living object where nature quietly reclaims form. Wrapped in a lush, three-sided moss skin, it uses a closed-loop water system to maintain a perfectly balanced, self-sustaining environment. A subtle drip ledge captures and recirculates moisture, keeping the exterior alive while preserving a clean, minimal silhouette.',
        'Inside, a raised micro-landscape sits in contrast — calm, composed, and intentionally sculpted. The result is a contained ecosystem that feels both engineered and organic, constantly evolving yet visually controlled.',
        'Moss Box isn\'t just a planter — it\'s a slow, living transformation.'
      ],
      illustration: 'moss.svg', photo: 'moss-main.jpg',
      size: '300 × 220 × 220 mm', weight: '3.8 kg',
      temp: '18 – 28 °C', humidity: '80 – 100 %',
      light: 'Diffused LED', power: '12 V',
      capacity: 'Dense coverage', plants: 'Moss, ferns',
      edition: 'Standard', price: '₹6,000 – ₹9,000',
      lead: '6 – 8 days', warranty: '1 year'
    },
    {
      sku: 'FireBox', name: 'Fire',
      tagline: 'Split monolith. A landscape shaped by survival.',
      description: [
        'A bold departure from traditional planters, FireBox is a self-sustaining micro-ecosystem concealed within a fractured monolith. Its hardened exterior splits open to reveal a controlled desert habitat — where heat, light, and water are precisely regulated to support resilient plant life.',
        'Designed as both an object and an environment, FireBox uses embedded climate control, micro-irrigation, and subtle illumination to recreate conditions where only the toughest forms of life endure. What appears raw and volatile on the outside is, in reality, a carefully engineered system within.',
        'FireBox isn\'t just a planter — it\'s a contained landscape shaped by survival.'
      ],
      illustration: 'fire.svg', photo: 'fire-main.jpg',
      size: '280 × 220 × 220 mm', weight: '2.8 kg',
      temp: '22 – 40 °C', humidity: '20 – 50 %',
      light: 'Strong warm LED', power: 'USB-C',
      capacity: '3 – 6 plants', plants: 'Succulents, cacti',
      edition: 'Standard', price: '₹4,000 – ₹6,000',
      lead: '5 – 7 days', warranty: '6 months'
    },
    {
      sku: 'DarkBox', name: 'Dark',
      tagline: 'Subtle by day. Luminous by design.',
      description: [
        'DarkBox is a controlled micro-ecosystem designed to showcase plants that come alive under ultraviolet light. Built with a balanced system of humidity, airflow, and hidden grow lighting, it supports low-light plant species while enhancing their natural textures under UV exposure.',
        'In normal conditions, DarkBox appears calm and minimal. When activated, ultraviolet lighting reveals a completely different environment — highlighting veins, surfaces, and details that remain invisible in regular light.',
        'DarkBox is designed as a dual-state living system — subtle by day, luminous by design.'
      ],
      illustration: 'dark.svg', photo: 'dark-main.jpg',
      size: '280 × 220 × 220 mm', weight: '3 kg',
      temp: '18 – 30 °C', humidity: '60 – 80 %',
      light: 'Low-intensity LED · UV mode', power: 'USB-C',
      capacity: '3 – 5 plants', plants: 'ZZ, ferns',
      edition: 'Standard', price: '₹5,000 – ₹7,000',
      lead: '5 – 7 days', warranty: '6 months'
    },
    {
      sku: 'SporeBox', name: 'Spore',
      tagline: 'Bio-Lab Capsule. A window into the hidden world.',
      description: [
        'A living system designed to grow, evolve, and transform over time. SporeBox creates a controlled environment where mycelium spreads, mushrooms emerge, and nature reveals its quiet intelligence. Encased in a sleek, lab-inspired form, it blends precision engineering with organic growth — turning every cycle into a visual experience.',
        'More than a planter, SporeBox is a window into the hidden world beneath the surface — where life builds, breaks down, and begins again.'
      ],
      illustration: 'spore.svg', photo: 'spore-main.jpg',
      size: '260 × 220 × 220 mm', weight: '3.2 kg',
      temp: '18 – 26 °C', humidity: '80 – 95 %',
      light: 'Minimal LED', power: '12 V',
      capacity: 'Batch growth', plants: 'Mushrooms',
      edition: 'Limited', price: '₹6,000 – ₹10,000',
      lead: '8 – 12 days', warranty: '6 months'
    },
    {
      sku: 'AeroBox', name: 'Aero',
      tagline: 'A living display of air itself.',
      description: [
        'AeroBox redefines indoor greenery by stripping nature down to its lightest form. Designed exclusively for air plants, it eliminates soil and clutter, allowing each plant to float freely within a structured, breathable frame.',
        'A controlled balance of airflow, light, and gentle misting creates the ideal micro-environment, while the open architecture ensures plants remain the visual focus. Minimal, precise, and quietly dynamic — AeroBox brings movement and life into space without ever feeling heavy.',
        'It\'s not just a planter. It\'s a living display of air itself.'
      ],
      illustration: 'aero.svg', photo: 'aero-main.jpg',
      size: '300 × 220 × 220 mm', weight: '3 kg',
      temp: '18 – 30 °C', humidity: '50 – 80 %',
      light: 'Neutral LED', power: '12 V',
      capacity: '2 – 4 plants', plants: 'Air plants',
      edition: 'Standard', price: '₹6,000 – ₹9,000',
      lead: '6 – 8 days', warranty: '1 year'
    },
    {
      sku: 'AirBox', name: 'Air',
      tagline: 'Pure, floating, alive.',
      description: [
        'A minimal, self-contained ecosystem where plants grow suspended in air, nourished by a fine, oxygen-rich mist. The AirBox reveals the hidden beauty of roots in motion, turning plant growth into a living visual experience.',
        'Designed with a transparent enclosure and a soft overhead light, it creates a calm, atmospheric presence while supporting healthy, soil-free growth. Quiet, efficient, and low-maintenance, AirBox brings nature into focus — pure, floating, and alive.'
      ],
      illustration: 'air.svg', photo: 'air-main.jpg',
      size: '300 × 220 × 220 mm', weight: '2.2 kg',
      temp: '18 – 32 °C', humidity: '40 – 70 %',
      light: 'Soft LED', power: 'USB-C',
      capacity: '3 – 5 plants', plants: 'Aeroponic plants',
      edition: 'Standard', price: '₹4,500 – ₹6,000',
      lead: '5 – 7 days', warranty: '6 months'
    },
    {
      sku: 'FrostBox', name: 'Frost',
      tagline: 'A living system that evolves with time.',
      description: [
        'FrostBox is a precision-controlled microclimate designed for plants that thrive in the cold. By combining active cooling, humidity regulation, and gentle airflow, it recreates a stable, low-temperature environment where seasonal plants can flourish beyond their natural limits.',
        'Encased in a minimal glass and matte-black frame, FrostBox transforms plant care into a visual experience — where condensation forms, droplets fall, and each plant becomes a living centerpiece.',
        'With its modular plant pod system, swapping plants takes seconds, making it easy to refresh your setup with curated seasonal selections delivered throughout the year. FrostBox isn\'t just a planter — it\'s a living system that evolves with time.'
      ],
      illustration: 'frost.svg', photo: 'frost-main.jpg',
      size: '320 × 240 × 240 mm', weight: '5 kg',
      temp: '10 – 22 °C', humidity: '50 – 80 %',
      light: 'Bright white LED', power: '12 V',
      capacity: '3 – 5 plants', plants: 'Alpine, orchids',
      edition: 'Limited', price: '₹12,000 – ₹18,000',
      lead: '12 – 15 days', warranty: '1 year'
    },
    {
      sku: 'LabBox', name: 'Lab',
      tagline: 'Modular Bio-Engine. Growth as exploration.',
      description: [
        'LabBox is the convergence point of the collection — bringing multiple growing environments into a single, open system. Built around a central spine with modular pods, it allows different plant conditions to exist side by side, turning growth into something you can observe, compare, and control.',
        'With exposed tubing, visible roots, and continuous circulation, the system reveals the inner workings of plant life instead of hiding them. Adjustable lighting and precise controls let you experiment in real time, shifting the experience from passive care to active exploration.',
        'LabBox isn\'t just a planter — it\'s a living system designed to be tested, understood, and evolved.'
      ],
      illustration: 'lab.svg', photo: 'lab-main.jpg',
      size: '320 × 260 × 260 mm', weight: '5.5 kg',
      temp: 'Adjustable', humidity: 'Adjustable',
      light: 'Tunable LED · app control', power: '12 V',
      capacity: 'Variable', plants: 'Any',
      edition: 'One-of-One', price: '₹15,000 – ₹25,000',
      lead: '14 – 21 days', warranty: '1 year'
    },
    {
      sku: 'BiteBox', name: 'Bite',
      tagline: 'A self-contained system for predatory plants.',
      description: [
        'BiteBox is a precision-designed micro-environment engineered specifically for carnivorous plants like the Venus flytrap. Unlike decorative terrariums, it creates a stable bog ecosystem through subsurface irrigation, controlled airflow, and high-intensity grow lighting — ensuring optimal conditions without constant intervention.',
        'A hidden water reservoir maintains consistent root moisture, while regulated ventilation prevents stagnation and supports plant health. The enclosed chamber balances humidity and temperature, allowing delicate predatory species to thrive in a clean, minimal form.',
        'BiteBox is not just a display — it is a self-contained system where environmental control and natural behavior coexist.'
      ],
      illustration: null,            // no SVG provided · photo only
      photo: 'bite-main.jpg',
      size: '280 × 220 × 220 mm', weight: '3.5 kg',
      temp: '20 – 30 °C', humidity: '60 – 90 %',
      light: 'High-intensity LED', power: '12 V',
      capacity: '2 – 4 plants', plants: 'Venus flytrap, Nepenthes',
      edition: 'Standard', price: '₹7,000 – ₹10,000',
      lead: '7 – 9 days', warranty: '1 year'
    }
  ]
};

export const volumeThree = {
  sku:         'VIV-III',
  title:       'Digital Vivariums',
  subtitle:    'Holographic inhabitation',
  description: 'Terrariums integrated with holographic representations. Species rendered with the fidelity of a specimen drawing — life inhabits the vessel without displacing life elsewhere.',
  status:      'Research phase',
  note:        'Write to be notified when the first chapter is ready.'
};
