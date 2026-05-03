-- Valencia Pub Golf — Supabase Schema (canonical)
--
-- Run this whole file in Supabase SQL Editor to rebuild from scratch.
-- Long content fields (fun_fact, host_notes) can be updated via ADMIN.md recipes.
--
-- Project: <your-supabase-project-id>
-- SQL Editor: https://supabase.com/dashboard/project/<your-project-id>/sql/new

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL
);

CREATE TABLE IF NOT EXISTS holes (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  maps_url TEXT,
  drink TEXT NOT NULL,
  drink_emoji TEXT DEFAULT '🍊',
  max_sips INT NOT NULL,
  stop_type TEXT,
  fun_fact TEXT,
  is_practice BOOLEAN DEFAULT FALSE,
  district TEXT,                          -- small-caps eyebrow above name
  coords TEXT,                            -- coordinate string
  score_multiplier NUMERIC NOT NULL DEFAULT 1.0,  -- ×1.5/×2.0/×2.5 on holes 6/7/8
  host_notes TEXT                         -- only shown to player named "Emil"
);

CREATE TABLE IF NOT EXISTS waypoints (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  district TEXT,
  coords TEXT,
  maps_url TEXT,
  after_hole_id INT REFERENCES holes(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 0,
  host_notes TEXT                         -- only shown to player named "Emil"
);

CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  hole_id INT REFERENCES holes(id),
  committed_sips INT,
  completed BOOLEAN,                      -- null = not yet, true = ✓, false = ✗ (+3 points)
  penalty_shot BOOLEAN DEFAULT FALSE,
  penalty_shot_reason TEXT,
  penalty_shot_reasons TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, hole_id)
);

CREATE TABLE IF NOT EXISTS game_state (
  id INT PRIMARY KEY DEFAULT 1,
  current_hole INT NOT NULL DEFAULT 1,
  phase TEXT NOT NULL DEFAULT 'committing'
  -- valid phases: 'committing' → 'reveal' → 'drinking' → 'scoring'
);

-- ============================================================
-- PERMISSIONS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON players TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON holes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON waypoints TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON scores TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON game_state TO anon, authenticated;

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE scores;
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE holes;
ALTER PUBLICATION supabase_realtime ADD TABLE waypoints;

-- ============================================================
-- SEED: Players (4)
-- ============================================================

INSERT INTO players (name, display_order) VALUES
  ('Emil', 1),       -- "Emil" is the host — receives host_notes
  ('Søren', 2),
  ('Frederik', 3),
  ('Ruben', 4)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED: Holes (8)
-- Stop 1 is practice (is_practice = true).
-- Multipliers: hole 6 = ×1.5, hole 7 = ×2.0, hole 8 = ×2.5
-- ============================================================
-- I  ★ practice  La Cola del Pez       Cerveza Artesana   max=8  (Plaça de Sant Jaume)
-- II             Insólito               Vermut             max=6  (Ciutat Vella)
-- III            Mientras Tanto         Cóctel             max=5  (Ciutat Vella)
-- IV             Luna de Valencia       Sangria            max=6  (Torres de Serrans)
-- V              El Mirador de Only YOU G&T                max=5  (Rooftop, 9th floor)
-- VI   ×1.5      Nuvolc                 Cerveza            max=8  (Ruzafa)
-- VII  ×2.0      Bukowski Craft Beer    IPA                max=8  (L'Eixample)
-- VIII ×2.5      Olhöps                 Shot               max=3  (Ruzafa, finale)

INSERT INTO holes (id, name, address, drink, drink_emoji, max_sips, is_practice, district, score_multiplier, fun_fact, host_notes) VALUES
(1,
 'La Cola del Pez',
 'Pl. de Sant Jaume, 3, Ciutat Vella',
 'Cerveza Artesana',
 '🍺',
 8,
 TRUE,
 'Ciutat Vella',
 1.0,
 'Plaça de Sant Jaume er det historiske centrum i Valencia — her lå den romerske by Valentia, grundlagt i 138 f.Kr.',
 'Start blødt — prøverunden tæller ikke. Giv gruppen et overblik over reglerne inden I går videre.'
),
(2,
 'Insólito',
 'C/ de Dalt, 6, Ciutat Vella',
 'Vermut',
 '🍷',
 6,
 FALSE,
 'Ciutat Vella',
 1.0,
 'Vermut har rødder i det 18. århundredes Turin, men Valencia har gjort det til sin egen ritual — aperitivo-kulturen her er hellig.',
 'Insólito er kendt for kreative vermutcocktails. Hold øje med om nogen allerede presser på max.'
),
(3,
 'Mientras Tanto',
 'C/ de los Cordellats, 6, Ciutat Vella',
 'Cóctel',
 '🍹',
 5,
 FALSE,
 'Ciutat Vella',
 1.0,
 'Barens navn betyder "In the Meantime" — et nikk til, at man altid venter på noget i Valencia. Typisk: bussen.',
 'God tid til en sandwich eller tapas ved siden af inden frokosten. Hul III er cocktail — max er 5.'
),
(4,
 'Luna de Valencia',
 'C. de la Blanqueria, 4, Hotel Puerta Serranos, Ciutat Vella',
 'Sangria',
 '🍷',
 6,
 FALSE,
 'Serrans',
 1.0,
 'Hotellets tag ligger klods op ad Torres de Serrans fra 1392 — én af de to bevarede gotiske byporte i Valencia. Udsigten er faktisk vild.',
 'Rooftop-bar. Sangria med max 6 slurke. Giv gruppen et par minutter til at nyde udsigten inden commit.'
),
(5,
 'El Mirador de Only YOU',
 'Plaça de Rodrigo Botet, 5, 9. etage, Ciutat Vella',
 'G&T',
 '🫗',
 5,
 FALSE,
 'Ciutat Vella',
 1.0,
 'Only YOU Hotel er indrettet i en ombygget palæ fra det 19. århundrede. Fra 9. etage ser man Mercado Central-taget og hele den gamle bydel.',
 'G&T, max 5. Dette er det højeste stop på ruten — nyd udsigten. Spil lidt på det når I bestiller.'
),
(6,
 'Nuvolc',
 'C/ de Lluís de Santàngel, 3, L''Eixample',
 'Cerveza',
 '🍺',
 8,
 FALSE,
 'Ruzafa',
 1.5,
 'Ruzafa-kvarteret var engang et selvstændigt landsby, nu Valencias hippeste distrikt — kaldet "Valencias Soho". Nuvolc er et af de bedste craft-beer-steder her.',
 '× 1.5 multiplikator fra nu af. Hul VI markerer startskuddet for slutspillet — meld det til gruppen.'
),
(7,
 'Bukowski Craft Beer',
 'C/ dels Tomasos, 17, L''Eixample',
 'IPA',
 '🍺',
 8,
 FALSE,
 'L''Eixample',
 2.0,
 'Opkaldt efter Charles Bukowski — den evigt tørstige amerikanske forfatter. Craft-beer-baren her har over 200 flasker på menuen.',
 '× 2.0. Næstsidste stop. IPA med max 8. Pointene tæller dobbelt — husk at nævne det ved committet.'
),
(8,
 'Olhöps',
 'C/ de Sueca, 21, L''Eixample',
 'Shot',
 '🥃',
 3,
 FALSE,
 'Ruzafa',
 2.5,
 'Olhöps er én af Valencias mest roste craft-beer-barer. C/ de Sueca er Ruzafas vigtigste gade, opkaldt efter nabobyen Sueca — hjemsted for Valencias bedste arròs a banda.',
 '× 2.5. Finalen. Shot med max 3 — alt andet end I, II eller III giver straf. Sæt stemningen, det er sidst.'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: Waypoints (2 — lunch and dinner breaks)
-- ============================================================
-- 1: Frokost · Casa Vani         after hole 3   (Caballeros, Ciutat Vella)
-- 2: Middag · Restaurant Secret  after hole 6   (Sant Martí, Ciutat Vella)

INSERT INTO waypoints (id, name, description, district, after_hole_id, display_order, maps_url, host_notes) VALUES
(1,
 '🍽 Frokost · Casa Vani',
 'Pause fra spillet. Aftal drikkene til hul IV inden I går.',
 'Ciutat Vella',
 3,
 1,
 'https://maps.google.com/?q=C.+de+Caballeros+30,+Valencia',
 'Casa Vani, C. de Caballeros, 30. Reservation? Tjek inden I forlader Mientras Tanto.'
),
(2,
 '🍽 Middag · Restaurant Secret',
 'Middag inden slutspillet. Hul VI er næste stop — × 1.5 multiplikator venter.',
 'Ciutat Vella',
 6,
 1,
 'https://maps.google.com/?q=C.+de+Sant+Martí+11,+Valencia',
 'Restaurant Secret, C/ de Sant Martí, 11. Reservation? Sørg for at alle er mætte inden Ruzafa-etapen.'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: Initial game state
-- ============================================================

INSERT INTO game_state (id, current_hole, phase)
VALUES (1, 1, 'committing')
ON CONFLICT (id) DO NOTHING;
