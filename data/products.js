// ─────────────────────────────────────────────────────────────────────
// data/products.js · Volume I (inquiry-only)
//
// Volume I = Terrariums and 3D-printed plant accessories.
// Three sub-categories:
//   01 Terrariums · 02 Planters · 03 Holders & Stands
//
// All prices are inquiry-driven. No checkout. Buttons point to WhatsApp.
// ─────────────────────────────────────────────────────────────────────

export const subCategories = [
  { slug: 'terrariums', title: 'Terrariums',        description: 'Self-contained ecosystems in crafted vessels.' },
  { slug: 'planters',   title: 'Planters',          description: '3D-printed vessels in matte, bisque, and metallic finishes.' },
  { slug: 'holders',    title: 'Holders & Stands',  description: 'Wall mounts, plinths, brass cradles, hanging holders.' }
];

export const volumeOne = [
  {
    sku: 'TER-001',
    category: 'terrariums',
    index: '01',
    name: 'Specimen Terrarium',
    sub: 'Terrarium · closed ecosystem',
    description: 'A self-contained world under glass. Precision-crafted vessel housing a living micro-ecosystem.',
    dimensions: 'On enquiry',
    price: 'Price on enquiry',
    illustration: 'cube',
    new: true
  },
  {
    sku: 'ACC-001',
    category: 'planters',
    index: '02',
    name: 'Specimen Planter, Bisque',
    sub: 'Planter · low-fired finish',
    description: 'A vessel weighted to belong on a shelf. 3D-printed with a low-fired bisque surface that takes the hand.',
    dimensions: 'On enquiry',
    price: 'Price on enquiry',
    illustration: 'vessel',
    new: true
  }
];

// One enquiry email used for every product · replaces the cart flow.
export const enquiryEmail = 'aayush.lilani@gmail.com';
