# Admin Recipes — Valencia Pub Golf

Ready-to-paste SQL for fixing common in-game issues during the trip.

**Run via Supabase MCP** (`execute_sql` on project `fiucpbakevqzytbphghy`) **OR** paste into SQL Editor:
`https://supabase.com/dashboard/project/fiucpbakevqzytbphghy/sql/new`

> **For Claude reading this**: When the user describes a problem, identify the closest recipe below, fill in the variables (player name, hole number, etc.), and either run it directly (MCP mode) or respond with the SQL block + one-sentence explanation. Don't lecture. Emil is on a phone, possibly drunk. Be terse.

---

## ⚡ Cheat sheet

| Player names | Hole IDs | Phase values | Penalty reasons (TEXT[]) |
|---|---|---|---|
| `Emil` `Søren` `Frederik` `Ruben` | 1–9 | `'committing'` `'reveal'` `'drinking'` `'scoring'` | `'max'` `'min'` `'same_as_last'` |

**Stop name → ID quick lookup:**
| ID | Name | Drink | Max | Mult |
|---|---|---|---|---|
| 1 ★ | Café de las Horas | Agua de Valencia | 8 | 1.0 |
| 2 | Botanista Bar | Signature cocktail | 10 | 1.0 |
| 3 | Atenea Sky Rooftop | Gin & tonic / cocktail | 12 | 1.0 |
| 4 | Lokal bar (Carmen) | Øl (0,5L) | 6 | 1.0 |
| 5 | Russafa bar | Tinto de verano | 7 | 1.0 |
| 6 | L'eixample bar | Shot + lille øl | 5 | 1.0 |
| 7 | Cava stop | Cava glas | 6 | **1.5** |
| 8 | Marina Beach Club Restaurant | Mojito / longdrink | 12 | **2.0** |
| 9 | Mya | Vodka Red Bull / gin & tonic | 10 | **2.5** |

★ = practice round, points don't count

---

## R1: Wrong commit value

> "Søren mente 4 slurke, ikke 5, på hul 5"

```sql
UPDATE scores
SET committed_sips = 4
WHERE player_id = (SELECT id FROM players WHERE name = 'Søren')
  AND hole_id = 5;
```

⚠️ Only do this BEFORE the reveal phase. After reveal, fixing it silently changes the average and everyone's score. Better to use **R5** (reset hole) if it matters.

---

## R2: Wrong commitment-check (clicked ✗ by mistake)

> "Frederik trykkede ❌ ved en fejl"

```sql
UPDATE scores
SET completed = true
WHERE player_id = (SELECT id FROM players WHERE name = 'Frederik')
  AND hole_id = 7;
```

Reverse direction (changing ✓ to ✗):
```sql
UPDATE scores SET completed = false
WHERE player_id = (SELECT id FROM players WHERE name = 'Frederik')
  AND hole_id = 7;
```

Reset to unanswered (null = player can tap again, timer still running):
```sql
UPDATE scores SET completed = null
WHERE player_id = (SELECT id FROM players WHERE name = 'Frederik')
  AND hole_id = 7;
```

The +3 commitment penalty is calculated on-the-fly from this flag — no need to touch any score column.

---

## R3: Add a missing score (player never committed)

> "Vi glemte at logge Emil på hul 4 — han meldte 3"

```sql
INSERT INTO scores (player_id, hole_id, committed_sips, completed, penalty_shot, penalty_shot_reason, penalty_shot_reasons)
VALUES (
  (SELECT id FROM players WHERE name = 'Emil'),
  4,                       -- hole_id
  3,                       -- committed_sips
  true,                    -- completed (true=drank, false=fail+3, null=not yet)
  false,                   -- penalty_shot (legacy bool)
  null,                    -- penalty_shot_reason (legacy primary)
  ARRAY[]::text[]          -- penalty_shot_reasons (canonical)
);
```

If the player triggered penalty rules manually (e.g. they did commit max), set the array:
```sql
penalty_shot_reasons = ARRAY['max']::text[]
penalty_shot = true
penalty_shot_reason = 'max'
```

---

## R4: Force advance the phase

> "Phase er stuck på 'reveal' — skub til drinking"

```sql
UPDATE game_state
SET phase = 'drinking'
WHERE id = 1;
```

Valid phases: `committing`, `reveal`, `drinking`, `scoring`. Realtime will sync to all phones immediately.

---

## R5: Reset a hole completely (replay it)

> "Vi fucked hul 8 op, lad os gøre det om"

```sql
DELETE FROM scores WHERE hole_id = 8;
UPDATE game_state SET current_hole = 8, phase = 'committing' WHERE id = 1;
```

Wipes all 4 commits + completed flags + penalty_shots for that hole, sends everyone back to commit screen. Realtime syncs all phones instantly.

---

## R6: Skip to a specific hole

> "Vi springer frem til hul 7"

```sql
UPDATE game_state
SET current_hole = 7, phase = 'committing'
WHERE id = 1;
```

Doesn't delete prior scores. If you need a clean slate for skipped holes:
```sql
DELETE FROM scores WHERE hole_id IN (5, 6);
```

---

## R7: DNF a player for the rest of the trip

> "Ruben giver op — DNF ham på resten"

```sql
INSERT INTO scores (player_id, hole_id, committed_sips, completed, penalty_shot, penalty_shot_reason, penalty_shot_reasons)
SELECT
  (SELECT id FROM players WHERE name = 'Ruben'),
  h.id,
  h.max_sips,            -- max sips = expensive base score
  false,                 -- failed commitment = +3 each hole
  false,
  null,
  ARRAY[]::text[]
FROM holes h
WHERE h.id >= (SELECT current_hole FROM game_state WHERE id = 1)
  AND h.is_practice = false
ON CONFLICT (player_id, hole_id) DO UPDATE
SET committed_sips = EXCLUDED.committed_sips,
    completed = EXCLUDED.completed;
```

DNFs them on current and all future real holes. Score takes a beating, which is fair.

---

## R8: Undo "Next Stop" click

> "Vi trykkede ved en fejl videre fra hul 5 til hul 6, gå tilbage"

```sql
UPDATE game_state
SET current_hole = 5, phase = 'scoring'
WHERE id = 1;
```

Existing hole 5 scores are untouched. The app will redisplay them.

---

## R9: Manually mark/unmark a penalty shot

> "Emil skulle have haft et straf-shot men det trigrede ikke"

Reason codes: `'max'` (committed max sips for hole), `'min'` (committed 1), `'same_as_last'` (same as previous hole).

**Add a single penalty:**
```sql
UPDATE scores
SET penalty_shot = true,
    penalty_shot_reason = 'max',
    penalty_shot_reasons = ARRAY['max']::text[]
WHERE player_id = (SELECT id FROM players WHERE name = 'Emil')
  AND hole_id = 6;
```

**Stack multiple penalties (e.g. min + same_as_last = 2 shots):**
```sql
UPDATE scores
SET penalty_shot = true,
    penalty_shot_reason = 'min',
    penalty_shot_reasons = ARRAY['min', 'same_as_last']::text[]
WHERE player_id = (SELECT id FROM players WHERE name = 'Emil')
  AND hole_id = 6;
```

**Remove all penalties:**
```sql
UPDATE scores
SET penalty_shot = false,
    penalty_shot_reason = null,
    penalty_shot_reasons = ARRAY[]::text[]
WHERE player_id = (SELECT id FROM players WHERE name = 'Emil')
  AND hole_id = 6;
```

---

## R9b: Drink timer fixes

The drinking phase has a **10-min deadline** set the moment the first player answers ✓/✗. Anyone who hasn't tapped either button when it expires auto-fails (+3).

**Give everyone more time** (extend by N minutes):
```sql
UPDATE game_state
SET drink_deadline_at = drink_deadline_at + INTERVAL '5 minutes'
WHERE id = 1;
```

**Cancel the timer** (no auto-fail):
```sql
UPDATE game_state SET drink_deadline_at = NULL WHERE id = 1;
```

**Restart the timer fresh from now** (full 10 min from this moment):
```sql
UPDATE game_state SET drink_deadline_at = NOW() + INTERVAL '10 minutes' WHERE id = 1;
```

---

## R10: Nuke and restart the entire game

> "Vi starter helt forfra"

```sql
DELETE FROM scores;
UPDATE game_state SET current_hole = 1, phase = 'committing' WHERE id = 1;
```

Clean slate. Players keep their accounts; all scores wiped.

---

## R11: Replace a stop venue mid-game (we can't get in!)

> "Vi kan ikke komme ind på Russafa bar, vi går til en anden bar i stedet"

```sql
UPDATE holes
SET name = 'El Botànic',
    drink = 'Cerveza local',
    max_sips = 7
WHERE id = 5;
```

⚡ **Realtime:** All 4 phones receive the new venue info instantly. No app refresh needed.

If you only need to change ONE field:
```sql
UPDATE holes SET drink = 'Sangria' WHERE id = 5;
UPDATE holes SET max_sips = 6 WHERE id = 5;
UPDATE holes SET score_multiplier = 1.5 WHERE id = 5;
```

---

## R11b: Add a brand-new stop mid-trip

> "Vi fandt et fedt sted — tilføj det som hul 10"

The app dynamically reads total hole count from the DB.

```sql
INSERT INTO holes (id, name, drink, max_sips, is_practice, score_multiplier)
VALUES (
  10,
  'Bonus bar',
  'House special',
  6,
  false,
  1.0
);
```

⚡ All 4 phones see the new stop count immediately.

---

## R11c: Skip a stop without deleting it

> "Vi springer hul 6 over — der er for langt"

**Don't DELETE the hole** — that would cascade-delete any scores from it. Just advance past it:

```sql
-- If currently on hole 5 scoring, jump straight to hole 7 committing
UPDATE game_state SET current_hole = 7, phase = 'committing' WHERE id = 1;
```

The hole still exists in the DB; no scores are written for it. The leaderboard ignores holes with no scores.

---

## R12: Update host_notes (Emil-only anecdotes)

```sql
UPDATE holes
SET host_notes = 'Din sjove anekdote her...'
WHERE id = 3;
```

Shown only when player.name = 'Emil'. Other players see nothing different.

---

## R13: Edit a waypoint (meal break)

```sql
UPDATE waypoints
SET description = 'Ny beskrivelse...'
WHERE id = 1;  -- 1 = Frokost · Casa Vani (after stop 3), 2 = Middag · Restaurant Secret (after stop 6)
```

**Add a new waypoint:**
```sql
INSERT INTO waypoints (id, name, district, after_hole_id, display_order)
VALUES (3, '🍹 Ekstra pause', 'Russafa', 5, 1);
```

**Remove a waypoint:**
```sql
DELETE FROM waypoints WHERE id = 3;
```

---

## R14: Change a player's name (typo)

```sql
UPDATE players SET name = 'Søren' WHERE name = 'Soren';
```

⚠️ If you change `Emil` to anything else, the host_notes UI gating breaks (it's hardcoded to check for the literal string `'Emil'`).

---

## R15: Adjust late-game multipliers

> "Vi vil have hul 7 til at tælle dobbelt i stedet for 1.5×"

```sql
UPDATE holes SET score_multiplier = 2.0 WHERE id = 7;
UPDATE holes SET score_multiplier = 1.0 WHERE id = 8;  -- remove multiplier
```

Default is 1.0 (no multiplier). Currently: hole 7 = 1.5, hole 8 = 2.0, hole 9 = 2.5. Decimal values OK.

---

## Diagnostic queries

### "Hvad er stillingen lige nu?"
```sql
WITH hole_avg AS (
  SELECT hole_id, AVG(committed_sips)::numeric AS avg_sips
  FROM scores WHERE committed_sips IS NOT NULL GROUP BY hole_id
),
scored AS (
  SELECT s.player_id, s.committed_sips, s.completed, s.penalty_shot_reasons,
    h.score_multiplier,
    CASE
      WHEN ABS(s.committed_sips - ha.avg_sips) <= 0.5 THEN 0
      WHEN ABS(s.committed_sips - ha.avg_sips) <= 1.0 THEN 1
      WHEN ABS(s.committed_sips - ha.avg_sips) <= 1.5 THEN 2
      WHEN ABS(s.committed_sips - ha.avg_sips) <= 2.0 THEN 3
      ELSE 4
    END AS dp,
    CASE WHEN s.completed = false THEN 3 ELSE 0 END AS cp
  FROM scores s
  JOIN hole_avg ha ON ha.hole_id = s.hole_id
  JOIN holes h ON h.id = s.hole_id
  WHERE s.committed_sips IS NOT NULL AND h.is_practice = false
)
SELECT p.name,
  COALESCE(SUM(ROUND((dp + cp) * score_multiplier))::int, 0) AS total,
  COALESCE(SUM(cardinality(penalty_shot_reasons))::int, 0) AS shots,
  COUNT(*) FILTER (WHERE completed = false) AS fails
FROM players p LEFT JOIN scored s ON s.player_id = p.id
GROUP BY p.id, p.name ORDER BY total ASC;
```

### "Hvad har folk meldt på det aktuelle hul?"
```sql
SELECT p.name, s.committed_sips, s.completed,
  s.penalty_shot_reasons, cardinality(s.penalty_shot_reasons) AS shots
FROM scores s
JOIN players p ON p.id = s.player_id
WHERE s.hole_id = (SELECT current_hole FROM game_state WHERE id = 1)
ORDER BY p.display_order;
```

### "Vis hele ruten"
```sql
SELECT id, name, drink, max_sips, score_multiplier, district FROM holes ORDER BY id;
```

### "Vis alle waypoints"
```sql
SELECT id, name, after_hole_id, district FROM waypoints ORDER BY after_hole_id, display_order;
```

---

## Notes for Claude

- **Always echo back the player name + hole + action** in plain English BEFORE the SQL block, e.g. "Setting Frederik's hole 6 ✓:". This lets Emil catch mistakes before pasting.
- **Don't combine recipes** unless the user clearly asks for it. Smaller queries = easier to verify what changed.
- **Realtime side-effects**: Any UPDATE/INSERT to `scores`, `game_state`, `holes`, `waypoints` instantly pushes to all 4 phones. Mention this if it might surprise the user.
- **Practice round = hole 1**, `is_practice = true`. Scores there don't count toward leaderboard. The leaderboard query already excludes it.
- The DB has a UNIQUE constraint on `(player_id, hole_id)` — re-inserting a score for the same player/hole will fail unless you use `ON CONFLICT`.
- **Penalty shot stacking**: ALWAYS write the canonical `penalty_shot_reasons` array. The legacy `penalty_shot_reason` (single string) is kept for backward compat but the array is the source of truth.
- **UI terminology**: The UI says "melder/meldt" (Danish) but DB columns are `committed_sips`, phase `committing` — don't change DB field names.
