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
| `/login` | Customer Google sign-in plus host/admin email or phone + password |
| `/register` | Create a customer account with Google |
| `/auth/callback` | Supabase PKCE callback; verifies the Google session and syncs the customer |

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

## Aiven PostgreSQL configuration

Nestora uses PostgreSQL through Prisma. The database URL and Aiven CA certificate are backend-only: never use `NEXT_PUBLIC_` variables, commit `.env`, or add a certificate to this repository.

1. In the [Aiven Console](https://console.aiven.io/), create a PostgreSQL service and select a suitable plan.
2. Open the service overview and obtain the host, port, database, username, and password (or use Aiven's generated Service URI).
3. Download the service CA certificate from Aiven's connection information and save it locally, for example `backend/certs/ca.pem`. This directory is ignored by Git.
4. Copy `backend/.env.example` to `backend/.env`, then configure:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
DATABASE_CA_CERT_PATH=./certs/ca.pem
```

In production, Nestora upgrades the configured URL to `sslmode=verify-full` and passes the CA path as `sslrootcert`; both values are required. Certificate verification is never disabled. Local development may use a separate local PostgreSQL URL and omit `DATABASE_CA_CERT_PATH`.

After setting a valid connection string and CA certificate:

```bash
cd backend
npm run prisma:generate
npm run db:test
npm run test:health
```

Migration commands:

```bash
npm run prisma:migrate   # local development: creates/applies a migration
npm run prisma:deploy    # production: applies committed migrations only
```

Do not use `prisma db push` as a substitute for migrations, and never reset a production database. Configure `DATABASE_URL` and `DATABASE_CA_CERT_PATH` as protected backend environment variables in the backend hosting platform before running `npm run prisma:deploy`.

`GET /api/v1/health` returns API status, database status, environment, and a timestamp. It returns HTTP 503 without revealing connection details when PostgreSQL is unavailable.

## Environment variables

### Frontend

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Public base URL for the backend API |
| `NEXT_PUBLIC_APP_URL` | Public frontend URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL used for customer Google sign-in |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key; safe for the browser. Never use a service-role key here. |

### Backend

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production` |
| `PORT` | API server port |
| `DATABASE_URL` | PostgreSQL/Aiven connection string; never commit it |
| `DATABASE_CA_CERT_PATH` | Filesystem path to Aiven's CA certificate; required for verified production TLS |
| `FRONTEND_URL` | Single permitted frontend CORS origin |
| `JWT_SECRET` | Signs host/admin and legacy customer sessions |
| `SUPABASE_URL` | Supabase project URL used to verify customer access tokens |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key used server-side to verify tokens |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | Paystack payment keys |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image upload credentials |

Only `NEXT_PUBLIC_*` values may be exposed to the browser. All remaining secrets must stay server-side.

## Customer authentication with Google (Supabase)

Nestora customers sign in with Google through Supabase Auth. Supabase is the identity provider only; customer, booking, payment and email records remain in the Aiven PostgreSQL database through Prisma.

### How it works

1. The browser starts Google OAuth with Supabase and returns to `/auth/callback`.
2. The callback exchanges the PKCE code for a Supabase session.
3. The backend verifies the Supabase access token directly with Supabase Auth, then creates or updates the Nestora customer record keyed by `supabaseUserId`.
4. Customer API requests send `Authorization: Bearer <supabase access token>`. Host and admin routes continue to use the HTTP-only `nestora_token` JWT cookie.
5. If an existing Nestora account already uses the Google email, the customer must sign in to that existing account and use **Connect Google** on the account page. Accounts are never silently merged.

### Supabase and Google Cloud setup

1. Create a Supabase project.
2. In Google Cloud Console, configure an OAuth consent screen and create a **Web application** OAuth client.
3. Add the Supabase callback as an authorized redirect URI:
   `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
4. In Supabase, open **Authentication → Providers → Google**, enable it, and paste the Google Client ID and Client Secret.
5. In Supabase **Authentication → URL Configuration**, set the Site URL to the frontend origin and add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://<FRONTEND_DOMAIN>/auth/callback`
6. Copy the Supabase project URL and publishable/anon key into the frontend and backend environment variables shown above.
7. Apply the committed migration with `npm run prisma:deploy` once the Aiven database is reachable.
8. Sign in with a real Google account to verify the complete flow. Do not claim Google sign-in is working until this test passes.

The Supabase service-role key must never be placed in the frontend or backend environment used by this flow.

### Authentication checks

```bash
cd backend
npm run test:auth
npm run test:guest-bookings

cd ../frontend
npm run typecheck
npm run lint
npm run build
```

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
- Login `/login` — Google customer sign-in plus email/phone + password for hosts and admins
- Register `/register` — Google-only customer account creation with secure profile sync

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
