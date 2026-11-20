# Deploy LaunchGate 360 to Vercel

## 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Run migrations in order from `supabase/migrations/`.
3. Apply `supabase/seed.sql` **only** on non-production (DEMO launch data).
4. Run `supabase/migrations` through `20260325120003_auth_profile_trigger.sql` so new Auth users get a `profiles` row.
5. **Authentication → Providers**: enable Email (and confirm signup policy matches your org).
6. **Authentication → URL configuration**:
   - **Site URL**: `https://<your-production-domain>`
   - **Redirect URLs**: add  
     `https://<your-production-domain>/auth/callback`  
     and preview URLs if needed, e.g.  
     `https://*.vercel.app/auth/callback`

## 2. Users and memberships (production)

1. Create users in **Authentication → Users** (or invite executives).
2. Copy each user’s UUID from the users table.
3. Edit and run SQL from `supabase/seed-production-memberships.sql.example` to insert `launch_memberships` (three executives, PMO admin, department editors).
4. Roles are enforced in **RLS** — never rely on UI-only role selectors.

For a **production launch**, create a real row in `launches` (without `is_demo`) instead of using the DEMO launch UUID.

## 3. Vercel project

1. Import the GitHub repository.
2. Set **Root Directory** to `launchgate-360`.
3. Framework preset: **Next.js** (see `vercel.json`).
4. **Environment variables** (Production):

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `LAUNCHGATE_DEMO_MODE` | `false` |

   Optional Preview deployments can set `LAUNCHGATE_DEMO_MODE=true` if you want demo data without wiring memberships.

5. Deploy. Confirm `/login` shows email/password and `/dashboard` requires auth.

## 4. Post-deploy checks

- Sign in as an executive with `can_approve_reports` → download **Executive Report** PDF.
- Sign in as a department editor → only assigned domains allow writes (RLS).
- PMO admin → can update launch settings (launch date) when wired to Supabase update actions.
- Run `npm test` in CI or locally before promoting releases.

## 5. Local production-like run

```bash
cd launchgate-360
cp .env.example .env.local
# Set Supabase URL, anon key, LAUNCHGATE_DEMO_MODE=false
npm run build && npm start
```
