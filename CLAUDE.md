# Valencia Pub Golf — Claude context primer

> **You are reading this because Emil has asked you to help fix something in the Valencia Pub Golf app, probably from his phone, probably mildly drunk, in Valencia. Be terse and helpful. Don't lecture.**

---

## ⚡ QUICK REFERENCE — all the URLs and IDs you'll need

| What | Where |
|---|---|
| **Live app** (share with players) | https://valencia-pub-golf.vercel.app |
| **Supabase SQL Editor** (paste-and-run) | https://supabase.com/dashboard/project/fiucpbakevqzytbphghy/sql/new |
| **Supabase project ID** | `fiucpbakevqzytbphghy` (region eu-west-1, name "AthenApp") |
| **Vercel project name** | `valencia-pub-golf` (EmiloStabilos personal Hobby team) |
| **GitHub repo** | `EmiloStabilos/valencia-pub-golf` (**public** — fetch docs directly) |
| **Raw doc URLs** | `https://raw.githubusercontent.com/EmiloStabilos/valencia-pub-golf/main/<file>` |
| **Default branch** | `main` (auto-deploys to Vercel on push) |

If you have **Supabase MCP** connected (tool name pattern `mcp__*__execute_sql`), run SQL directly against project `fiucpbakevqzytbphghy`. If not, output ready-to-paste SQL that Emil pastes into the SQL Editor on his phone.

---

## What this app is

A real-time multiplayer pub-golf scoring webapp for **4 players** playing **9 stops** across Valencia over 1 day. Stop 1 is a practice round — points don't count.

- **Stack**: Next.js 15 (App Router) + Supabase (Postgres + Realtime, 4 tables) + Tailwind, hosted on Vercel
- **Anon-key auth** — the app uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel env vars; no user-level auth. The anon role has full read/write access by design.
- **Realtime tables**: `scores`, `game_state`, `holes`, `waypoints` — UPDATEs broadcast to all 4 phones instantly.

---

## How you help during the trip

### Mode A — Supabase MCP available
You can run SQL directly. Project ID: `fiucpbakevqzytbphghy`.

1. Emil describes a problem ("Frederik trykkede ❌ ved en fejl på hul 6")
2. Read [`docs/ADMIN.md`](docs/ADMIN.md) for the closest recipe
3. **Run the SQL via `execute_sql`** against project `fiucpbakevqzytbphghy`
4. **Echo back what you did** in plain English so Emil can verify
5. Don't ask permission for routine fixes — Emil wants autonomous behavior. Do confirm before destructive ops on multiple holes (e.g. "this will reset 3 holes — proceed?").

### Mode B — No Supabase MCP

1. Read [`docs/ADMIN.md`](docs/ADMIN.md) for the closest recipe
2. Respond with **ready-to-paste SQL** + a one-line description
3. Emil pastes into the SQL Editor URL above on his phone

### Mode C — Code fix needed
If the app itself is broken (UI bug, crash, wrong behaviour):
1. Edit the relevant file in `C:\Users\emilr\OneDrive\Documents\Valencia Pub Golf\`
2. `git add` + `git commit` + `git push origin main`
3. Vercel auto-deploys in ~1 min

---

## Read these in order

1. **[`docs/ADMIN.md`](docs/ADMIN.md)** ⭐ — copy-paste SQL recipes for in-game fixes (player wrongly clicked, replace a stop, reset a hole, etc.)
2. **[`docs/DATABASE.md`](docs/DATABASE.md)** — full schema (4 tables), diagnostic queries, leaderboard SQL
3. **[`docs/GAME_RULES.md`](docs/GAME_RULES.md)** — scoring math, phase flow, penalty rules, multipliers, waypoints

If a problem doesn't match a recipe in ADMIN.md, fall back to DATABASE.md to write custom SQL.

---

## Critical rules for any SQL you generate

- ✅ Always reference players by **name** via subquery: `(SELECT id FROM players WHERE name = 'Frederik')` — never UUIDs
- ✅ Always echo the action in plain English **before** the SQL block, e.g. "Setting Frederik's hole 6 ✓:"
- ✅ Mention if the change will broadcast to all 4 phones (any UPDATE on `scores`, `game_state`, `holes`, `waypoints` will)
- ✅ For penalty shot reasons, use the array column: `penalty_shot_reasons TEXT[]`. Valid values: `'max'`, `'min'`, `'same_as_last'`. Legacy `'8'` may exist.
- ❌ Don't combine multiple recipes into one query unless explicitly asked
- ❌ Don't compute or insert score totals — the app calculates them on-the-fly from raw data via `lib/scoring.ts`
- ❌ Don't touch `players.id` or `holes.id`, or insert new rows in `game_state`
- ❌ Don't suggest building admin UIs, Telegram bots, etc. — Emil chose the SQL-recipe workflow deliberately

---

## State machine cheat sheet

```
committing → reveal → drinking → scoring → (next hole, current_hole++) → committing
```

- `committing`: players locking in sips. Auto-advances to `reveal` when all 4 commit.
- `reveal`: numbers shown, average computed. Manual advance to `drinking`.
- `drinking`: ✓/✗ commitment-check active. Auto-advances to `scoring` when all 4 answer.
- `scoring`: shows hole results + leaderboard. Manual advance to next hole.

A phase is "stuck" if Realtime didn't fire — fix with `UPDATE game_state SET phase = '...' WHERE id = 1`.

---

## Key features (so you don't suggest things that already exist)

- **Score multipliers**: stops 7/8/9 have ×1.5/×2.0/×2.5 (column `holes.score_multiplier`)
- **Stacking penalty shots**: `scores.penalty_shot_reasons TEXT[]` — multiple rules can trigger per commit. E.g. committing 1 twice = `['min','same_as_last']` = 2 shots.
- **Cultural waypoints**: `waypoints` table for sights between drinking stops; rendered in route timeline
- **Host notes**: `holes.host_notes` and `waypoints.host_notes` contain anecdotes shown ONLY when player.name = 'Emil'
- **Dynamic hole count**: app reads count from DB; adding a 10th stop "just works" via INSERT
- **Route timeline reveal logic**: future stops show name + district but DRINK is hidden until arrival
- **History tab secret-protection**: pending commits on the current hole are masked with 🔒 from other players until reveal
- **UI terminology**: "melder/meldt" (Danish card-game term) is used in the UI — DB fields are still `committed_sips`, `committing` phase etc.

---

## Tone

Emil is on a phone. Possibly drunk. He needs:
- Short response
- SQL block at the top (or confirmation that you ran it)
- One sentence of context if needed
- No "I'd be happy to help! Let me first..." preamble
