# Game Rules & Scoring — Valencia Pub Golf

Reference for understanding *why* a score is what it is, and explaining mechanics to the group.

---

## The core game

- **4 players, 9 stops** (stop 1 = practice round at Café de las Horas, doesn't count)
- All players drink the **same drink** at each stop
- Each player **secretly commits** ("melder") to a number of sips before drinking
- After all commit, numbers are **revealed simultaneously**, group average is computed
- Players are scored **only** on the **distance penalty from the average** + commitment penalty, then **multiplied by the stop's `score_multiplier`** (1.0 for stops 1–6, 1.5/2.0/2.5 for stops 7/8/9). The number of sips itself contributes **zero points**.

**Lowest total after stop 9 wins** (like real golf).

---

## Scoring formula

```
hole_total = ROUND( (distance_penalty + commitment_penalty) × score_multiplier )
```

The committed sips number has **no direct point value** — it's only used to compute the group average and the distance penalty.

### Distance penalty table

| `|committed - average|` | Penalty |
|---|---|
| ≤ 0.5 | +0 (spot on) |
| > 0.5, ≤ 1.0 | +1 |
| > 1.0, ≤ 1.5 | +2 |
| > 1.5, ≤ 2.0 | +3 |
| > 2.0 | +4 |

### Commitment penalty

| Outcome | Penalty |
|---|---|
| Tapped ✓ "Klarede det" | +0 |
| Tapped ✗ "Fejlede (+III)" | **+3** |
| Didn't tap either before 15-min timer expired | **+3** (auto-fail) |

### Strategic implication

- Sips don't score — only the **distance from the group average** does
- The sweet spot is **exactly the average** (distance ≤ 0.5 → 0 penalty)
- Volume only matters via straf-shots (drinking penalties at extremes), not points

### Example (group avg = 4.0, no multiplier)

| Committed | Distance | Penalty | **Total** |
|---|---|---|---|
| 1 | 3.0 | +4 | 4 + straf-shot! |
| 2 | 2.0 | +3 | 3 |
| 3 | 1.0 | +1 | **1** |
| 4 | 0.0 | +0 | **0** ← winner |
| 5 | 1.0 | +1 | **1** |
| 6 | 2.0 | +3 | 3 |

---

## Late-game score multiplier

The last three stops have weighted scoring — late-game mistakes hurt more.

| Stop | Bar | Multiplier | Example (raw 4 → final) |
|---|---|---|---|
| 7 | Cava stop | × 1.5 | 4 → 6 |
| 8 | Marina Beach Club Restaurant | × 2.0 | 4 → 8 |
| 9 | Mya | × 2.5 | 4 → 10 |

Stored as `holes.score_multiplier` (NUMERIC). Default 1.0 for all other holes.

---

## Penalty shots (extra physical drinks, ZERO points)

Triggered automatically by the app at **commit time**. **Multiple rules can stack** — each triggered rule = one extra physical shot before the group moves on.

| Trigger | Reason code |
|---|---|
| Player commits **max sips** (per-hole max) | `'max'` |
| Player commits **1** (just nipping) | `'min'` |
| Player commits **same number as their previous hole** | `'same_as_last'` |

All triggered reasons are stored in `scores.penalty_shot_reasons` as a TEXT[]. The number of physical shots = `cardinality(penalty_shot_reasons)`.

**Stacking examples:**

| Scenario | Reasons | Shots |
|---|---|---|
| Commit 1 on hole 3 | `['min']` | 1 |
| Commit 1 on hole 4 (after 1 on hole 3) | `['min','same_as_last']` | **2** |
| Commit max on hole 4 (after max on hole 3) | `['max','same_as_last']` | **2** |
| Commit 4 on hole 4 (after 4 on hole 3) | `['same_as_last']` | 1 |
| Commit 4 on hole 2 (no prior) | `[]` | 0 |

**Exceptions**:
- `'same_as_last'` only triggers from hole 3 onwards (`currentHoleId > 2`)
- `'max'` and `'min'` apply on every hole including practice (hole 1)

---

## Meal waypoints

The route includes **2 meal breaks** that appear as waypoints in the route timeline. They're informational only — not drinking stops, not scored.

| ID | Name | After Stop |
|---|---|---|
| 1 | 🍽 Frokost · Casa Vani | 3 |
| 2 | 🍽 Middag · Restaurant Secret | 6 |

---

## Drinking phase — 15-minute timer

When all players commit, a **15-minute countdown** starts immediately (visible during the reveal and drinking phases).

During the drinking phase:
- A **sip counter** lets each player tap once per sip to track progress (informational only)
- Tap ✓ **"Klarede det"** when you finish your drink → no penalty
- Tap ✗ **"Fejlede (+III)"** to self-report failure → +3 penalty
- **Not tapping either button before the timer hits 0:00** → auto-fail (+3)

Honor system. The group polices each other.

---

## Practice round (stop 1)

- Café de las Horas — Agua de Valencia (max 8 sips)
- Players go through the full flow (commit, reveal, drink, tap ✓ when done) to learn the mechanics
- **Points DO NOT count** — `is_practice = true` excludes hole 1 from leaderboard sums
- `'same_as_last'` does NOT trigger (only from hole 3 onwards)

---

## The route

| Stop | Name | Drink | Max sips | Multiplier |
|---|---|---|---|---|
| 1 ★ | Café de las Horas | Agua de Valencia | 8 | 1.0 |
| 2 | Botanista Bar | Signature cocktail | 10 | 1.0 |
| 3 | Atenea Sky Rooftop | Gin & tonic / cocktail | 12 | 1.0 |
| 4 | Lokal bar (Carmen) | Øl (0,5L) | 6 | 1.0 |
| 5 | Russafa bar | Tinto de verano | 7 | 1.0 |
| 6 | L'eixample bar | Shot + lille øl | 5 | 1.0 |
| 7 | Cava stop | Cava glas | 6 | **×1.5** |
| 8 | Marina Beach Club Restaurant | Mojito / longdrink | 12 | **×2.0** |
| 9 | Mya | Vodka Red Bull / gin & tonic | 10 | **×2.5** |

★ = practice round

---

## Final scoreboard awards (after stop 9)

Computed client-side from raw scores:

| Award | Criterion |
|---|---|
| 🥇🥈🥉 Top 3 | Lowest total scores |
| 🎯 Sniper | Most spot-ons (distance ≤ 0.5) |
| 💀 Bunderen | Most commitment-fails (✗) |
| 🥃 Shame Champion | Most penalty shots (sum of array lengths) |
| 📐 Mr. Consistent | Lowest variance in committed sips |

---

## App phase flow per stop

```
COMMIT → REVEAL → DRINK → SCORE → (next stop)
```

1. **COMMIT**: Stepper screen, lock in ("melder"). Other players show as "X af Y har meldt" (no names — prevents strategic waiting). Live preview of penalty rules that would trigger. **15-min drink timer is set the moment the last player commits.**
2. **REVEAL**: All numbers shown simultaneously. Average + per-player penalty shot list. Timer is already counting down.
3. **DRINK**: 15-min countdown visible. Sip counter active (informational). Tap ✓ when done or ✗ to self-report failure. Timer expiry = auto-fail (+3).
4. **SCORE**: Hole breakdown + live leaderboard.
5. **Next**: Any player can advance to stop X+1.

After stop 9 → final scoreboard with awards.

---

## Host notes (Emil-only)

Both `holes.host_notes` and `waypoints.host_notes` contain anecdotes shown only when the logged-in player's name is `Emil`. Other players see nothing different. Purely a UI gate — data is in the public anon-readable tables.
