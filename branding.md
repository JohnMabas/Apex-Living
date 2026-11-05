# Nestora — Frontend Branding & UI Reference

**Brand name:** Nestora  
**Tagline:** Your comfort, your space.  
**Project type:** Full-stack apartment booking platform  
**Frontend framework:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4

---

## Brand Identity

### Personality
Modern · Welcoming · Elegant · Trustworthy · Comfortable · Professional

### Colour palette

| Name | Hex | Tailwind class | Usage |
|---|---|---|---|
| Forest Green | `#173D32` | `bg-forest-green` / `text-forest-green` | Primary — buttons, headings, navbar, icons |
| Warm Ivory | `#F4EBDD` | `bg-warm-ivory` / `text-warm-ivory` | Page background, cards, light surfaces |
| Soft Gold | `#C69B65` | `bg-soft-gold` / `text-soft-gold` | Accent — highlights, active states, CTA |
| Charcoal | `#252B28` | `bg-charcoal` / `text-charcoal` | Body text, dark overlays |
| White | `#FFFFFF` | `bg-white` / `text-white` | Cards, surfaces, text on dark backgrounds |

### Typography

| Font | Variable | Usage |
|---|---|---|
| Playfair Display | `--font-playfair` | Headings, display text (`font-display` class) |
| Inter | `--font-inter` | Body text, buttons, forms (`font-sans` class) |

> Font variables are defined in `globals.css` as CSS custom properties. Currently using system font stacks as fallbacks (Google Fonts requires network access at build time).

### Logo

Simple house/home icon (`lucide-react` `Home`) inside a Forest Green rounded square, paired with the **Nestora** wordmark in Playfair Display. Implemented in `Navbar.tsx`.

---

## Design System

### Visual direction

- Soft, faded, premium aesthetic
- Muted ivory and green backgrounds
- Subtle image overlays on hero sections
- Soft shadows and low-contrast decorative borders
- Generous whitespace and rounded corners
- Elegant typography with clear hierarchy
- Consistent spacing across all pages

### Spacing & layout

- Max content width: `max-w-7xl mx-auto`
- Horizontal padding: `px-4 sm:px-6 lg:px-8`
- Section vertical padding: `py-20`
- Card border radius: `rounded-2xl`
- Button border radius: `rounded-xl` / `rounded-lg`

### Shadows & borders

- Subtle card borders: `border border-charcoal/8`
- Card hover shadow: `hover:shadow-lg`
- Navbar border when scrolled: `border-b border-soft-gold/20`

### Transitions

All interactive elements use: `transition-colors duration-200`  
Images on hover: `transition-transform duration-500`

---

## Component Library

All components live in `frontend/src/components/`.

### Navbar — `Navbar.tsx`

- Fixed to top, `z-50`
- **Transparent with white text** when on the homepage and not scrolled
- **Solid white** (`bg-white/95`) with dark text when scrolled or on any other page
- Scroll threshold: `window.scrollY > 20`
- Logo: Home icon + "Nestora" wordmark
- Desktop links: Home, Apartments, About, Contact
- Desktop auth: Sign In (text link) + Book Now (filled button)
- Mobile: hamburger menu, closes on route change
- Active link: underlined with `border-soft-gold`

### Footer — `Footer.tsx`

- Dark Forest Green background
- Brand logo + tagline
- Navigation links grouped by section
- Contact info (email, phone, address)
- Social media icons (Lucide React)
- Copyright line
- Warm Ivory text on Forest Green background

### Button — `Button.tsx`

5 variants:

| Variant | Style |
|---|---|
| `primary` | Forest Green background, Warm Ivory text |
| `secondary` | Warm Ivory background, Forest Green text |
| `outline` | Transparent, Forest Green border and text |
| `ghost` | Transparent, Forest Green text, hover background |
| `gold` | Soft Gold background, white text |

3 sizes: `sm` · `md` (default) · `lg`  
States: loading spinner, disabled opacity

### Input / Textarea / Select — `Input.tsx`

- Accessible: `label`, `error`, `hint` support
- Border: `border-charcoal/20`, focus: `border-forest-green`
- Error state: `border-red-400` + red error message
- Consistent padding and border radius across all form fields

### SectionHeading — `SectionHeading.tsx`

- Props: `eyebrow` (small uppercase label), `title`, `description`, `centered`, `light`
- Eyebrow: Soft Gold, small, uppercase, tracked
- Title: Playfair Display, Forest Green
- `light` variant: white text for dark section backgrounds
- `centered` variant: `text-center mx-auto`

### ApartmentCard — `ApartmentCard.tsx`

- Main image with `next/image` (fill, aspect ratio)
- Location badge overlay on image
- Stats row: bedrooms, bathrooms, guests (Lucide icons)
- Price per night in NGN (`formatPrice()`)
- Rating + review count
- "View Details" link → `/apartments/[id]`
- Hover: `shadow-lg` + image scale

### SearchBar — `SearchBar.tsx`

Two modes:

**Hero version (full):** Location, Check-in date, Check-out date, Guests — horizontal on desktop, stacked on mobile. Submits to `/apartments` with URL params.

**Compact version:** Shorter, used in the hero on mobile.

### FilterPanel — `FilterPanel.tsx`

Sidebar component on the Apartments listing page.

Filters:
- City (All / Lagos / Abuja / Port Harcourt / Enugu)
- Price range (min / max, NGN)
- Bedrooms (Any / 1 / 2 / 3 / 4+)
- Guests (Any / 1 / 2 / 4 / 6 / 8+)
- Sort by (Default / Price: Low–High / Price: High–Low / Rating)

Active filter indicator + Clear All button.

### ImageGallery — `ImageGallery.tsx`

- Grid layout: 1 large main image + smaller thumbnails
- Lightbox on click: full-screen overlay with prev/next navigation and close button
- Keyboard: ← → arrows, Escape to close
- Uses `next/image` with `fill` + proper `sizes`

### BookingSummary — `BookingSummary.tsx`

Sticky sidebar on the Apartment Details page.

- Check-in / Check-out date inputs
- Guest count selector
- Price breakdown: subtotal + 5% service fee
- Total in NGN
- "Reserve" button (Forest Green, full width)

### HeroSlideshow — `HeroSlideshow.tsx`

Client component used in the homepage hero.

- 5 high-quality Unsplash apartment images
- Auto-advances every 5 seconds
- Pauses on mouse hover
- Prev / Next arrow buttons (glassmorphism style)
- Dot indicators — active dot expands to a Soft Gold pill
- Smooth 1-second opacity crossfade transition between slides
- Dark overlay (`bg-charcoal/55`) applied above all slides for text readability

---

## Pages

All pages live in `frontend/src/app/`. Every page is responsive (mobile → tablet → desktop).

---

### Phase 1 — Foundation ✅

**Status:** Complete

**What was built:**
- Next.js 15 project initialised with App Router
- TypeScript strict mode configured (`tsconfig.json`)
- Tailwind CSS v4 installed and configured
- PostCSS configured with `@tailwindcss/postcss`
- ESLint configured with `next/core-web-vitals` + `next/typescript`
- Brand colours and font variables defined in `globals.css`
- `globals.css` base reset, scrollbar, focus ring, smooth transitions
- Root layout (`layout.tsx`) with Navbar and Footer wrappers
- `next.config.ts` with `remotePatterns` for Unsplash images
- Environment files: `.env.local` (frontend) and `.env` (backend)
- `.gitignore` covers `.env`, `.env.local`, `.next/`, `node_modules/`

**Key files created:**
```
frontend/
├── src/app/layout.tsx
├── src/app/globals.css
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── .env.local
└── .gitignore
```

**Environment variables (frontend):**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api/v1` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

---

### Phase 2 — Frontend UI ✅

**Status:** Complete

**What was built:**

#### Pages

**Homepage `/`**
- Hero section with `HeroSlideshow` (5 image slideshow, auto-advance, prev/next, dots)
- Hero content: tagline, headline "Find a Place That Feels Like Home.", description
- `SearchBar` component (location, check-in, check-out, guests)
- Stats row: 500+ Happy Guests · 50+ Apartments · 4 Cities
- Featured Apartments section (grid of 6 `ApartmentCard` components)
- Why Nestora section (4 feature cards: Verified, 24/7 Support, Secure Booking, Local Expertise)
- How It Works section (4-step process on Forest Green background)
- Popular Destinations section (4 city cards: Lagos, Abuja, Port Harcourt, Enugu)
- Testimonials section (5 guest reviews)
- CTA Banner (background image + overlay + two action buttons)

**Apartments Listing `/apartments`**
- URL params: `city`, `minPrice`, `maxPrice`, `bedrooms`, `guests`, `sortBy`
- Sidebar `FilterPanel` (city, price range, bedrooms, guests, sort)
- Responsive apartment card grid (1 → 2 → 3 columns)
- Empty state when no results match filters
- Active filter count indicator

**Apartment Details `/apartments/[id]`**
- Dynamic routes via `generateStaticParams()` for all 8 apartments
- `ImageGallery` with lightbox
- Full apartment info: title, location, description, stats, amenities grid
- Check-in/check-out times, house rules
- Sticky `BookingSummary` sidebar (dates, guests, price breakdown)

**About `/about`**
- Hero section with background image
- Who We Are section
- Mission and Vision cards
- Brand Values grid (6 values)
- Team section
- CTA banner

**Contact `/contact`**
- Contact info panel (email, phone, address, social links)
- Validated contact form (name, email, subject, message)
- Client-side validation with error states
- Success state after submission

**Login `/login`**
- Split layout (form left, image right)
- Email/phone + password
- Show/hide password toggle
- Remember Me checkbox
- Forgot Password link
- Link to Register

**Register `/register`**
- Full name, email, phone, password, confirm password
- Password strength indicator (Weak / Fair / Good / Strong)
- Show/hide password on both fields
- Terms & Conditions checkbox
- Link to Login

**404 Not Found `/not-found`**
- On-brand 404 page
- Back to Home link

#### Components created

| Component | File | Purpose |
|---|---|---|
| Navbar | `Navbar.tsx` | Responsive nav, transparent on hero, solid on scroll |
| Footer | `Footer.tsx` | Links, contact, social, copyright |
| Button | `Button.tsx` | 5 variants, 3 sizes, loading state |
| Input / Textarea / Select | `Input.tsx` | Accessible form elements |
| SectionHeading | `SectionHeading.tsx` | Eyebrow + title + description |
| ApartmentCard | `ApartmentCard.tsx` | Image, stats, price, link |
| SearchBar | `SearchBar.tsx` | Hero search, routes to /apartments |
| FilterPanel | `FilterPanel.tsx` | Sidebar filters + sort |
| ImageGallery | `ImageGallery.tsx` | Grid + lightbox |
| BookingSummary | `BookingSummary.tsx` | Dates, guests, price breakdown |
| HeroSlideshow | `HeroSlideshow.tsx` | Auto-advancing hero image carousel |

#### Sample data (`src/lib/data.ts`)

8 apartments across 4 Nigerian cities:

| ID | Title | City | Location | Price/night | Beds | Baths | Guests | Featured |
|---|---|---|---|---|---|---|---|---|
| 1 | Emerald Haven | Lagos | Lekki Phase 1 | ₦45,000 | 2 | 2 | 4 | ✅ |
| 2 | Sapphire Suite | Lagos | Victoria Island | ₦65,000 | 1 | 1 | 2 | ✅ |
| 3 | Golden Terrace | Abuja | Maitama | ₦80,000 | 3 | 3 | 6 | ✅ |
| 4 | Coral Nest | Lagos | Ikoyi | ₦38,000 | 1 | 1 | 2 | ❌ |
| 5 | Sunrise Residence | Port Harcourt | GRA Phase 2 | ₦35,000 | 2 | 2 | 4 | ✅ |
| 6 | Ivory Manor | Abuja | Asokoro | ₦150,000 | 4 | 4 | 8 | ✅ |
| 7 | Haven Court | Enugu | Independence Layout | ₦28,000 | 2 | 1 | 4 | ❌ |
| 8 | Azure Loft | Lagos | Oniru Estate | ₦30,000 | 1 | 1 | 2 | ❌ |

Price range: ₦28,000 – ₦150,000 per night.

5 guest testimonials from: Adaeze Okafor, Emeka Nwachukwu, Fatima Al-Hassan, Chukwudi Eze, Ngozi Adesanya.

#### TypeScript types (`src/types/index.ts`)

| Interface | Purpose |
|---|---|
| `Apartment` | Full apartment data shape |
| `SearchFilters` | Location, check-in, check-out, guests |
| `ApartmentFilters` | City, min/max price, bedrooms, guests, sortBy |
| `Testimonial` | Guest review data |
| `ContactFormData` | Contact form fields |
| `LoginFormData` | Login form fields |
| `RegisterFormData` | Registration form fields |

**Verification results:**
```
TypeScript:      0 errors
ESLint:          0 errors (2 warnings in config files only)
Next.js build:   ✓ 17 static pages generated
```

**Key files:**
```
frontend/src/
├── app/
│   ├── page.tsx                   # Homepage
│   ├── layout.tsx                 # Root layout
│   ├── globals.css                # Global styles + Tailwind v4 theme
│   ├── not-found.tsx              # 404 page
│   ├── about/page.tsx             # About Us
│   ├── apartments/page.tsx        # Apartments listing
│   ├── apartments/[id]/page.tsx   # Apartment details
│   ├── contact/page.tsx           # Contact
│   ├── login/page.tsx             # Login
│   └── register/page.tsx          # Register
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── SectionHeading.tsx
│   ├── ApartmentCard.tsx
│   ├── SearchBar.tsx
│   ├── FilterPanel.tsx
│   ├── ImageGallery.tsx
│   ├── BookingSummary.tsx
│   └── HeroSlideshow.tsx
├── lib/
│   └── data.ts                    # Sample apartments + testimonials
└── types/
    └── index.ts                   # TypeScript interfaces
```

---

### Phase 3 — Authentication ⏳ Pending

**Status:** Pending approval

**Planned:**
- Registration API integration
- Login API integration
- Logout
- Forgot password flow
- Password reset flow
- JWT token management (HTTP-only cookies)
- Protected routes
- Auth context / hook
- Admin role detection

**Files to create:**
```
frontend/src/
├── app/
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
├── hooks/
│   └── useAuth.ts
├── services/
│   └── auth.service.ts
└── context/
    └── AuthContext.tsx
```

---

### Phase 4 — Apartment Management ⏳ Pending

**Status:** Pending

**Planned:**
- Replace sample `data.ts` with real API calls
- `apartment.service.ts` — fetch apartments, fetch by ID, search
- Dynamic filtering connected to backend search API
- Loading and error states on listing + details pages
- Cloudinary image integration for uploaded apartment photos

**Files to create:**
```
frontend/src/services/
└── apartment.service.ts
```

---

### Phase 5 — Booking System ⏳ Pending

**Status:** Pending

**Planned:**
- Booking flow: dates → guest info → summary → payment
- Availability calendar on apartment details page
- `BookingForm` multi-step component
- Guest information form
- Booking summary page
- Booking API integration
- Double-booking prevention (UI disables booked dates)

**Files to create:**
```
frontend/src/
├── app/
│   ├── book/[id]/page.tsx
│   └── booking/[ref]/page.tsx     # Confirmation
├── components/
│   ├── BookingForm.tsx
│   └── AvailabilityCalendar.tsx
└── services/
    └── booking.service.ts
```

---

### Phase 6 — Paystack Payments ⏳ Pending

**Status:** Pending

**Planned:**
- Payment initialization API call
- Redirect to Paystack Checkout
- Payment verification on return
- Booking confirmation page
- Payment status display

**Environment variables needed:**
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (frontend — public key only)

---

### Phase 7 — Dashboards ⏳ Pending

**Status:** Pending

**Planned:**

**Customer dashboard `/dashboard`**
- Overview: upcoming stays, past stays
- My Bookings list
- Booking detail view
- Payment status
- Profile settings

**Admin dashboard `/admin`**
- Overview stats (apartments, bookings, revenue)
- Apartment management (add, edit, delete, publish)
- Image upload (Cloudinary)
- Booking management
- Availability / blocked dates
- Customer management

**Files to create:**
```
frontend/src/app/
├── dashboard/
│   ├── page.tsx
│   ├── bookings/page.tsx
│   └── profile/page.tsx
└── admin/
    ├── page.tsx
    ├── apartments/page.tsx
    ├── apartments/new/page.tsx
    ├── apartments/[id]/edit/page.tsx
    ├── bookings/page.tsx
    └── customers/page.tsx
```

---

### Phase 8 — Testing & Deployment ⏳ Pending

**Status:** Pending

**Planned:**

**Testing:**
- Unit tests for utility functions
- Component tests (React Testing Library)
- End-to-end tests for booking flow

**Deployment (Render):**
- Build command: `npm run build`
- Start command: `npm start`
- Environment variables configured in Render dashboard
- Production `NEXT_PUBLIC_API_URL` pointing to live backend

**Production environment variables:**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://nestora-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_APP_URL` | `https://nestora.onrender.com` |

---

## Run Commands

```bash
# Install dependencies
cd frontend
npm install

# Development server (http://localhost:3000)
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Production build
npm run build
```

---

## Technical Notes

- **Tailwind CSS v4** — config is CSS-based (`@theme {}` in `globals.css`). No `tailwind.config.ts`.
- **Next.js 15.3.9** — stable patched release. Avoid 15.5.x (known `/_not-found` build bug).
- **Google Fonts** — requires network access at build time. Currently using system font fallbacks. Swap back to `next/font/google` once network is available in the build environment.
- **Image domain** — `images.unsplash.com` is whitelisted in `next.config.ts` `remotePatterns`.
- **Static generation** — all 17 pages are statically generated at build time. Apartment detail pages use `generateStaticParams()`.
- **`"use client"`** — only applied where browser APIs are needed (Navbar scroll, HeroSlideshow timer, FilterPanel state, SearchBar, ImageGallery lightbox, BookingSummary, all auth forms).
