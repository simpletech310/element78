# Element 78

A mobile-first PWA + marketing site for Element 78 — a luxury-urban West-Coast wellness brand for Black women (Compton + ATL, expanding). Built from a Claude Design handoff: 21 mobile app screens + a single-scroll marketing site, all sharing one brand system.

## Stack

- **Next.js 14 App Router** + TypeScript + Tailwind 3
- **Supabase** — Postgres + Auth (email/password), SSR via `@supabase/ssr`
- **Zustand** — cart store, persisted to localStorage
- **PWA** — manifest + Apple touch icons, installable, standalone-mode chrome
- **Vercel** — deploy target

## Run locally

```bash
pnpm install
cp .env.local.example .env.local   # fill in Supabase keys (optional — fallback data ships built-in)
pnpm dev                            # http://localhost:3000
pnpm build                          # production build
```

The app runs without Supabase configured — `src/lib/data/queries.ts` falls back to the static seed in `src/lib/data/fallback.ts`.

## Routes

### Public marketing site
- `/` — single-scroll hero / pillars / membership / signature product / IG grid / footer
- `/locations` — multi-city map + waitlist
- `/login`, `/join` — auth

### App (PWA)
- `/home` — daily ritual, streak ribbon, AI Studio rail, next class, crew pulse
- `/train`, `/train/player` — AI studio + active player with countdown ring
- `/gym`, `/gym/classes`, `/gym/classes/[id]` — membership card + class browse + spot picker
- `/shop`, `/shop/[slug]`, `/shop/gallery` — catalog + product detail + lookbook
- `/cart`, `/checkout` — cart + checkout stub
- `/crew`, `/crew/timeline` — community feed
- `/trainers`, `/trainers/[slug]` — browse + profile
- `/activity` — dual-ring weekly goal + 14-day streak + PRs
- `/music` — playlist player (visual)
- `/app-icon` — brand mark variants

## Supabase setup

1. Create a project at supabase.com and copy the URL + anon key into `.env.local`.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor.
3. Run `supabase/seed.sql` to populate locations / trainers / classes / products / posts.
4. Auth → Settings: **disable email confirmation** (demo mode).

The schema includes RLS policies (public read for catalog/content, owner-only writes), a `handle_new_user` trigger that creates a profile row on signup, and idempotent seed data.

## Asset pipeline

Source photography lives outside the repo (`Assets/` and `Assets/Shop/`, gitignored). On a fresh clone, run:

```bash
pnpm copy-assets
```

This populates `public/assets/` (site photos) and `public/products/` (product photos). The committed `public/` already contains them so the repo deploys clean.

## Deploy

Push to GitHub and import the repo into Vercel. Set the four env vars from `.env.local.example`. No build configuration needed — Vercel detects Next.js automatically.

## Brand tokens

Defined in `src/app/globals.css` (`:root`) and mirrored in `tailwind.config.ts`:

- Ink `#0A0E14`, Bone `#F2EEE8`, Sky `#8FB8D6`, Electric `#4DA9D6`, Rose `#E8B5A8`
- Display: Anton · Body: Inter Tight · Mono: JetBrains Mono · Serif: Playfair Display italic
