# LaunchGate 360 (V1.2 / reporting V1.3)

Production-grade OEM new vehicle launch executive control: Next.js, TypeScript, Tailwind, shadcn/ui, Supabase Postgres + Auth, deployable to Vercel.

## Quick start (DEMO)

```bash
cd launchgate-360
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard). The **DEMO** banner indicates seed-derived counts — not live booking confirmations.

## Supabase setup

1. Create a Supabase project and enable Email auth.
2. Apply migrations:

   ```bash
   supabase db push
   # or run SQL from supabase/migrations in order, then supabase/seed.sql
   ```

3. Create `profiles` rows for auth users and `launch_memberships` with roles:
   - **executive** — read + optional `can_approve_budget` / `can_approve_reports`
   - **pmo_admin** — launch master, assign owners
   - **department_editor** — `assigned_domains` array (never trust UI; RLS enforces)

4. Set env vars in Vercel:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `LAUNCHGATE_DEMO_MODE=false`

## Architecture

| Area | Route |
| --- | --- |
| Executive dashboard | `/dashboard` |
| Stakeholders & invitations | `/operations/stakeholders` |
| Other operations workspaces | `/operations/*` (stubs; schema ready) |
| Settings (launch date) | `/settings` |
| Executive PDF | `GET /api/reports/executive` |

KPIs are computed in `src/lib/kpi/aggregate.ts` from transactional tables. Executive PDFs are generated server-side with PDFKit (two A4 pages). Immutable snapshots live in `executive_report_snapshots`; period movement compares to the **previous reporting-period snapshot** (shows **N/A** until a baseline exists).

Reporting cadence: monthly until T-60, weekly T-60 → launch, live-day on/after launch date.

## Tests

```bash
npm test
```

## Deploy (Vercel)

Set root directory to `launchgate-360`, add Supabase env vars, and deploy. Ensure migrations and DEMO-labeled seed are applied only to non-production environments.

## Note on reference UI

The repository root `index.html` is an unrelated portfolio scaffold. LaunchGate UI follows the spec: navy / off-white / teal enterprise cards. If you have a separate **index.html V1.2** reference file, add it to the repo and we can align spacing and components further.
