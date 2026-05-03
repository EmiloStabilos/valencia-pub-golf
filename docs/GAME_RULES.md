# Game Rules & Scoring — Valencia Pub Golf

Reference for understanding *why* a score is what it is, and explaining mechanics to the group.

---

## The core game

- **4 players, 8 stops** (stop 1 = practice walk, doesn't count)
- All players drink the **same drink** at each stop
- Each player **secretly commits** to a number of sips before drinking
- After all commit, numbers are **revealed simultaneously**, group average is computed
- Players are scored **only** on the **distance penalty from the average** + commitment penalty, then **multiplied by the stop's `score_multiplier`** (1.0 for most stops, 1.5/2.0/2.5 for the last three). The number of sips itself contributes **zero points**.

**Lowest total after stop VIII wins** (like real golf).

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

| What you tap | Penalty |
|---|---|
| ✓ "Klarede det" | +0 |
| ✗ "Fejlede" | **+3** |

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
| VI | Nuvolc | × 1.5 | 4 → 6 |
| VII | Bukowski | × 2.0 | 4 → 8 |
| VIII | Olhöps | × 2.5 | 4 → 10 |

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
| 1 | 🍽 Frokost · Casa Vani | III |
| 2 | 🍽 Middag · Restaurant Secret | VI |

---

## Commitment check (the +3 lever)

After drinking, each player gets two buttons:
- ✓ "Klarede det" — no penalty
- ✗ "Fejlede (+III)" — 3 points added to this hole's score (before multiplier)

Honor system. The group polices each other.

---

## Practice round (stop 1)

- La Cola del Pez, Plaça de Sant Jaume
- Players go through the full flow (commit, reveal, drink, ✓/✗) to learn the mechanics
- **Points DO NOT count** — `is_practice = true` excludes hole 1 from leaderboard sums
- `'same_as_last'` does NOT trigger (only from hole 3 onwards)

---

## Final scoreboard awards (after stop VIII)

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

1. **COMMIT**: Stepper screen, lock in. Other players show as "X af Y har committed" (no names — prevents strategic waiting). Live preview of penalty rules that would trigger.
2. **REVEAL**: All numbers shown simultaneously. Average + per-player penalty shot list.
3. **DRINK**: ✓/✗ commitment-check buttons.
4. **SCORE**: Hole breakdown + live leaderboard.
5. **Next**: Any player can advance to stop X+1.

After stop 8 → final scoreboard with awards.

---

## Host notes (Emil-only)

Both `holes.host_notes` and `waypoints.host_notes` contain anecdotes shown only when the logged-in player's name is `Emil`. Other players see nothing different. Purely a UI gate — data is in the public anon-readable tables.
