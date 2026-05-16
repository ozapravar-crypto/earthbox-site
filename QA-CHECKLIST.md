# EarthBox Site QA Checklist

## Overview
Static marketing site for EarthBox - Mumbai-based studio selling terrariums and 3D-printed plant accessories. No backend, JS-rendered content from data files.

**Live URL:** https://www.earthbox.in/
**Repo:** github.com/ozapravar-crypto/earthbox-site

---

## Pages & Routes

| Page | Path | Key Elements |
|------|------|--------------|
| Home | `/index.html` | Hero, manifesto, video, principles, CTA |
| Catalogue | `/products.html` | Vol tabs (I/II/III), product grids, search |
| Product Detail | `/product.html#SKU` | Dynamic from hash, specs, enquiry CTA |
| Journal | `/blog.html` | Article grid, category filters |
| Article | `/blog/[slug].html` | Dynamic from hash |
| About | `/about.html` | Founder, materials, method |

---

## Critical Flows

### 1. Catalogue Tab Switching
- [ ] Vol-1 loads by default
- [ ] Vol-2 loads when clicking "II NEXT" tab
- [ ] Vol-3 loads when clicking "III HORIZON" tab
- [ ] Direct link `#vol-2` shows Vol-2 content on fresh visit
- [ ] Content fades in (reveal animation works)
- [ ] Tab underline animates correctly

### 2. Product Cards → Detail
- [ ] Clicking any product card navigates to `/product.html#SKU`
- [ ] Detail page shows correct product data
- [ ] Images load correctly
- [ ] WhatsApp enquiry link has correct pre-filled text

### 3. Search Overlay
- [ ] Cmd/Ctrl+K opens search
- [ ] ESC closes search
- [ ] Typing filters across all volumes
- [ ] Results link to correct product pages

### 4. Mobile Navigation
- [ ] Hamburger visible on mobile (<720px)
- [ ] Menu slides in from right
- [ ] Close button works
- [ ] Links navigate correctly
- [ ] Menu not focusable when closed (visibility:hidden)

---

## Performance Checklist

### Images
- [ ] All images are WebP format
- [ ] Responsive variants exist: `-300.webp`, `-600.webp`
- [ ] `srcset` and `sizes` attributes present on catalogue images
- [ ] `loading="lazy"` on all non-critical images
- [ ] `decoding="async"` on catalogue/product images
- [ ] No image > 200KB (except hero/full-page)

### Loading
- [ ] Loader animation plays on first visit
- [ ] Content visible within 3s on 4G
- [ ] No layout shift after images load
- [ ] JS modules load without errors (check console)

---

## Accessibility Checklist

### Color Contrast (WCAG 2.1 AA)
- [ ] Body text: 4.5:1 minimum (`--ink` on `--bg`)
- [ ] Labels/eyebrows: 4.5:1 (`--accent-text` on `--bg`)
- [ ] Muted text: 4.5:1 (`--mute` on `--bg`)

### Focus & Keyboard
- [ ] Skip-to-content link works
- [ ] Tab order follows visual order
- [ ] Focus visible on all interactive elements
- [ ] Escape closes modals/overlays

### Screen Readers
- [ ] Images have meaningful alt text
- [ ] Video has aria-describedby
- [ ] Tabs have proper ARIA roles
- [ ] Hidden content has aria-hidden="true"

### Touch Targets
- [ ] All buttons ≥44px touch area
- [ ] Links have adequate spacing

---

## Browser/Device Matrix

### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari 14+
- [ ] Edge (latest)

### Mobile
- [ ] iOS Safari 14+
- [ ] Chrome Android
- [ ] Samsung Internet

### Breakpoints
- [ ] 1440px+ (large desktop)
- [ ] 1100px (tablet landscape)
- [ ] 720px (tablet portrait / mobile nav breakpoint)
- [ ] 560px (mobile)
- [ ] 375px (small mobile)

---

## Data Integrity

### Volume I Products (`data/volume-one.js`)
- [ ] All products have: sku, name, category, description, photo
- [ ] Photos exist at `assets/v1/[photo]`
- [ ] Responsive variants exist (`-300.webp`, `-600.webp`)
- [ ] Pricing object valid for available products

### Volume II Boxes (`data/upcoming.js`)
- [ ] All 10 boxes have: sku, name, tagline, description, photo
- [ ] Photos exist at `assets/boxes/[photo]`
- [ ] Illustrations (SVG) exist where specified

### Categories (`data/volume-one.js`)
- [ ] Each category has: slug, title, description
- [ ] Products reference valid category slugs

---

## Known Limitations

1. **No backend** - Enquiries go to WhatsApp, not captured in DB
2. **No OG images** - Social preview images not generated
3. **No PWA** - Not installable, no offline support
4. **No analytics beyond GA4** - Basic pageviews only

---

## Recent Fixes (May 2026)

| Date | Issue | Fix |
|------|-------|-----|
| 05-16 | Vol-2 not loading on fresh mobile visits | Fixed init order: initReveal before initCatalogue |
| 05-16 | Images too large for mobile | Added srcset with 300/600px variants |
| 05-16 | Low contrast text | Created --accent-text (#766A5E) token |
| 05-16 | Hidden focusable elements in mobile nav | Added visibility:hidden when closed |
| 05-16 | Touch targets too small | Increased hamburger/close to 44px |
| 05-16 | 67MB image payload | Converted to WebP, 94% reduction |

---

## Deployment

Site is static - just push to `main` branch. GitHub Pages or any static host.

```bash
# Push changes
gh auth switch --user ozapravar-crypto
git push origin main
gh auth switch --user pravaroza-stack
```
