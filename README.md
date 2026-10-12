# Space of Founders

A verified, approval-only startup community for the world: founders, startups, investors and ecosystem partners from every country.
Next.js 15 (App Router) · Supabase (Postgres, Auth, Storage, Realtime) · Tailwind CSS · Vercel.

## How it is built

- **Security lives in the database.** Row Level Security on every table, column-level grants (clients can never write
  `role`, `verification_status`, counters or `is_verified`), and `SECURITY DEFINER` RPCs for every trust-changing action
  (`submit_application`, `review_application`, `request_connection`, ...). Role helpers are `SECURITY DEFINER` with a
  pinned `search_path`, so policies never recurse into `profiles`.
- **Defence in depth in the app.** Middleware (coarse guard) → route-group layouts (`requireMember` / `requireAdmin`) →
  Server Actions (Zod validation + session check) → RLS.
- **Canonical company identity.** Domains and LinkedIn URLs are normalised in SQL triggers and enforced with unique
  constraints; duplicates route to a claim workflow.
- **Privacy.** Member emails are not selectable by other users; verification evidence is in a private bucket and only
  reachable via short-lived signed URLs for admins; public pages read privacy-aware views.
- **No fake data.** Public stats are live counts that exclude `is_demo` rows; demo seeding is local-only.

## Run locally

Prerequisites: Node 20+, Docker Desktop.

```bash
npm install
npm run db:start          # starts local Supabase (Postgres, Auth, Storage, Realtime, Mailpit)
cp .env.example .env.local   # fill in the keys printed by `npx supabase status`
npm run dev               # http://localhost:3100
```

- Confirmation emails arrive in Mailpit: http://127.0.0.1:54324
- Supabase Studio: http://127.0.0.1:54323
- Optional demo data (local only, clearly labelled DEMO): `npm run seed`

### Create the first admin

Sign up and confirm your email in the app, then promote that account out-of-band:

```bash
npm run make-admin -- you@example.com
```

## Quality gates

| Command | What it checks |
|---|---|
| `npm run typecheck` / `npm run lint` | TypeScript strict + ESLint |
| `npm test` | Unit tests (normalisers) |
| `npm run db:test` | pgTAP tests of RLS and privilege rules |
| `npm run db:lint` | plpgsql static analysis of every function |
| `npm run test:integration` | Acceptance journeys against local Supabase as separate users |
| `npx playwright test` | Browser journey: signup → email confirm → application → admin approval → workspace |

After changing the schema: `npm run db:reset && npm run db:types`.

## Deploy

1. Create a Supabase project; apply migrations: `npx supabase db push --db-url "<connection string>"`.
2. In Supabase Auth settings set the **Site URL** to your production URL and add `https://<domain>/auth/callback` to the
   redirect allow-list. Configure SMTP (e.g. Resend); the built-in mailer is heavily rate-limited.
3. In Vercel set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only)
   and `NEXT_PUBLIC_SITE_URL`.
4. Promote your first admin with `npm run make-admin` pointed at the production URL/key.

## Before opening to the public

The privacy policy, terms and community guidelines in `src/app/(public)` are **drafts**. Have them reviewed by an
adviser, confirm GDPR retention periods and the operating entity, and check the DSA obligations for user-generated
content. The platform facilitates introductions only; it must not provide investment advice or handle funds.
