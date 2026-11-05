# NESTORA — PROJECT SKILLS & DEVELOPMENT GUIDE

**Project:** Nestora  
**Tagline:** Your comfort, your space.  
**Project Type:** Full-stack Apartment Booking Website  
**Status:** Development  
**Reference Website:** https://fraliaconferencehall.benuesema.com/

---

# 1. PROJECT OVERVIEW

Nestora is a modern apartment booking platform that allows customers to discover apartments, view apartment details, check availability, make reservations and pay securely online.

The platform should provide a simple and comfortable booking experience.

The primary objective is to build a beautiful, professional and user-friendly apartment booking website inspired by the structure and experience of the Fralia Conference Hall website.

However, Nestora must have its own branding, content, apartment-related features and booking experience.

### Main objectives

- Help customers find suitable apartments easily.
- Make apartment reservations simple.
- Allow customers to pay securely using Paystack.
- Allow administrators to manage apartments and bookings.
- Provide a beautiful experience across mobile, tablet and desktop.
- Maintain strong backend security.
- Keep the application simple, maintainable and scalable.

### Target users

1. Customers looking for apartments.
2. Travellers looking for short stays.
3. Professionals looking for accommodation.
4. Families looking for comfortable apartments.
5. Administrators managing apartments and reservations.

---

# 2. BRAND IDENTITY

## Brand name

Nestora

## Tagline

Your comfort, your space.

## Brand personality

- Modern.
- Welcoming.
- Elegant.
- Trustworthy.
- Comfortable.
- Professional.

## Brand colours

Use these colours consistently throughout the application.

| Colour | Hex code | Usage |
|---|---|---|
| Forest Green | #173D32 | Primary colour |
| Warm Ivory | #F4EBDD | Background |
| Soft Gold | #C69B65 | Accent |
| Charcoal | #252B28 | Main text |
| White | #FFFFFF | Cards and surfaces |

## Typography

- Playfair Display: Headings.
- Inter: Body text, buttons and forms.

## Logo

Create a simple, memorable Nestora logo using a house or home-inspired symbol alongside the Nestora wordmark.

Avoid complicated logo designs.

---

# 3. DESIGN SYSTEM AND UI/UX SKILLS

This is one of the most important parts of Nestora.

The website must look beautiful, consistent and easy to use.

## Visual direction

Use a premium, minimalist apartment booking design.

The visual experience should include:

- Soft and faded colours.
- Muted backgrounds.
- Subtle image overlays.
- Soft shadows.
- Elegant typography.
- Generous whitespace.
- Clean layouts.
- Beautiful apartment photography.
- Subtle transitions.
- Consistent spacing.
- Rounded cards and buttons.

## Faded visual appearance

ALL website pages must follow the same soft, faded visual style.

Apply this consistently to:

- Homepage.
- About page.
- Apartments page.
- Apartment details.
- Booking pages.
- Authentication pages.
- Customer dashboard.
- Admin dashboard.
- Contact page.

Use:
- Soft ivory backgrounds.
- Muted green accents.
- Slightly desaturated photography where appropriate.
- Light overlays on hero images.
- Subtle borders.
- Soft shadows.
- Low-contrast decorative elements.

IMPORTANT:

The faded style must not reduce readability.

Keep:
- Text clearly readable.
- Buttons distinguishable.
- Important information visible.
- Form fields accessible.
- Prices easy to identify.
- Booking actions prominent.

Do not apply opacity to entire page containers or important text.

Do not make the interface look disabled or washed out.

## UI/UX principles

1. Keep navigation simple.
2. Make booking actions easy to find.
3. Avoid overcrowded pages.
4. Use consistent buttons and forms.
5. Make apartment photography prominent.
6. Use clear labels.
7. Provide helpful validation messages.
8. Display loading indicators.
9. Display useful empty states.
10. Make every page responsive.

## Responsive design

Support:
- Mobile phones.
- Tablets.
- Laptops.
- Desktop monitors.

Mobile users must have an equally comfortable booking experience.

---

# 4. TECHNOLOGY STACK

## Frontend

- Next.js.
- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- React.
- Lucide React icons.

## Backend

- Node.js.
- Express.js.
- TypeScript.
- REST API.

## Database

- PostgreSQL.
- Prisma ORM.
- Aiven PostgreSQL hosting.

## Payments

- Paystack.

## Image storage

- Cloudinary.

## Deployment

- Render for frontend.
- Render for backend.
- Aiven for PostgreSQL.

Keep frontend and backend separate.

---

# 5. WEBSITE PAGES AND FEATURES

## 5.1 Homepage

The homepage is the main introduction to Nestora.

It must include:

### Navigation
- Nestora logo.
- Home.
- About.
- Apartments.
- Contact.
- Sign In.
- Book Now.

### Hero section
- Beautiful apartment background image.
- Headline: "Find a Place That Feels Like Home."
- Short introduction.
- Apartment search form.

### Apartment search

Allow customers to search using:
- Location.
- Check-in date.
- Check-out date.
- Number of guests.

### Featured apartments

Display selected apartments with:
- Apartment image.
- Name.
- Location.
- Bedrooms.
- Bathrooms.
- Guest capacity.
- Price.
- View Details button.

### Other homepage sections
- Why choose Nestora?
- How booking works.
- Popular apartments.
- Customer testimonials.
- Frequently asked questions.
- Final booking CTA.
- Footer.

Keep the homepage visually attractive without making it unnecessarily long.

## 5.2 About page

Include:
- Introduction to Nestora.
- Company mission.
- Company vision.
- Why customers should choose Nestora.
- Customer experience.
- Booking CTA.

## 5.3 Apartments page

Display available apartments in a clean grid.

Each apartment card must contain:
- Main photograph.
- Apartment name.
- Location.
- Bedrooms.
- Bathrooms.
- Guest capacity.
- Price per night.
- View Details button.

### Search and filters

Implement:
- Location search.
- Minimum price.
- Maximum price.
- Bedroom filter.
- Guest capacity filter.
- Sorting by price.

Display appropriate loading, error and empty states.

Only published apartments should be publicly visible.

## 5.4 Apartment details page

Each apartment must have its own dynamic page.

Include:
- Apartment image gallery.
- Apartment title.
- Location.
- Description.
- Bedrooms.
- Bathrooms.
- Guest capacity.
- Amenities.
- House rules.
- Check-in information.
- Check-out information.
- Pricing.
- Availability calendar.
- Booking button.

The booking section must be easy to find.

## 5.5 Booking page

Make booking simple and understandable.

Booking process:

**Step 1: Stay details**
- Check-in.
- Check-out.
- Number of guests.

**Step 2: Guest information**
- First name.
- Last name.
- Email.
- Phone number.
- Special requests.

**Step 3: Booking summary**
- Apartment.
- Number of nights.
- Price per night.
- Additional charges, if applicable.
- Total amount.

**Step 4: Payment**
- Continue to Paystack.
- Complete payment.
- Return to Nestora.

**Step 5: Confirmation**
- Booking reference.
- Apartment information.
- Stay dates.
- Payment status.
- Total amount.

Do not confirm unpaid bookings.

Prevent overlapping reservations and handle temporary booking holds safely.

## 5.6 Authentication pages

Implement:
- Registration.
- Login.
- Forgot password.
- Password reset.

Keep authentication pages minimal and consistent with the Nestora branding.

## 5.7 Customer dashboard

Include:
- Overview.
- My bookings.
- Upcoming stays.
- Previous stays.
- Booking details.
- Payment status.
- Profile settings.

Customers must only access their own bookings and information.

## 5.8 Admin dashboard

Build a simple and professional dashboard.

### Overview
Display:
- Total apartments.
- Total bookings.
- Pending bookings.
- Confirmed bookings.
- Total revenue.

### Apartment management
- Add apartment.
- Edit apartment.
- Delete or archive apartment.
- Upload apartment images.
- Update prices.
- Manage amenities.
- Publish or unpublish apartments.

### Booking management
- View bookings.
- View customer details.
- Check payment status.
- Manage booking status.
- Cancel reservations according to policy.

### Availability management
- View reserved dates.
- Block dates.
- Manage apartment availability.

### Customer management
- View customers.
- View customer bookings.
- Manage customer accounts.

Only authorized administrators can access these features.

## 5.9 Contact page

Include:
- Contact form.
- Business email.
- Phone number.
- Business location.
- Social media links.
- Contact information.

Contact details must be configurable.

---

# 6. BACKEND DEVELOPMENT SKILLS

Build a clean Express.js backend.

Use modular architecture.

Responsibilities:

- Authentication.
- User management.
- Apartment management.
- Apartment search.
- Availability management.
- Booking management.
- Payment processing.
- Admin authorization.
- Contact form submissions.

Use:
- Controllers.
- Routes.
- Services.
- Middleware.
- Validators.
- Database models.

Implement centralized error handling and consistent API responses.

Use `/api/v1` for API routes.

---

# 7. DATABASE SKILLS

Use PostgreSQL with Prisma ORM.

Main database models:

1. User.
2. Apartment.
3. ApartmentImage.
4. Amenity.
5. ApartmentAmenity.
6. Booking.
7. Payment.

Use proper relationships, indexes, unique constraints and foreign keys.

### User

Store:
- ID.
- First name.
- Last name.
- Email.
- Phone.
- Password hash.
- Role.
- Account status.
- Created date.

### Apartment

Store:
- ID.
- Title.
- Slug.
- Description.
- Location.
- Price per night.
- Price per month, if applicable.
- Bedrooms.
- Bathrooms.
- Guest capacity.
- Images.
- Amenities.
- Publication status.

### Booking

Store:
- ID.
- Booking reference.
- Customer ID.
- Apartment ID.
- Check-in date.
- Check-out date.
- Number of guests.
- Number of nights.
- Total amount.
- Booking status.
- Payment status.

### Payment

Store:
- ID.
- Booking ID.
- Payment reference.
- Amount.
- Currency.
- Payment provider.
- Payment status.
- Payment date.

Use appropriate money representations and database transactions.

Prevent overlapping confirmed reservations at database level.

---

# 8. PAYSTACK PAYMENT SKILLS

Integrate Paystack using its official API.

Currency: NGN.

Payment flow:

1. Customer submits booking.
2. Backend validates the booking.
3. Backend calculates the amount.
4. Backend creates a pending booking.
5. Backend initializes Paystack.
6. Customer completes payment.
7. Backend verifies payment directly with Paystack.
8. Backend confirms the booking.
9. Customer receives confirmation.

Required endpoints:

- POST /api/v1/payments/initialize
- GET /api/v1/payments/verify/:reference
- POST /api/v1/payments/webhook

Security requirements:
- Keep secret keys on the backend.
- Validate webhook signatures using HMAC SHA512.
- Use raw request body for webhook signature verification.
- Validate transaction reference.
- Validate transaction amount.
- Validate currency.
- Prevent duplicate payment processing.
- Do not trust frontend payment results.
- Confirm reservations only after successful verification.

Use test credentials during development.

---

# 9. SECURITY SKILLS

Implement essential production security.

- Hash passwords using bcrypt or Argon2id.
- Use secure HTTP-only cookies.
- Implement role-based authorization.
- Protect admin routes.
- Validate inputs with Zod.
- Use Helmet.
- Configure CORS correctly.
- Rate-limit sensitive endpoints.
- Protect against SQL injection.
- Protect against unauthorized resource access.
- Validate uploaded images.
- Keep secrets in environment variables.
- Use HTTPS in production.
- Verify Paystack payments on the backend.
- Use TLS with certificate verification for Aiven.

Never expose:
- Database passwords.
- JWT secrets.
- Paystack secret keys.
- Cloudinary API secrets.

---

# 10. IMAGE AND CONTENT SKILLS

Apartment photography is important to the Nestora experience.

Use high-quality, realistic apartment images.

Preferred photography:
- Modern living rooms.
- Beautiful bedrooms.
- Clean kitchens.
- Elegant bathrooms.
- Apartment exteriors.
- Interior details.

Use Cloudinary for uploaded apartment images.

Implement:
- Multiple images per apartment.
- Main image selection.
- Image optimization.
- Image deletion.
- Upload validation.

Avoid:
- Broken image links.
- Unrelated stock photos.
- Excessively large images.
- Inconsistent photography styles.

Use meaningful image descriptions for accessibility.

---

# 11. PROJECT STRUCTURE

Create the following structure:

Nestora/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── services/
│       ├── types/
│       └── utils/
│
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── types/
│   └── tests/
│
├── skills.md
├── AGENTS.md
└── README.md

Keep the structure simple. Only introduce additional folders when they are genuinely needed.

---

# 12. DEPLOYMENT SKILLS

## Aiven

Use Aiven PostgreSQL as the production database.

Requirements:
- Configure database connection.
- Configure SSL/TLS.
- Verify certificates.
- Use Prisma migrations.
- Protect database credentials.

## Render

Deploy two separate services:

1. Frontend — Next.js.
2. Backend — Express.js.

Configure:
- Build commands.
- Start commands.
- Environment variables.
- Health checks.
- CORS.
- Production URLs.

## Environment variables

Backend:

NODE_ENV=
PORT=
DATABASE_URL=
FRONTEND_URL=
JWT_SECRET=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_CALLBACK_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

Frontend:

NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_URL=

Never expose private credentials through frontend variables.

---

# 13. DEVELOPMENT PHASES

Develop Nestora in the following order.

### PHASE 1 — Foundation
- Create project folders.
- Initialize Next.js.
- Initialize Express.js.
- Configure TypeScript.
- Install Tailwind CSS.
- Configure Prisma.
- Connect PostgreSQL.
- Create documentation.

### PHASE 2 — UI/UX DEVELOPMENT
- Create the design system.
- Build navigation.
- Build homepage.
- Build About page.
- Build Apartments page.
- Build Apartment Details page.
- Build Contact page.
- Make all pages responsive.
- Apply the consistent faded visual style.

### PHASE 3 — AUTHENTICATION
- Registration.
- Login.
- Logout.
- Password reset.
- Secure authentication.
- Admin authorization.

### PHASE 4 — APARTMENT MANAGEMENT
- Apartment APIs.
- Apartment database.
- Image uploads.
- Search and filters.
- Amenities.
- Availability.

### PHASE 5 — BOOKING SYSTEM
- Date selection.
- Guest information.
- Price calculation.
- Booking creation.
- Double-booking protection.
- Booking history.

### PHASE 6 — PAYSTACK
- Payment initialization.
- Checkout redirect.
- Payment verification.
- Webhooks.
- Booking confirmation.

### PHASE 7 — DASHBOARDS
- Customer dashboard.
- Admin dashboard.
- Apartment management.
- Booking management.
- Payment management.

### PHASE 8 — TESTING AND DEPLOYMENT
- Test important workflows.
- Fix errors.
- Review security.
- Optimize performance.
- Deploy frontend and backend to Render.
- Connect Aiven.
- Configure Paystack production credentials.

---

# 14. AI CODING AGENT INSTRUCTIONS

The coding agent must follow these rules.

1. Read this skills.md before starting development.
2. Read AGENTS.md if available.
3. Follow the project branding consistently.
4. Prioritize excellent UI/UX.
5. Make every page responsive.
6. Apply the faded visual design consistently.
7. Keep the application user-friendly.
8. Avoid unnecessary complexity.
9. Use reusable components.
10. Use real backend APIs.
11. Do not build fake functionality.
12. Never hardcode secrets.
13. Validate important user inputs.
14. Test important booking and payment operations.
15. Keep code clean and readable.
16. Document important implementation decisions.
17. Fix errors before moving to the next phase.
18. Do not skip development phases.

### Phase completion requirements

At the end of every phase:

- Explain what was completed.
- List files created or modified.
- Explain how to run the application.
- Run relevant tests.
- Report outstanding issues.
- Wait for approval before proceeding.

Do not claim that a feature works unless it has been implemented and tested.

---

# 15. FINAL PROJECT GOAL

Nestora should become a beautiful and reliable apartment booking platform.

A customer should be able to:

1. Visit the website.
2. Browse apartments.
3. View apartment details.
4. Select available dates.
5. Enter their information.
6. Review the booking.
7. Pay through Paystack.
8. Receive booking confirmation.
9. View their booking in their dashboard.

An administrator should be able to:

1. Log in securely.
2. Add apartments.
3. Upload apartment images.
4. Update prices.
5. Manage availability.
6. View reservations.
7. Manage customers.
8. Track payments.

**MOST IMPORTANT:** Build a simple, elegant, user-friendly application with strong security and reliable booking functionality. Do not sacrifice usability by adding unnecessary features.

The final product should feel like a real premium apartment booking business, not a generic software dashboard.

END OF NESTORA SKILLS GUIDE.