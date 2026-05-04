# Valencia Pub Golf — Design System

The entire visual theme is controlled by **one block of CSS custom properties** in `app/globals.css`. Edit there to retheme everything.

---

## Token map (`app/globals.css` `:root`)

| Variable | Current value | Used for |
|---|---|---|
| `--cobalt` | `#4A9CC8` | Primary CTAs, header bar, azulejo bg, progress dots |
| `--cobalt-soft` | `#5BAAD9` | Button active state |
| `--cobalt-deep` | `#2E7AAF` | Button shadow |
| `--limestone` | `#FFFEF8` | Page background, player rows |
| `--limestone-light` | `#FFFFFF` | Cards, modals, manage-players panel |
| `--limestone-dark` | `#FFF5C8` | Player number badge bg, table headers (faint gold wash) |
| `--limestone-stepper` | `#EEF5FB` | Stepper button bg, commit-phase empty dots |
| `--gold` | `#F5C400` | Accent stripes, tile border, route dots, TileRule, gold rules |
| `--gold-soft` | `#FFD740` | Italic display text, winner badge |
| `--terracotta` | `#CC2200` | Danger labels, tile border, final scoreboard italic title |
| `--terracotta-dark` | `#991A00` | (reserved) |
| `--sangria` | `#8B1A3A` | (reserved) |
| `--olive` | `#3A6820` | Success button, good score color |
| `--olive-dark` | `#254510` | Success button shadow |
| `--wine` | `#8B1A1A` | Error state, bad score color, danger button |
| `--wine-dark` | `#5A0A0A` | Danger button shadow |
| `--ink` | `#2A0A06` | Primary text |
| `--ink-secondary` | `#5A2010` | Secondary text |
| `--ink-muted` | `#8A5030` | Labels, sub-text |
| `--ink-faint` | `#C0906A` | Disabled / struck-through text |
| `--rule` | `#D4AC30` | All borders and dividers |

### RGB channel twins (required for Tailwind opacity modifiers)

Every color used with a Tailwind opacity modifier (e.g. `bg-gold/30`, `rgb(var(--cobalt-rgb) / 0.25)`) needs a matching `--x-rgb` var:

| Variable | Value |
|---|---|
| `--cobalt-rgb` | `74 156 200` |
| `--gold-rgb` | `245 196 0` |
| `--rule-rgb` | `212 172 48` |
| `--olive-rgb` | `58 104 32` |
| `--wine-rgb` | `139 26 26` |
| `--ink-rgb` | `42 10 6` |
| `--limestone-rgb` | `255 254 248` |
| `--limestone-dark-rgb` | `255 245 200` |
| `--limestone-light-rgb` | `255 255 255` |

**Rule**: when you change a hex value in `:root`, also update its `--x-rgb` twin to match.

---

## How to retheme

1. Open `app/globals.css`
2. Edit hex values in `:root` — everything updates automatically
3. Update the matching `--x-rgb` twin if the color has one
4. The azulejo SVG data URI in `.azulejo-bg` uses **hardcoded** hex values (CSS vars can't go inside `data:` URLs) — update those manually too (search for `%234A9CC8`, `%23F5C400`, `%23CC2200`)
5. Commit and push — Vercel deploys in ~1 min

---

## Tailwind config (`tailwind.config.ts`)

Colors are wired to CSS vars so Tailwind classes like `text-ink`, `bg-cobalt`, `border-rule` work:

```ts
colors: {
  'parchment':       'var(--limestone)',
  'parchment-light': 'var(--limestone-light)',
  'parchment-dark':  'rgb(var(--limestone-dark-rgb) / <alpha-value>)',
  'cobalt':          'var(--cobalt)',
  'gold':            'rgb(var(--gold-rgb) / <alpha-value>)',
  'terracotta':      'var(--terracotta)',
  'olive':           'rgb(var(--olive-rgb) / <alpha-value>)',
  'wine':            'rgb(var(--wine-rgb) / <alpha-value>)',
  'ink':             'rgb(var(--ink-rgb) / <alpha-value>)',
  'ink-secondary':   'var(--ink-secondary)',
  'ink-muted':       'var(--ink-muted)',
  'ink-faint':       'var(--ink-faint)',
  'rule':            'rgb(var(--rule-rgb) / <alpha-value>)',
}
```

Colors that need opacity modifiers use the `rgb(var(--x-rgb) / <alpha-value>)` form. Colors that don't (e.g. `--cobalt`) can use plain `var(--cobalt)`.

---

## SVG gotchas

### Presentation attributes don't accept CSS vars
`stroke="#4A9CC8"` works. `stroke="var(--cobalt)"` does **not**.

Fix: use inline `style`:
```tsx
// Wrong
<path stroke="var(--cobalt)" />

// Right
<path style={{ stroke: 'var(--cobalt)' }} />

// Or inherit via currentColor
<svg style={{ color: 'var(--cobalt)' }}>
  <path stroke="currentColor" />
</svg>
```

### Components already fixed
- `components/decorations/ArchDivider.tsx` — uses `style={{ fill, stroke }}` on all paths
- `components/decorations/TempleMarker.tsx` — uses `style={{ stroke, fill }}` on paths
- `components/decorations/TileRule.tsx` — uses `style={{ fill: 'var(--gold)' }}`
- `app/game/game-client.tsx` — arch icon uses `style={{ color: 'var(--limestone)' }}` + `stroke="currentColor"`

### SVG data URIs
The `.azulejo-bg` tile pattern in `globals.css` uses a `background-image: url("data:image/svg+xml,...")`. CSS vars **cannot** be used inside data URIs. The hardcoded hex values there are:
- `%234A9CC8` = `#4A9CC8` (cobalt)
- `%23F5C400` = `#F5C400` (gold)
- `%23CC2200` = `#CC2200` (terracotta)
- `%23F5F1EB` = `#F5F1EB` (limestone — used for stroke lines)

Update them manually if you change the palette.

---

## Global utility classes (defined in `globals.css` `@layer components`)

| Class | Description |
|---|---|
| `.smallcaps` | Uppercase label, `ink-muted`, 0.7 rem, tracked |
| `.smallcaps-ink` | Same but `ink` color |
| `.smallcaps-gold` | Same but `gold` color |
| `.smallcaps-terra` | Same but `terracotta` color |
| `.gold-rule` | 36 px wide gold horizontal rule |
| `.gold-rule-wide` | 60 px wide gold horizontal rule |
| `.rule-row` | 1 px top border in `--rule` |
| `.tile-border` | 10 px Valencian flag stripe (cobalt/white/red/white/gold/white repeating) |
| `.tile-border-thin` | Same at 5 px height |
| `.azulejo-bg` | Cobalt background with geometric tile SVG pattern |
| `.btn-primary` | Full-width cobalt CTA button |
| `.btn-ghost` | Full-width outlined button |
| `.btn-success` | Full-width olive button |
| `.btn-danger` | Full-width wine button |
| `.stepper-btn` | Square stepper button (64 × 96 px) |
| `.field-card` | White card with rule border |
| `.display-xl` | 3.4 rem serif headline |
| `.display-lg` | 2.6 rem serif headline |
| `.display-md` | 1.85 rem serif headline |
| `.display-italic` | Italic serif in `--gold-soft` |
| `.fade-up` / `.fade-up-1…4` | Staggered fade-up entrance animations |

---

## Font stack

| Tailwind class | Font | Usage |
|---|---|---|
| `font-serif` | Playfair Display → Georgia | Headlines, player names, scores, body default |
| `font-sans` | Nunito | Sub-labels, italic notes |
| `font-label` | Nunito | Button labels, smallcaps |
| `font-mono` | JetBrains Mono | Score breakdowns, timestamps |

All loaded from Google Fonts in `globals.css` line 1.
