# Valencia Pub Golf ⛳

8 stops · 4 spillere · 1 dag i Valencia.

Real-time multiplayer pub-golf med hemmelige commits, distance-baseret scoring, og frokost + middag undervejs.

Tilpasset fra [lukashoerup/athens-pub-golf](https://github.com/lukashoerup/athens-pub-golf).

---

## ⚡ Quick Reference

| Hvad | URL / ID |
|---|---|
| **Live app** (deles med spillere) | https://valencia-pub-golf-app.vercel.app ← opdater efter deploy |
| **Supabase SQL Editor** | https://supabase.com/dashboard/project/\<your-project-id\>/sql/new |
| **Supabase project ID** | `<your-project-id>` — udfyld efter setup |
| **Vercel project** | `valencia-pub-golf-app` |
| **GitHub** | `<your-github-username>/valencia-pub-golf` |
| **Default branch** | `main` (auto-deploy til Vercel ved push) |

**Spillere (4):** Emil (host), Søren, Frederik, Ruben

**Rute:**

| Tid | Stop | Bar | Drink |
|---|---|---|---|
| 11:00 | I ★ | La Cola del Pez | Cerveza Artesana |
| 11:45 | II | Insólito | Vermut |
| 12:30 | III | Mientras Tanto | Cóctel |
| 13:00 | 🍽 | Frokost: Casa Vani | — |
| 14:30 | IV | Luna de Valencia Rooftop | Sangria |
| 15:15 | V | El Mirador de Only YOU | G&T |
| 16:00 | VI ×1.5 | Nuvolc | Cerveza |
| 18:00 | 🍽 | Middag: Restaurant Secret | — |
| 19:30 | VII ×2.0 | Bukowski Craft Beer | IPA |
| 20:15 | VIII ×2.5 | Olhöps | Shot |

---

## Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS
- **Database + Realtime:** Supabase (5 tables: `players`, `holes`, `waypoints`, `scores`, `game_state`)
- **Hosting:** Vercel (Hobby tier, auto-deploy fra GitHub)
- **Auth:** Ingen — anon-key bruges, FK + UNIQUE constraints sikrer integritet

---

## Under turen — fix ting via Claude på mobil

Hvis noget går galt under turen:

1. **Åbn [claude.ai](https://claude.ai)** på mobilen, ny chat.
2. **Første besked:**
   > Læs https://raw.githubusercontent.com/\<your-github-username\>/valencia-pub-golf/main/CLAUDE.md og hjælp mig med Valencia Pub Golf-spillet.
3. **Beskriv problemet** på dansk: *"Frederik trykkede ❌ ved en fejl på hul 4"*
4. **Claude returnerer ready-to-paste SQL** → åbn SQL Editor → paste → Run.

### Bookmark inden afrejse

- 📋 **Supabase SQL Editor**: URL fra Quick Reference ovenfor
- 🌐 **Live app**: URL fra Quick Reference ovenfor
- 🤖 **claude.ai**: log ind på telefonen

---

## Setup

```bash
cp .env.local.example .env.local
# Udfyld NEXT_PUBLIC_SUPABASE_URL og NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

1. Opret nyt Supabase-projekt → kør `supabase/schema.sql` i SQL Editor
2. Kopiér URL + anon key til `.env.local`
3. Deploy til Vercel med de samme env vars

---

## Dokumentation (read in order)

| Fil | Indhold |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Entry-point primer for Claude under turen |
| [`docs/ADMIN.md`](docs/ADMIN.md) ⭐ | SQL recipes for typiske in-game fixes |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Schema reference + diagnostiske queries |
| [`docs/GAME_RULES.md`](docs/GAME_RULES.md) | Scoring formula, phase flow, penalty rules |
| [`supabase/schema.sql`](supabase/schema.sql) | Kanonisk DDL — kør for at recreate DB fra scratch |
