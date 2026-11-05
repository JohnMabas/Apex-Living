# Nestora

Nestora is a full-stack apartment booking platform. Its brand promise is *Your comfort, your space.* This repository contains the Phase 1 foundation and the Phase 2 frontend UI.

## Technology stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, ESLint, Lucide React
- Backend: Node.js, Express, TypeScript, Zod, Helmet, CORS, dotenv
- Database: PostgreSQL with Prisma ORM, designed for Aiven PostgreSQL

## Repository structure

```text
Nestora/
├── frontend/                 # Next.js application
│   ├── public/
│   └── src/
│       ├── app/              # App Router pages
│       │   ├── page.tsx            # Homepage (/)
│       │   ├── about/page.tsx      # About Us (/about)
│       │   ├── apartments/
│       │   │   ├── page.tsx        # Listing (/apartments)
│       │   │   └── [id]/page.tsx   # Details (/apartments/[id])
│       │   ├── contact/page.tsx    # Contact (/contact)
│       │   ├── login/page.tsx      # Login (/login)
│       │   └── register/page.tsx   # Register (/register)
│       ├── components/       # Reusable UI components
│       ├── lib/              # Sample data and utilities
│       ├── types/            # TypeScript types
│       └── ...
├── backend/                  # Express REST API
├── AGENTS.md
├── README.md
└── skills.md
```

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- PostgreSQL only when database-backed development begins

## Installation

Install dependencies separately for each application:

```bash
cd frontend
npm install

cd ../backend
npm install
```

Copy the example environment files before running either app:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

## Run the frontend

```bash
cd frontend
npm run dev
```

The development server is available at `http://localhost:3000`.

### Pages

| Route | Description |
| --- | --- |
| `/` | Homepage — hero, featured apartments, why us, destinations, testimonials, CTA |
| `/apartments` | Listing — search, filter by city/price/bedrooms/guests, sort |
| `/apartments/[id]` | Apartment details — gallery, amenities, booking summary |
| `/about` | About Us — mission, vision, values, team |
| `/contact` | Contact — form with frontend validation, contact info |
| `/login` | Sign in — email/phone + password, remember me |
| `/register` | Create account — full form with password strength indicator |

### Frontend checks

```bash
# Type check (TypeScript)
npm run typecheck

# Lint (ESLint)
npm run lint

# Production build
npm run build
```

## Run the backend

```bash
cd backend
npm run dev
```

The API listens at `http://localhost:5000` by default. Its Phase 1 health endpoint is:

```text
GET /api/v1/health
```

### Backend checks

```bash
npm run build
npm run test:health
```

## Database configuration

Prisma reads `DATABASE_URL` from `backend/.env`. Do not add a real connection string to version control.

For a local database:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/nestora?schema=public
```

For Aiven production PostgreSQL, use the connection string supplied by Aiven with `sslmode=verify-full`.

After setting a valid connection string:

```bash
cd backend
npm run prisma:generate
npm run db:test
```

Migration commands:

```bash
npm run prisma:migrate   # development: creates/applies a migration
npm run prisma:deploy    # applies existing migrations in deployment
```

## Environment variables

### Frontend

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Public base URL for the backend API |
| `NEXT_PUBLIC_APP_URL` | Public frontend URL |

### Backend

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production` |
| `PORT` | API server port |
| `DATABASE_URL` | PostgreSQL/Aiven connection string; never commit it |
| `FRONTEND_URL` | Single permitted frontend CORS origin |
| `JWT_SECRET` | Reserved for the authentication phase |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | Reserved for the payment phase |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Reserved for image uploads |

Only `NEXT_PUBLIC_*` values may be exposed to the browser. All remaining secrets must stay server-side.

## Phase status

| Phase | Description | Status |
| --- | --- | --- |
| Phase 1 | Foundation — project setup, tooling, base config | ✅ Complete |
| Phase 2 | Frontend UI — all public pages, components, sample data | ✅ Complete |
| Phase 3 | Authentication — registration, login, password reset | ⏳ Pending approval |
| Phase 4 | Apartment management — APIs, images, search | ⏳ Pending |
| Phase 5 | Booking system — availability, reservations | ⏳ Pending |
| Phase 6 | Paystack payments | ⏳ Pending |
| Phase 7 | Dashboards — customer and admin | ⏳ Pending |
| Phase 8 | Testing and deployment | ⏳ Pending |

## Phase 2 — Frontend UI

### Pages completed

- Homepage `/` — hero with search, featured apartments, why us, how it works, popular destinations (4 cities), testimonials, CTA banner
- Apartments Listing `/apartments` — search input, sidebar filter panel (city, price range, bedrooms, guests, sort), responsive card grid, empty state
- Apartment Details `/apartments/[id]` — image gallery with lightbox, stats, amenities, check-in times, house rules, sticky booking summary sidebar
- About Us `/about` — hero, who we are, mission/vision, values grid, team, CTA
- Contact `/contact` — contact info panel, validated form, success state
- Login `/login` — split layout, show/hide password, remember me, forgot password link
- Register `/register` — full form, password strength indicator, show/hide both password fields, terms checkbox

### Components created

- `Navbar` — responsive with mobile menu, scroll-aware style
- `Footer` — links, contact info, social icons, brand tagline
- `Button` — 5 variants (primary, secondary, outline, ghost, gold), 3 sizes, loading state
- `Input` / `Textarea` / `Select` — accessible form elements with label, error, and hint support
- `SectionHeading` — eyebrow + title + description, light/dark variants
- `ApartmentCard` — image, location, stats, price, view details link
- `SearchBar` — full hero version and compact version; routes to `/apartments` with URL params
- `FilterPanel` — city, price range, bedrooms, guests, sort; active filter indicator + clear all
- `ImageGallery` — grid layout with lightbox (prev/next/close)
- `BookingSummary` — date inputs, guest count, price breakdown (subtotal + 5% service fee), reserve button

### Sample data

8 apartments across Lagos (4), Abuja (2), Port Harcourt (1), Enugu (1) in `src/lib/data.ts`. Prices range from ₦28,000 to ₦150,000/night. 5 guest testimonials included.

### Verification results

```
TypeScript:  0 errors
ESLint:      0 errors, 2 warnings (in Next.js scaffolding config files only)
Next.js build: ✓ 17 static pages generated
```
# Apex-Living
# Apex-Living
# Apex-Living
# Apex-Living
