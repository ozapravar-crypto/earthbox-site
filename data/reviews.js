// ─────────────────────────────────────────────────────────────────────
// data/reviews.js · Customer reviews for product detail pages
//
// Reviews are keyed by product SKU. Each review includes:
//   - name: reviewer's first name (privacy-conscious)
//   - location: city/area (optional, adds authenticity)
//   - date: ISO date string
//   - rating: 1-5 (displayed subtly)
//   - text: review body (keep it genuine, not salesy)
//   - verified: boolean (purchased through EarthBox)
// ─────────────────────────────────────────────────────────────────────

export const reviews = {
  // ═══ Volume I · 3D Printed Products ═══

  'V1-PLT-005': [
    {
      name: 'Priya',
      location: 'Bandra',
      date: '2026-04-28',
      rating: 5,
      text: 'The small blocks are perfect for my kitchen herbs. I started with two and now have six stacked by the window. The drainage works beautifully.',
      verified: true
    },
    {
      name: 'Rohan',
      location: 'Andheri',
      date: '2026-04-15',
      rating: 4,
      text: 'Clean design, sturdy build. Took about a week to arrive but worth the wait. Would love more color options.',
      verified: true
    }
  ],

  'V1-SUP-001': [
    {
      name: 'Meera',
      location: 'Powai',
      date: '2026-05-02',
      rating: 5,
      text: 'My monstera has never looked better. The bendable pole lets me shape the growth exactly how I want. Much better than the coir poles from the nursery.',
      verified: true
    },
    {
      name: 'Aditya',
      location: 'Goregaon',
      date: '2026-04-20',
      rating: 5,
      text: 'Ordered the large size for my philodendron. The build quality is excellent — feels like it will last years. Aayush was helpful with sizing questions.',
      verified: true
    },
    {
      name: 'Sneha',
      location: 'Thane',
      date: '2026-04-10',
      rating: 4,
      text: 'Beautiful and functional. Only wish it came in a darker color to match my pots.',
      verified: true
    }
  ],

  'V1-SUP-002': [
    {
      name: 'Kavya',
      location: 'Juhu',
      date: '2026-04-25',
      rating: 5,
      text: 'The trellis arrived faster than expected. My pothos is already climbing beautifully. Love that it\'s 3D printed here in Mumbai.',
      verified: true
    }
  ],

  'V1-ACC-001': [
    {
      name: 'Riya',
      location: 'Malad',
      date: '2026-05-01',
      rating: 5,
      text: 'These plant tags are so elegant compared to the plastic ones from Amazon. I bought a set of 30 for my entire collection. The etched text hasn\'t faded at all.',
      verified: true
    },
    {
      name: 'Vikram',
      location: 'Kandivali',
      date: '2026-04-18',
      rating: 5,
      text: 'Perfect for keeping track of my propagations. Minimal, durable, and the right size.',
      verified: true
    }
  ],

  'V1-ACC-002': [
    {
      name: 'Anjali',
      location: 'Borivali',
      date: '2026-04-22',
      rating: 5,
      text: 'Finally a watering can that doesn\'t look ugly on my shelf. The long spout gives great control for my terrariums.',
      verified: true
    }
  ],

  'V1-MNT-001': [
    {
      name: 'Siddharth',
      location: 'Versova',
      date: '2026-04-30',
      rating: 5,
      text: 'These clips transformed my balcony railing into a garden. Sturdy enough to hold my heavy ceramic pots. Ordered 8 more.',
      verified: true
    },
    {
      name: 'Nisha',
      location: 'Santacruz',
      date: '2026-04-12',
      rating: 4,
      text: 'Good quality, fits standard railings perfectly. Installation was easy — no tools needed.',
      verified: true
    }
  ],

  // ═══ Volume II · Elemental Boxes ═══
  // (Coming soon products — no reviews yet)

  // ═══ Volume III · Digital Vivariums ═══
  // (Concept stage — no reviews)
};

export function getReviews(sku) {
  return reviews[sku] || [];
}

export function getAverageRating(sku) {
  const productReviews = reviews[sku];
  if (!productReviews || productReviews.length === 0) return null;
  const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
  return (sum / productReviews.length).toFixed(1);
}
