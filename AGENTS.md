# Nestora development rules

## Source of truth

- Read and follow `skills.md` before beginning any work.
- The product name is **Nestora**; its tagline is **Your comfort, your space.** Do not use an older brand name.
- Complete work in the development phases specified in `skills.md`. Do not begin a later phase without approval.

## Code standards

- Use TypeScript strict mode. Avoid `any`; prefer explicit, narrow types.
- Keep functions focused, names descriptive, and modules small.
- Format code consistently with the repository tooling. Do not introduce dependencies without a clear need.
- Keep frontend and backend independently runnable.

## Folder rules

- Frontend routes belong in `frontend/src/app`; reusable UI belongs in `frontend/src/components`.
- Frontend API clients belong in `frontend/src/services`; shared helpers go in `lib` or `utils`.
- Backend HTTP routes delegate to controllers; business logic belongs in services; input schemas belong in validators.
- Keep database access in Prisma-backed configuration/services, not route handlers.

## Security requirements

- Never commit credentials, tokens, passwords, certificates, or `.env` files.
- Keep private keys and payment secrets on the backend only.
- Validate external input with Zod, use parameterized Prisma queries, and preserve Helmet and restrictive CORS settings.
- Require TLS certificate verification for production Aiven PostgreSQL URLs.
- Implement authentication, authorization, payment verification, uploads, and rate limiting only in their designated phases.

## Phase rules

- Phase 1 is foundation only: do not add product UI, listings, authentication, booking, payments, or dashboards.
- Add tests and update documentation with each completed phase.
- Do not claim an external service is connected unless a real connection test has passed.
