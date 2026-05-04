# Valencia Pub Golf ⛳

9 stop · 4 spillere · 1 dag i Valencia.

Real-time multiplayer pub-golf med hemmelige meldte antal slurke, distance-baseret scoring, og frokost + middag undervejs.

Tilpasset fra [lukashoerup/athens-pub-golf](https://github.com/lukashoerup/athens-pub-golf).

---

## ⚡ Quick Reference

| Hvad | URL / ID |
|---|---|
| **Live app** (deles med spillere) | https://valencia-pub-golf-app.vercel.app ← opdater efter deploy |
| **Supabase SQL Editor** | https://supabase.com/dashboard/project/fiucpbakevqzytbphghy/sql/new |
| **Supabase project ID** | fiucpbakevqzytbphghy |
| **Vercel project** | `valencia-pub-golf-app` |
| **GitHub** | https://github.com/EmiloStabilos/valencia-pub-golf|
| **Default branch** | `main` (auto-deploy til Vercel ved push) |


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
4. **Claude sender SQL kommando** til Supabase SQL Editor jf. docs/ADMIN.MD

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
