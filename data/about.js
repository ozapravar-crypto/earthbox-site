// ─────────────────────────────────────────────────────────────────────
// data/about.js · About page sections
// Simple vertical layout · numbers removed · founder side-by-side.
// ─────────────────────────────────────────────────────────────────────

export const sections = [

  {
    title: 'Origin',
    body: [
      'EarthBox began with one obsession: that a terrarium could be the most considered object in a room. Not a decoration, but a small designed world.',
      'Aayush Lilani started the studio in Mumbai with a single question: what does it look like to treat a contained ecosystem the way you would treat a precision timepiece. Volume I is the first answer. Each piece is sketched on paper, modelled, printed, and held for weeks before it is named.'
    ]
  },

  {
    title: 'Method',
    body: [
      'Every piece is made by one person, in one studio, on enquiry. Forms are released in editions of fifty. When an edition closes, it does not return.'
    ],
    steps: [
      { n: '01', text: 'Form is sketched on paper, then modelled in CAD.' },
      { n: '02', text: '3D-printed in ABS, ASA, or PLA. Each piece numbered.' },
      { n: '03', text: 'Post-process: supports removed, surfaces sanded smooth.' },
      { n: '04', text: 'Specimen card printed and signed before shipping.' }
    ]
  },

  {
    title: 'Founder',
    body: [
      'A studio of one. For now.'
    ],
    person: {
      name:     'Aayush Lilani',
      role:     'Designer & Founder',
      location: 'Kandivali, Mumbai 400101',
      bio:      'Industrial designer. Spends his attention on the small geometries: the curve of an edge, the weight of a base, the way light falls inside a vessel. Believes the most considered object in a room could be the smallest one. Designs and builds every EarthBox from his Kandivali studio.'
    }
  },

  {
    title: 'Contact',
    body: [
      'Every piece begins with a conversation. Write directly — replies usually within a day.'
    ],
    contact: [
      { key: 'Email',     value: '<a href="mailto:aayush.lilani@gmail.com">aayush.lilani@gmail.com</a>' },
      { key: 'Phone',     value: '<a href="tel:+918104811584">+91 81048 11584</a>' },
      { key: 'WhatsApp',  value: '<a href="https://wa.me/918104811584" target="_blank" rel="noopener">+91 81048 11584</a>' },
      { key: 'Instagram', value: '<a href="https://www.instagram.com/earthbox_india" target="_blank" rel="noopener">@earthbox_india</a>' },
      { key: 'LinkedIn',  value: '<a href="https://www.linkedin.com/in/aayush-lilani-13a329292/" target="_blank" rel="noopener">aayush-lilani</a>' },
      { key: 'Studio',    value: 'Kandivali, Mumbai 400101' }
    ]
  }
];

export const closingStatement = 'Small houses, holding big worlds.';
