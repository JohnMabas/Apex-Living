-- Supabase customer authentication
-- Customers may sign in with Google through Supabase. OAuth-only accounts do
-- not have a Nestora password, so passwordHash becomes nullable.
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "users"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "country" TEXT,
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "supabaseUserId" TEXT;

CREATE UNIQUE INDEX "users_supabaseUserId_key" ON "users"("supabaseUserId");
