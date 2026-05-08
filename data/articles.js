// ─────────────────────────────────────────────────────────────────────
// data/articles.js · Journal content with SEO/GEO optimization
// ─────────────────────────────────────────────────────────────────────

// Import long-form article bodies from category modules
import { terrariumCareArticles } from './article-bodies/terrarium-care.js';
import { printingArticles } from './article-bodies/3d-printing.js';
import { mumbaiPlantsArticles } from './article-bodies/mumbai-plants.js';
import { designNotesArticles } from './article-bodies/design-notes.js';
import { plantFundamentalsArticles } from './article-bodies/plant-fundamentals.js';

// Merge all article bodies into single lookup
const articleBodies = {
  ...terrariumCareArticles,
  ...printingArticles,
  ...mumbaiPlantsArticles,
  ...designNotesArticles,
  ...plantFundamentalsArticles
};

export const categories = [
  { slug: 'terrarium-care', title: 'Terrarium Care', description: 'Guides for closed ecosystem maintenance' },
  { slug: '3d-printing', title: '3D Printing', description: 'Technology meets horticulture' },
  { slug: 'mumbai-plants', title: 'Mumbai Plants', description: 'Local climate and species' },
  { slug: 'design-notes', title: 'Design Notes', description: 'Studio philosophy and process' },
  { slug: 'plant-fundamentals', title: 'Fundamentals', description: 'Core plant care knowledge' }
];

export const articles = [

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 1: TERRARIUM CARE (4 articles)
  // ═══════════════════════════════════════════════════════════════════

  {
    slug: 'closed-terrarium-water-cycle',
    title: 'The Water Cycle Inside a Closed Terrarium',
    subtitle: 'Understanding the self-sustaining ecosystem',
    category: 'terrarium-care',
    publishDate: '2026-05-01',
    readTime: '6 min',
    author: 'Aayush Lilani',
    excerpt: 'A closed terrarium recycles water through evaporation and condensation, creating a miniature water cycle that sustains itself indefinitely.',
    keyQuestion: 'How does a closed terrarium water itself?',
    keyAnswer: 'A closed terrarium creates a self-sustaining water cycle: plants release moisture through transpiration, water condenses on the glass walls, and droplets return to the soil. This cycle continues indefinitely without adding water.',
    metaTitle: 'How Closed Terrariums Water Themselves | EarthBox Mumbai',
    metaDescription: 'Learn how the water cycle works inside a closed terrarium ecosystem. Expert guide from EarthBox, Mumbai\'s terrarium studio.',
    keywords: ['closed terrarium water cycle', 'self-watering terrarium', 'terrarium ecosystem Mumbai'],
    faqs: [
      { question: 'Do closed terrariums need watering?', answer: 'Closed terrariums rarely need watering after initial setup. The sealed environment recycles water through evaporation and condensation. Add water only if condensation stops appearing.' },
      { question: 'How long can a closed terrarium survive without opening?', answer: 'A properly balanced closed terrarium can survive for years, even decades. The oldest known closed terrarium has thrived since 1960 with minimal intervention.' }
    ],
    relatedProducts: ['TER-001'],
    relatedArticles: ['open-vs-closed-terrariums', 'first-30-days-terrarium']
  },

  {
    slug: 'rescue-overwatered-terrarium',
    title: 'How to Rescue an Overwatered Terrarium',
    subtitle: 'Fixing excess moisture and preventing mold',
    category: 'terrarium-care',
    publishDate: '2026-04-28',
    readTime: '5 min',
    author: 'Aayush Lilani',
    excerpt: 'Too much water is the most common terrarium problem. Learn to identify the signs and restore balance to your ecosystem.',
    keyQuestion: 'How do I fix an overwatered terrarium?',
    keyAnswer: 'Remove the lid for 24-48 hours to let excess moisture evaporate. Wipe condensation from glass daily. If mold appears, remove affected plants and soil, treat with diluted hydrogen peroxide, and reduce watering.',
    metaTitle: 'Fix Overwatered Terrarium: Mold & Moisture Guide | EarthBox',
    metaDescription: 'Step-by-step guide to rescue an overwatered terrarium. Remove mold, balance moisture, and restore your ecosystem.',
    keywords: ['terrarium too wet', 'terrarium mold fix', 'overwatered terrarium'],
    faqs: [
      { question: 'Why is my terrarium foggy all the time?', answer: 'Constant heavy fogging indicates excess moisture. Remove the lid for a few hours daily until condensation appears only in the morning.' },
      { question: 'Is white mold in terrarium dangerous?', answer: 'White fuzzy mold is common and usually harmless in small amounts. Remove affected material, improve airflow, and reduce moisture. It often resolves naturally.' }
    ],
    relatedProducts: ['TER-001'],
    relatedArticles: ['closed-terrarium-water-cycle', 'terrarium-soil-guide']
  },

  {
    slug: 'open-vs-closed-terrariums',
    title: 'Open vs Closed Terrariums: Which is Right for You?',
    subtitle: 'Choosing between ecosystem types',
    category: 'terrarium-care',
    publishDate: '2026-04-20',
    readTime: '7 min',
    author: 'Aayush Lilani',
    excerpt: 'Open and closed terrariums serve different plants and lifestyles. Understanding the difference helps you choose the right ecosystem.',
    keyQuestion: 'What is the difference between open and closed terrariums?',
    keyAnswer: 'Closed terrariums are sealed glass containers that create self-sustaining humid environments for tropical plants like ferns and moss. Open terrariums have no lid, suit succulents and cacti that prefer dry conditions, and require regular watering.',
    metaTitle: 'Open vs Closed Terrariums: Complete Guide | EarthBox Mumbai',
    metaDescription: 'Learn the difference between open and closed terrariums. Which plants, care requirements, and style suits you best.',
    keywords: ['open vs closed terrarium', 'terrarium types', 'which terrarium to buy'],
    faqs: [
      { question: 'Can succulents go in closed terrariums?', answer: 'No. Succulents need dry conditions and airflow. The humidity in closed terrariums causes them to rot. Use open terrariums for succulents.' },
      { question: 'Which terrarium is easier to maintain?', answer: 'Closed terrariums are easier once established—they water themselves. Open terrariums need regular watering but are more forgiving of mistakes.' }
    ],
    relatedProducts: ['TER-001'],
    relatedArticles: ['closed-terrarium-water-cycle', 'choosing-first-terrarium-plant']
  },

  {
    slug: 'first-30-days-terrarium',
    title: 'The First 30 Days: Terrarium Settling Guide',
    subtitle: 'What to expect when your terrarium is new',
    category: 'terrarium-care',
    publishDate: '2026-04-15',
    readTime: '5 min',
    author: 'Aayush Lilani',
    excerpt: 'New terrariums go through an adjustment period. Understanding this phase prevents panic and unnecessary intervention.',
    keyQuestion: 'Why is my new terrarium not thriving?',
    keyAnswer: 'New terrariums need 2-4 weeks to stabilize. Plants may droop initially as they adjust to humidity levels. Some leaf yellowing is normal. Avoid opening the lid frequently—let the ecosystem find its balance.',
    metaTitle: 'New Terrarium Care: First 30 Days Guide | EarthBox',
    metaDescription: 'What to expect in your terrarium\'s first month. Normal settling signs vs problems that need attention.',
    keywords: ['new terrarium care', 'terrarium not thriving', 'terrarium adjustment period'],
    faqs: [
      { question: 'Should I open my new terrarium?', answer: 'Only if condensation is so heavy you cannot see inside. Otherwise, leave it sealed for the first 2-3 weeks to let the ecosystem stabilize.' },
      { question: 'Why are my terrarium leaves turning yellow?', answer: 'Some yellowing is normal as plants shed older leaves and adapt. If more than 20% of foliage yellows, check for overwatering or insufficient light.' }
    ],
    relatedProducts: ['TER-001'],
    relatedArticles: ['closed-terrarium-water-cycle', 'reading-plant-health-signs']
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 2: 3D PRINTING (4 articles)
  // ═══════════════════════════════════════════════════════════════════

  {
    slug: 'why-we-3d-print-planters',
    title: 'Why We 3D Print Our Planters: A Design Decision',
    subtitle: 'Technology in service of craft',
    category: '3d-printing',
    publishDate: '2026-04-25',
    readTime: '6 min',
    author: 'Aayush Lilani',
    excerpt: '3D printing allows us to create forms impossible with traditional methods while maintaining the precision of industrial design.',
    keyQuestion: 'Why use 3D printing for planters?',
    keyAnswer: '3D printing enables precise drainage systems, custom geometries, and rapid iteration. Each piece can be unique. Unlike injection molding, there is no minimum order—we can produce one perfect piece at a time.',
    metaTitle: '3D Printed Planters: Why We Choose This Method | EarthBox',
    metaDescription: 'The design philosophy behind EarthBox\'s 3D printed plant accessories. Precision, customization, and craft.',
    keywords: ['3D printed planters', 'custom plant pots Mumbai', '3D printed plant accessories'],
    faqs: [
      { question: 'Are 3D printed planters durable?', answer: 'Yes. We use ABS and ASA plastics rated for outdoor use. With proper care, our planters last for years without degradation.' },
      { question: 'Can you 3D print custom designs?', answer: 'Yes. Contact us with your specifications. We can modify existing designs or create entirely new forms for your space.' }
    ],
    relatedProducts: ['PLT-001'],
    relatedArticles: ['pla-vs-abs-plant-accessories', 'designing-drainage']
  },

  {
    slug: 'pla-vs-abs-plant-accessories',
    title: 'PLA vs ABS for Plant Accessories: Material Guide',
    subtitle: 'Choosing the right filament for plant-safe printing',
    category: '3d-printing',
    publishDate: '2026-04-18',
    readTime: '8 min',
    author: 'Aayush Lilani',
    excerpt: 'Different 3D printing materials have different properties. Understanding them helps you choose accessories that last.',
    keyQuestion: 'Which 3D printing material is best for planters?',
    keyAnswer: 'ABS and ASA are best for planters—they resist UV, moisture, and temperature changes. PLA is biodegradable and may degrade with constant moisture. PETG offers a middle ground with good durability and easier printing.',
    metaTitle: 'PLA vs ABS for Planters: 3D Printing Material Guide | EarthBox',
    metaDescription: 'Compare 3D printing materials for plant accessories. UV resistance, moisture tolerance, and plant safety explained.',
    keywords: ['3D printing materials plants', 'PLA vs ABS planters', 'plant-safe filament'],
    faqs: [
      { question: 'Is PLA safe for plants?', answer: 'PLA is non-toxic and plant-safe, but it degrades with moisture over time. For outdoor or high-humidity use, choose ABS or ASA instead.' },
      { question: 'Will 3D printed planters leach chemicals?', answer: 'Quality ABS, ASA, and PLA are food-safe grades and do not leach harmful chemicals. We use only certified materials.' }
    ],
    relatedProducts: ['PLT-001'],
    relatedArticles: ['why-we-3d-print-planters', 'designing-drainage']
  },

  {
    slug: 'designing-drainage',
    title: 'Designing Drainage: How We Engineer Our Vessels',
    subtitle: 'The geometry of healthy roots',
    category: '3d-printing',
    publishDate: '2026-04-10',
    readTime: '5 min',
    author: 'Aayush Lilani',
    excerpt: 'Proper drainage prevents root rot. Our planters use computational design to optimize water flow.',
    keyQuestion: 'How do you design drainage in 3D printed planters?',
    keyAnswer: 'We use parametric design to create drainage channels that guide water to exit points while retaining enough moisture. Raised internal feet keep roots above standing water. Each design is tested with real plants before production.',
    metaTitle: 'Self-Draining Planter Design: Engineering Guide | EarthBox',
    metaDescription: 'How EarthBox designs drainage systems for 3D printed planters. The engineering behind healthy roots.',
    keywords: ['self-draining planter', 'planter drainage design', '3D printed drainage'],
    faqs: [
      { question: 'Do your planters need drainage holes?', answer: 'Most of our planters include integrated drainage. For closed designs, we add internal reservoirs and wicking systems.' },
      { question: 'Can I use your planters without saucers?', answer: 'We recommend saucers for indoor use. Some designs include integrated catch trays that eliminate the need for separate saucers.' }
    ],
    relatedProducts: ['PLT-001'],
    relatedArticles: ['why-we-3d-print-planters', 'terrarium-soil-guide']
  },

  {
    slug: 'anatomy-earthbox-cradle',
    title: 'The Anatomy of an EarthBox Cradle',
    subtitle: 'Deconstructing our signature holder design',
    category: '3d-printing',
    publishDate: '2026-04-05',
    readTime: '4 min',
    author: 'Aayush Lilani',
    excerpt: 'Our cradle design balances form and function. Here is how every curve serves a purpose.',
    keyQuestion: 'What makes the EarthBox cradle design unique?',
    keyAnswer: 'The cradle uses a parabolic curve that distributes weight evenly while creating visual lightness. The 3mm wall thickness provides strength without bulk. Integrated cable channels allow for hanging without visible hardware.',
    metaTitle: 'EarthBox Cradle Design: Form Meets Function | EarthBox Mumbai',
    metaDescription: 'The design philosophy behind EarthBox plant cradles. How every curve serves a purpose.',
    keywords: ['plant holder design', 'minimalist plant stand', 'hanging planter holder'],
    faqs: [
      { question: 'What weight can the cradle hold?', answer: 'Our standard cradle safely holds pots up to 2kg when wall-mounted. Floor cradles support up to 5kg.' },
      { question: 'Can the cradle be used outdoors?', answer: 'Yes. We print outdoor cradles in ASA, which resists UV degradation. Specify outdoor use when ordering.' }
    ],
    relatedProducts: [],
    relatedArticles: ['why-we-3d-print-planters', 'designing-drainage']
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 3: MUMBAI/INDIA LOCAL (4 articles)
  // ═══════════════════════════════════════════════════════════════════

  {
    slug: 'monsoon-terrarium-care-mumbai',
    title: 'Monsoon Terrarium Care: Mumbai Edition',
    subtitle: 'Managing humidity during the rains',
    category: 'mumbai-plants',
    publishDate: '2026-05-05',
    readTime: '6 min',
    author: 'Aayush Lilani',
    excerpt: 'Mumbai monsoons bring extreme humidity. Your terrarium needs adjusted care during these months.',
    keyQuestion: 'How do I care for my terrarium during Mumbai monsoon?',
    keyAnswer: 'During monsoon, ambient humidity rises to 90%+. Open closed terrariums for 2-3 hours daily to prevent oversaturation. Move terrariums away from windows to avoid temperature swings. Watch for mold—it thrives in monsoon conditions.',
    metaTitle: 'Monsoon Terrarium Care Mumbai: Humidity Guide | EarthBox',
    metaDescription: 'How to care for terrariums during Mumbai\'s monsoon season. Humidity management and mold prevention tips.',
    keywords: ['terrarium monsoon India', 'Mumbai terrarium care', 'humidity terrarium monsoon'],
    faqs: [
      { question: 'Should I open my terrarium during monsoon?', answer: 'Yes, briefly. Open closed terrariums for 2-3 hours daily to release excess humidity and prevent mold growth.' },
      { question: 'Why does my terrarium get moldy in monsoon?', answer: 'High ambient humidity plus warmth creates perfect mold conditions. Increase ventilation and reduce watering during monsoon months.' }
    ],
    relatedProducts: ['TER-001'],
    relatedArticles: ['rescue-overwatered-terrarium', 'mumbai-summer-indoor-plants']
  },

  {
    slug: 'native-indian-terrarium-plants',
    title: '5 Native Indian Plants Perfect for Terrariums',
    subtitle: 'Local species that thrive in glass',
    category: 'mumbai-plants',
    publishDate: '2026-04-22',
    readTime: '7 min',
    author: 'Aayush Lilani',
    excerpt: 'Native plants adapt better to local conditions. These five Indian species make excellent terrarium inhabitants.',
    keyQuestion: 'Which Indian plants grow well in terrariums?',
    keyAnswer: 'Selaginella (Indian spikemoss), Peperomia species native to Western Ghats, Pilea (aluminum plant), native ferns like Adiantum, and Indian fig (Ficus pumila) all thrive in terrarium conditions and are available locally.',
    metaTitle: 'Indian Terrarium Plants: 5 Native Species Guide | EarthBox',
    metaDescription: 'Best native Indian plants for terrariums. Species from Western Ghats and tropical India that thrive in glass.',
    keywords: ['Indian terrarium plants', 'native plants terrariums India', 'Western Ghats terrarium'],
    faqs: [
      { question: 'Where can I buy native terrarium plants in Mumbai?', answer: 'Visit nurseries in Dadar flower market, Matunga, or Versova. Local sellers often have Selaginella and native ferns.' },
      { question: 'Are imported terrarium plants better?', answer: 'Not necessarily. Native plants adapt faster and require less adjustment. They also support local biodiversity.' }
    ],
    relatedProducts: ['TER-001'],
    relatedArticles: ['choosing-first-terrarium-plant', 'monsoon-terrarium-care-mumbai']
  },

  {
    slug: 'mumbai-summer-indoor-plants',
    title: 'Surviving Mumbai Summers: Indoor Plant Guide',
    subtitle: 'Heat-tolerant plants for April through June',
    category: 'mumbai-plants',
    publishDate: '2026-03-15',
    readTime: '6 min',
    author: 'Aayush Lilani',
    excerpt: 'Mumbai summers test even hardy plants. These species handle the heat while keeping your space green.',
    keyQuestion: 'Which indoor plants survive Mumbai summer heat?',
    keyAnswer: 'Snake plants, ZZ plants, pothos, and rubber plants handle Mumbai\'s 35-40°C summers. Avoid delicate ferns and calatheas during peak heat. Keep plants away from direct afternoon sun and increase watering frequency.',
    metaTitle: 'Indoor Plants for Mumbai Summer Heat | EarthBox Guide',
    metaDescription: 'Best indoor plants for Mumbai\'s hot summers. Heat-tolerant species and care tips for April-June.',
    keywords: ['indoor plants Mumbai', 'summer plant care India', 'heat tolerant houseplants'],
    faqs: [
      { question: 'How often should I water plants in Mumbai summer?', answer: 'Most indoor plants need water every 2-3 days in summer, compared to weekly in winter. Check soil moisture—water when the top inch is dry.' },
      { question: 'Should I run AC for my plants?', answer: 'Plants tolerate heat better than sudden temperature changes. If using AC, keep plants away from direct airflow and avoid drastic temperature swings.' }
    ],
    relatedProducts: ['PLT-001'],
    relatedArticles: ['understanding-light-guide', 'monsoon-terrarium-care-mumbai']
  },

  {
    slug: 'terrarium-supplies-mumbai',
    title: 'Where to Find Terrarium Supplies in Mumbai',
    subtitle: 'A local sourcing guide',
    category: 'mumbai-plants',
    publishDate: '2026-03-01',
    readTime: '5 min',
    author: 'Aayush Lilani',
    excerpt: 'Finding quality terrarium materials in Mumbai requires knowing where to look. This guide covers moss, soil, and containers.',
    keyQuestion: 'Where can I buy terrarium supplies in Mumbai?',
    keyAnswer: 'Dadar flower market for plants and moss. Crawford Market for glass containers. Matunga and Versova nurseries for specialty soil. Online: Ugaoo and Nurserylive deliver terrarium kits to Mumbai.',
    metaTitle: 'Terrarium Supplies Mumbai: Complete Sourcing Guide | EarthBox',
    metaDescription: 'Where to buy terrarium moss, soil, plants, and containers in Mumbai. Local markets and online options.',
    keywords: ['terrarium supplies Mumbai', 'moss buy Mumbai', 'terrarium materials India'],
    faqs: [
      { question: 'Can I collect moss from Mumbai?', answer: 'Yes, during monsoon. Look in shaded areas of Sanjay Gandhi National Park edges or Aarey Colony. Collect sustainably—take small patches only.' },
      { question: 'Where to buy terrarium glass in Mumbai?', answer: 'Crawford Market has glass vendors. For premium containers, check Amazon or specialty home stores in Bandra and Khar.' }
    ],
    relatedProducts: ['TER-001'],
    relatedArticles: ['native-indian-terrarium-plants', 'terrarium-soil-guide']
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 4: DESIGN PHILOSOPHY (4 articles)
  // ═══════════════════════════════════════════════════════════════════

  {
    slug: 'quiet-objects-manifesto',
    title: 'Quiet Objects: The EarthBox Design Manifesto',
    subtitle: 'Why we design the way we do',
    category: 'design-notes',
    publishDate: '2026-04-30',
    readTime: '8 min',
    author: 'Aayush Lilani',
    excerpt: 'Design should not demand attention—it should reward it. Our approach to creating objects that belong.',
    keyQuestion: 'What is EarthBox\'s design philosophy?',
    keyAnswer: 'We design quiet objects—pieces that do not demand attention but reward close looking. Every curve has a reason. Every material is chosen for how it ages. We create objects meant to be kept, not replaced.',
    metaTitle: 'Quiet Objects: EarthBox Design Manifesto | Design Philosophy',
    metaDescription: 'The design philosophy behind EarthBox. Why we create objects that reward attention rather than demand it.',
    keywords: ['design objects India', 'minimalist design philosophy', 'intentional design'],
    faqs: [
      { question: 'What does quiet design mean?', answer: 'Quiet design creates objects that integrate into spaces without demanding attention. They reveal their qualities through use, not display.' },
      { question: 'Why focus on terrariums?', answer: 'Terrariums embody our philosophy—they are worlds contained in objects. They require patience, reward attention, and improve with time.' }
    ],
    relatedProducts: ['TER-001'],
    relatedArticles: ['limited-editions-philosophy', 'designing-for-decades']
  },

  {
    slug: 'limited-editions-philosophy',
    title: 'Why We Release in Limited Editions',
    subtitle: 'Scarcity as a design principle',
    category: 'design-notes',
    publishDate: '2026-04-12',
    readTime: '5 min',
    author: 'Aayush Lilani',
    excerpt: 'Each EarthBox design is released in editions of fifty. When an edition closes, it does not return.',
    keyQuestion: 'Why does EarthBox use limited editions?',
    keyAnswer: 'Limited editions ensure each piece receives full attention during production. Fifty units per design means we can hand-finish every piece. When editions close, we move to new forms—keeping the catalog fresh and each piece meaningful.',
    metaTitle: 'Limited Edition Plant Accessories: Our Philosophy | EarthBox',
    metaDescription: 'Why EarthBox releases products in editions of fifty. The value of scarcity and craft attention.',
    keywords: ['limited edition planters', 'artisan planters India', 'small batch craft'],
    faqs: [
      { question: 'Will sold-out designs return?', answer: 'No. When an edition sells out, it closes permanently. This ensures each piece remains special.' },
      { question: 'Can I request a custom version of old designs?', answer: 'Occasionally. Contact us to discuss—custom commissions are considered case by case.' }
    ],
    relatedProducts: ['TER-001', 'PLT-001'],
    relatedArticles: ['quiet-objects-manifesto', 'specimen-card-documentation']
  },

  {
    slug: 'specimen-card-documentation',
    title: 'The Specimen Card: Documenting Each Piece',
    subtitle: 'Provenance and the paper record',
    category: 'design-notes',
    publishDate: '2026-04-08',
    readTime: '4 min',
    author: 'Aayush Lilani',
    excerpt: 'Every EarthBox ships with a specimen card—hand-numbered, signed, and archiving the piece\'s details.',
    keyQuestion: 'What is an EarthBox specimen card?',
    keyAnswer: 'The specimen card is a paper record shipped with each piece. It includes edition number, production date, materials used, and care instructions. Signed by the maker, it serves as provenance documentation.',
    metaTitle: 'EarthBox Specimen Card: Documentation & Provenance | Design',
    metaDescription: 'How EarthBox documents each piece with hand-signed specimen cards. Provenance and craft transparency.',
    keywords: ['handmade documentation', 'craft provenance', 'artisan certificate'],
    faqs: [
      { question: 'Why include paper documentation?', answer: 'Digital records disappear. A physical card stays with the object, connecting future owners to its origin.' },
      { question: 'What information is on the specimen card?', answer: 'Edition number (e.g., 23/50), production date, materials, dimensions, care instructions, and maker signature.' }
    ],
    relatedProducts: ['TER-001', 'PLT-001'],
    relatedArticles: ['limited-editions-philosophy', 'quiet-objects-manifesto']
  },

  {
    slug: 'designing-for-decades',
    title: 'Designing for Decades: Timeless Objects',
    subtitle: 'Why we avoid trends',
    category: 'design-notes',
    publishDate: '2026-03-25',
    readTime: '6 min',
    author: 'Aayush Lilani',
    excerpt: 'Trends expire. We design objects meant to outlast their moment.',
    keyQuestion: 'How do you design objects that last?',
    keyAnswer: 'We avoid trend-driven forms and colors. Neutral palettes age gracefully. Geometric simplicity remains relevant. We test designs against old photographs—if a form would look dated in images from the 1960s, we reconsider.',
    metaTitle: 'Timeless Design: Creating Objects That Last | EarthBox',
    metaDescription: 'EarthBox\'s approach to designing plant accessories that outlast trends. Timeless forms and materials.',
    keywords: ['timeless design', 'heirloom planters', 'lasting design objects'],
    faqs: [
      { question: 'Why are EarthBox products neutral colors?', answer: 'Neutral colors integrate into any space and do not date. Trends in color change yearly—neutrals remain relevant for decades.' },
      { question: 'How do you test if a design is timeless?', answer: 'We compare against archival images. If a form echoes dated aesthetics from any era, we simplify further.' }
    ],
    relatedProducts: ['TER-001', 'PLT-001'],
    relatedArticles: ['quiet-objects-manifesto', 'limited-editions-philosophy']
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 5: PLANT FUNDAMENTALS (4 articles)
  // ═══════════════════════════════════════════════════════════════════

  {
    slug: 'understanding-light-guide',
    title: 'Understanding Light: A Beginner\'s Guide',
    subtitle: 'Matching plants to your space',
    category: 'plant-fundamentals',
    publishDate: '2026-05-03',
    readTime: '7 min',
    author: 'Aayush Lilani',
    excerpt: 'Light is the most misunderstood factor in plant care. Learn to read your space and choose plants accordingly.',
    keyQuestion: 'How much light do indoor plants need?',
    keyAnswer: 'It depends on the plant. Low-light plants (pothos, snake plant) need 50-250 foot-candles—north-facing windows or room interiors. Medium-light plants need 250-1000 foot-candles—east windows. High-light plants need 1000+ foot-candles—south or west windows.',
    metaTitle: 'Indoor Plant Light Requirements Guide | EarthBox Mumbai',
    metaDescription: 'How to assess light in your home for houseplants. Match plants to windows and room conditions.',
    keywords: ['indoor plant light requirements', 'low light plants India', 'houseplant light guide'],
    faqs: [
      { question: 'What is bright indirect light?', answer: 'Bright indirect light means strong ambient light without direct sun rays hitting leaves. Near a sunny window but not in the sun beam.' },
      { question: 'Can plants survive in windowless rooms?', answer: 'Very few plants survive without natural light. Pothos and snake plants tolerate low light but need some. Grow lights can supplement completely dark spaces.' }
    ],
    relatedProducts: ['PLT-001'],
    relatedArticles: ['mumbai-summer-indoor-plants', 'reading-plant-health-signs']
  },

  {
    slug: 'terrarium-soil-guide',
    title: 'The Right Soil for Terrariums',
    subtitle: 'Building the foundation layer',
    category: 'plant-fundamentals',
    publishDate: '2026-04-27',
    readTime: '6 min',
    author: 'Aayush Lilani',
    excerpt: 'Terrarium soil must balance drainage and moisture retention. The wrong mix causes root rot or dehydration.',
    keyQuestion: 'What soil should I use for a terrarium?',
    keyAnswer: 'Mix equal parts potting soil, perlite, and orchid bark for drainage. Add activated charcoal to prevent odors. Closed terrariums need more drainage; open terrariums can be slightly denser. Avoid garden soil—it compacts and may contain pests.',
    metaTitle: 'Terrarium Soil Mix Guide: Perfect Substrate | EarthBox',
    metaDescription: 'How to create the ideal terrarium soil mix. Drainage, moisture retention, and preventing root rot.',
    keywords: ['terrarium soil mix', 'substrate terrarium', 'terrarium drainage layer'],
    faqs: [
      { question: 'Do I need charcoal in terrarium soil?', answer: 'Charcoal is not essential but helps absorb odors and toxins in closed terrariums. Add a thin layer above drainage rocks.' },
      { question: 'Can I use regular potting soil for terrariums?', answer: 'Yes, but amend it. Mix with perlite and bark for better drainage. Pure potting soil retains too much moisture for closed terrariums.' }
    ],
    relatedProducts: ['TER-001'],
    relatedArticles: ['closed-terrarium-water-cycle', 'terrarium-supplies-mumbai']
  },

  {
    slug: 'reading-plant-health-signs',
    title: 'Reading Your Plants: Signs of Health and Stress',
    subtitle: 'Learning to diagnose problems early',
    category: 'plant-fundamentals',
    publishDate: '2026-04-17',
    readTime: '8 min',
    author: 'Aayush Lilani',
    excerpt: 'Plants communicate through their leaves. Learning to read these signals helps you respond before problems worsen.',
    keyQuestion: 'How can I tell if my plant is unhealthy?',
    keyAnswer: 'Yellow leaves often mean overwatering. Brown crispy edges indicate underwatering or low humidity. Pale leaves suggest insufficient light. Drooping can mean either too much or too little water—check soil moisture to distinguish.',
    metaTitle: 'Plant Health Signs: Diagnose Problems Early | EarthBox',
    metaDescription: 'Learn to read plant stress signals. Yellow leaves, brown tips, drooping—what each symptom means.',
    keywords: ['plant health signs', 'why is my plant dying', 'plant problem diagnosis'],
    faqs: [
      { question: 'Why are my plant leaves turning yellow?', answer: 'Most commonly overwatering. Check soil—if wet, reduce watering. Yellow leaves with green veins suggest nutrient deficiency.' },
      { question: 'Why does my plant have brown leaf tips?', answer: 'Usually low humidity or underwatering. Crispy tips indicate the plant is losing moisture faster than roots absorb it.' }
    ],
    relatedProducts: ['PLT-001'],
    relatedArticles: ['understanding-light-guide', 'rescue-overwatered-terrarium']
  },

  {
    slug: 'choosing-first-terrarium-plant',
    title: 'Choosing Your First Terrarium Plant',
    subtitle: 'Beginner-friendly species that thrive',
    category: 'plant-fundamentals',
    publishDate: '2026-04-02',
    readTime: '5 min',
    author: 'Aayush Lilani',
    excerpt: 'Your first terrarium plant should be forgiving. These species tolerate beginner mistakes while establishing quickly.',
    keyQuestion: 'What is the best plant for a first terrarium?',
    keyAnswer: 'Fittonia (nerve plant) is ideal—it droops dramatically when thirsty but recovers quickly, teaching you to read water needs. Moss is nearly indestructible. Peperomia tolerates variable conditions. Avoid ferns for first attempts—they are less forgiving.',
    metaTitle: 'Best Beginner Terrarium Plants: Easy Species Guide | EarthBox',
    metaDescription: 'Top plants for your first terrarium. Forgiving species that teach you terrarium care basics.',
    keywords: ['best terrarium plants beginners', 'easy terrarium plants', 'first terrarium plants'],
    faqs: [
      { question: 'Is moss good for beginners?', answer: 'Yes. Moss thrives in terrarium humidity, spreads naturally, and indicates moisture levels—it browns when too dry, greens when watered.' },
      { question: 'Should I start with one plant or several?', answer: 'Start with 2-3 small plants. This creates visual interest while leaving room for growth. Overcrowding causes problems as plants mature.' }
    ],
    relatedProducts: ['TER-001'],
    relatedArticles: ['native-indian-terrarium-plants', 'first-30-days-terrarium']
  },

  // ═══════════════════════════════════════════════════════════════════
  // NEW: VOLUME I PRODUCT ARTICLES (3 articles)
  // ═══════════════════════════════════════════════════════════════════

  {
    slug: 'moss-pole-guide-monstera',
    title: 'Moss Pole Guide: Supporting Climbing Plants in Mumbai',
    subtitle: 'Everything you need to know about moss poles for Monstera, Pothos, and more',
    category: '3d-printing',
    publishDate: '2026-05-07',
    readTime: '7 min',
    author: 'Aayush Lilani',
    excerpt: 'Climbing plants like Monstera and Philodendron need vertical support to reach their full potential. Learn how modular moss poles help aerial roots grip and grow.',
    keyQuestion: 'Do Monstera plants need a moss pole?',
    keyAnswer: 'Yes, Monstera deliciosa naturally climbs trees in the wild. A moss pole mimics this support, encouraging larger leaves, stronger stems, and healthier aerial root development. Without support, Monstera grows horizontally and produces smaller leaves.',
    metaTitle: 'Moss Pole Guide for Monstera & Climbing Plants | EarthBox Mumbai',
    metaDescription: 'Complete guide to moss poles for Monstera, Pothos, and Philodendron. Learn when to add support, how to attach plants, and keep moss hydrated in Mumbai humidity.',
    keywords: ['moss pole for monstera', 'climbing plant support Mumbai', 'modular moss pole', 'monstera care India'],
    faqs: [
      { question: 'When should I add a moss pole to my Monstera?', answer: 'Add a moss pole when your Monstera has 4-5 leaves and begins producing aerial roots. Earlier is better—training a young plant is easier than bending mature stems.' },
      { question: 'How do I keep a moss pole moist?', answer: 'Use a drip cap reservoir that slowly releases water, or mist the pole 2-3 times weekly. In Mumbai monsoon, natural humidity often suffices.' },
      { question: 'Can I use a moss pole for Pothos?', answer: 'Absolutely. Pothos climbing a moss pole develops larger, more mature leaves compared to trailing growth. The transformation is dramatic.' }
    ],
    relatedProducts: ['V1-SUP-003', 'V1-SUP-004'],
    relatedArticles: ['why-we-3d-print-planters', 'mumbai-summer-indoor-plants']
  },

  {
    slug: 'stackable-planters-balcony-garden',
    title: 'Stackable Planters: Vertical Gardening for Mumbai Balconies',
    subtitle: 'Maximize small spaces with modular planting systems',
    category: '3d-printing',
    publishDate: '2026-05-06',
    readTime: '6 min',
    author: 'Aayush Lilani',
    excerpt: 'Mumbai apartments rarely have garden space. Stackable planters turn a single square foot into a vertical garden supporting herbs, greens, and ornamentals.',
    keyQuestion: 'How do stackable planters work?',
    keyAnswer: 'Stackable planters are modular units that connect vertically and horizontally. Each block has drainage that flows to the unit below, creating an efficient watering system. You can expand upward or sideways as your collection grows.',
    metaTitle: 'Stackable Planters for Mumbai Balconies | Vertical Garden Guide',
    metaDescription: 'Transform your Mumbai balcony with stackable planters. Grow herbs, vegetables, and ornamentals in minimal space with modular vertical gardening.',
    keywords: ['stackable planters Mumbai', 'vertical garden balcony', 'small space gardening India', 'modular planters'],
    faqs: [
      { question: 'What can I grow in stackable planters?', answer: 'Herbs (tulsi, mint, coriander), leafy greens (spinach, lettuce), small ornamentals, and trailing plants like Pothos. Avoid deep-rooted vegetables.' },
      { question: 'How many levels can I stack?', answer: 'Structurally, 4-5 levels work well. Consider sunlight—lower levels receive less direct light, so place shade-tolerant plants there.' },
      { question: 'Will they survive Mumbai monsoon?', answer: 'Our ASA material is UV-stable and weather-resistant. Ensure drainage holes are clear during heavy rain to prevent waterlogging.' }
    ],
    relatedProducts: ['V1-PLT-005', 'V1-MNT-001'],
    relatedArticles: ['designing-drainage', 'mumbai-summer-indoor-plants']
  },

  {
    slug: 'plant-care-tags-organization',
    title: 'Plant Care Tags: Never Forget Watering Again',
    subtitle: 'Simple visual markers for managing your indoor garden',
    category: '3d-printing',
    publishDate: '2026-05-05',
    readTime: '4 min',
    author: 'Aayush Lilani',
    excerpt: 'As your plant collection grows, remembering each plant\'s needs becomes challenging. Care tags provide at-a-glance information for light and water requirements.',
    keyQuestion: 'How do plant care tags help?',
    keyAnswer: 'Care tags use visual symbols to indicate each plant\'s sunlight and watering needs. A filled sun icon means direct light; half-filled means indirect. Water droplets show frequency—more drops mean more water. At a glance, you know exactly what each plant needs.',
    metaTitle: 'Plant Care Tags: Visual Markers for Indoor Gardens | EarthBox',
    metaDescription: 'Organize your plant collection with care tags. Visual markers for light and water needs help you care for every plant correctly.',
    keywords: ['plant care tags', 'plant labels', 'indoor garden organization', 'plant watering reminder'],
    faqs: [
      { question: 'How do I know what settings to use for each plant?', answer: 'Research your plant species or check the nursery tag. Most common houseplants fall into 3-4 categories: low light/low water (Snake Plant), bright indirect/moderate (Pothos), bright direct/frequent (herbs).' },
      { question: 'Are the tags waterproof?', answer: 'Yes. 3D printed in ABS or ASA, they handle soil moisture, watering splash, and outdoor humidity without degrading.' }
    ],
    relatedProducts: ['V1-ACC-001', 'V1-ACC-002'],
    relatedArticles: ['reading-plant-health-signs', 'understanding-light-guide']
  }
];

// Merge body content into each article
articles.forEach(article => {
  if (articleBodies[article.slug]) {
    article.body = articleBodies[article.slug];
  }
});
