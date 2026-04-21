# Apex 500 — Design System

**Apex 500** is an AI-powered S&P 500 estimation & prediction platform. It fuses the information density of Bloomberg Terminal with the minimalism of Apple and the clarity of Stripe's dashboard. It is a tool for analysts, traders, and data-literate investors who want to *interact with models*, not just watch charts tick.

This design system is a greenfield creation — no existing codebase, Figma, or brand guidelines were provided. Everything here is derived from the product brief and should be treated as the source of truth until real product artifacts replace it.

---

## Product context

**Positioning.** A premium, analyst-grade dashboard for exploring S&P 500 behavior and generating AI-based forecasts (LSTM, Transformer, ensemble). Predictions are first-class: they overlay the live chart, expose confidence bands, and let users interrogate *why* a model made a call.

**Primary surfaces**
- **Dashboard (web app)** — the core product. Left nav, hero chart canvas, right-side AI insight panel. Dark-mode first.
- **Marketing / landing site** — a future surface; not in scope for v1 of this system.
- **Command palette (⌘K)** — a cross-surface power-user utility that lives inside the app.

**Core features reflected in components**
- Hero price chart with prediction overlay, confidence interval, and timeframe toggle (1D / 1W / 1M / 1Y / 5Y)
- AI Estimation cards (next day / week / month) with confidence, direction, and model attribution
- Sector heatmap, correlation matrix, multi-layer volatility charts
- "What if" scenario sliders (rates, inflation)
- Insight engine — plain-English summaries of market state
- News ticker + sentiment meter
- Watchlist, saved predictions, risk profile

**Sources provided**
- Product brief (pasted, April 2026). No Figma links, no codebase, no existing assets.
- Inspiration references: Stripe Dashboard, Linear, TradingView, Apple Stocks, Bloomberg Terminal.

---

## Index — what's in this project

| Path | What it is |
|---|---|
| `README.md` | This file — brand context, content fundamentals, visual foundations, iconography |
| `SKILL.md` | Agent skill manifest — load this to design new Apex 500 artifacts |
| `colors_and_type.css` | Design tokens (color, type, spacing, radius, shadow) as CSS custom properties |
| `assets/` | Logos, brand marks, icons (Lucide via CDN — see ICONOGRAPHY) |
| `preview/` | Design-system cards rendered in the Design System tab |
| `ui_kits/dashboard/` | The core product UI kit — React/JSX components + interactive index |

---

## CONTENT FUNDAMENTALS

Copy is **precise, confident, and quiet**. We're talking to adults who manage money — no hype, no hand-holding, no exclamation marks. The tone lives between Stripe's docs ("plainly correct") and Bloomberg's headlines ("dense but never dumb").

### Voice principles

- **Plain over clever.** "Tech sector pulled the index up 0.8%" — not "Tech crushed it today."
- **Specific over vague.** Numbers, tickers, timeframes. Never "a lot" or "significantly" without a figure next to it.
- **Confident without overclaiming.** We say *likely*, *projected*, *estimated* — never *will*. Confidence scores are the voice of certainty.
- **Second person, sparingly.** "You" shows up in empty states and settings. Analytical copy is third-person / declarative.
- **No emoji in product surfaces.** Emoji are permitted in changelog / marketing only. The dashboard itself is emoji-free.

### Casing & typography rules

- **Sentence case everywhere.** Buttons, nav, headers, modals — all sentence case. "New prediction," not "New Prediction."
- **Tickers are uppercase, monospace.** `SPX`, `^VIX`, `QQQ`.
- **Percentages have a space.** `+0.82 %` — no, actually: `+0.82%` (no space, Bloomberg convention). Deltas are always signed: `+`, `−` (true minus, `U+2212`, not hyphen).
- **Numbers use thin separators.** `4,218.72` — commas for thousands, period for decimal. Never abbreviate precision in tables.
- **Time is 24-hour** in data contexts (`16:00 ET`), 12-hour in conversational UI ("opens at 9:30 am ET").

### Example voice

| Bad | Good |
|---|---|
| "🚀 Market's on fire today!" | "S&P 500 +1.2%. Tech and energy led." |
| "We think it might go up." | "Projected +0.6% over next 5 sessions. Confidence 72%." |
| "Something weird happened." | "Unusual volume on XLF, 2.4× 20-day average." |
| "Click here to learn more" | "Why this prediction →" |

### Label patterns

- **Metrics:** `Label` (muted, small caps-ish weight) over `Value` (large, tabular). Never inline.
- **Deltas:** always paired with the value they modify, colored semantically, with a tiny triangle glyph (`▲ ▼`) or arrow.
- **Confidence:** written as `72% confidence` — never "high confidence" without the number.

---

## VISUAL FOUNDATIONS

Apex 500 is **dark-mode first**. The dark palette is the canonical brand; light mode is a functional alternative, not an equal sibling. The aesthetic is **quiet density** — lots of information per square inch, held together by restraint, generous line-height, and a single accent color that earns every appearance.

### Color

- **Background stack.** Three near-black layers: `bg-canvas` (deepest, `#07090D`) → `bg-surface` (cards, `#0E1118`) → `bg-elevated` (modals/menus, `#161A24`). Never pure black (`#000`) — it kills depth.
- **Text stack.** `fg-primary` (`#F5F7FA`, ~96% luminance), `fg-secondary` (`#9BA3B4`), `fg-tertiary` (`#5A6276`), `fg-quaternary` (`#3A4050`, borders/dividers only).
- **Accent.** `accent-primary` — electric indigo `#6366F1`, used for the prediction line, primary CTAs, focus rings, and nothing else. No gradients on the accent itself.
- **Semantic.** `pos` (soft green `#10B981`), `neg` (muted red `#EF4444`), `warn` (amber `#F59E0B`), `info` (cyan `#06B6D4`). All semantics have a muted `-soft` partner for backgrounds (8% opacity typically).
- **Chart-specific.** Prediction lines use accent + a subtle glow; confidence bands are accent at 12% opacity. Volume bars use `fg-tertiary`. Sector heatmaps use a diverging red-neutral-green scale centered on zero.

### Type

- **Display & UI:** Inter (variable). Weights used: 400, 500, 600, 700. No 800/900.
- **Numerics & tickers:** JetBrains Mono (tabular). All prices, deltas, percentages, timestamps. Tabular numbers are non-negotiable.
- **Scale.** 12 → 13 → 14 → 16 → 20 → 24 → 32 → 48. Body is 14. Metric values are 24–32.
- **Line-height.** 1.5 for prose, 1.2 for metric values, 1.0 for tickers.
- **Letter-spacing.** `-0.01em` on 24px+, `+0.02em` on 11–12px labels ("PRICE", "VOLUME").

### Spacing & layout

- **4px base grid.** Spacing tokens: 4, 8, 12, 16, 20, 24, 32, 48, 64. Padding inside cards is 20 or 24.
- **Fixed chrome.** Left nav 240px (collapsible to 64px). Right insight panel 360px. Top bar 56px. Main canvas fills the remainder.
- **Content max-width.** None — this is a terminal, it uses every pixel. Responsive down to 1280px; tablet collapses the right panel into a drawer.

### Radius

- `radius-sm` 6px (buttons, inputs, tags), `radius-md` 10px (cards), `radius-lg` 14px (modals, large panels), `radius-full` 9999px (pills). **No sharp corners anywhere.** No 2px radii either — it reads cheap.

### Shadow & elevation

- **Dark-mode shadows are mostly borders + inner highlights**, not drop shadows. A card is defined by a 1px hairline border (`#1E2330`) and a 1px inset highlight (`rgba(255,255,255,0.03)`) at the top edge. Drop shadows are reserved for true overlays (menus, modals, tooltips) and are black, diffuse, and offset (`0 12px 32px rgba(0,0,0,0.4)`).
- **Glow.** The prediction line and "live" indicators carry a soft accent glow (`0 0 16px rgba(99,102,241,0.45)`). Used rarely — it's the visual equivalent of bold.

### Glass / blur / transparency

- **Glassmorphism is earned, not default.** Used on: the command palette (⌘K), floating toolbars, and the news ticker background. `backdrop-filter: blur(16px) saturate(140%)` over `rgba(14,17,24,0.72)`.
- **Never** on static cards. Glass over solid is visual noise.

### Backgrounds

- **No decorative illustrations. No hand-drawn art. No emoji cards.**
- The canvas is a solid near-black with an optional **subtle radial gradient** in the top-left corner of the dashboard (accent at 4% opacity, 800px radius) — just enough to suggest light source.
- Charts sit on the surface color with a 1px grid at `#1E2330` opacity 0.6.
- Imagery, if ever used, is desaturated, grain-free, cool-toned. No stock photography of people pointing at graphs.

### Animation

- **Duration scale.** `dur-fast` 120ms (hover, press), `dur-base` 200ms (panels, tooltips), `dur-slow` 400ms (page transitions, chart updates), `dur-glacial` 800ms (initial prediction draw-in).
- **Easing.** `ease-out-expo` for entrances (`cubic-bezier(0.19, 1, 0.22, 1)`), `ease-in-out-quart` for state changes, linear for progress/loading.
- **Chart animations.** Lines draw in left-to-right on load, 600ms. Prediction lines draw after, 400ms, with the glow fading in over 200ms behind them. Values on cards crossfade + slide 4px up when they change.
- **Skeletons, never spinners.** Loading states use the card's real layout with a shimmer (`fg-tertiary` at 8% opacity, 1.2s loop). Spinners appear only for sub-200ms waits where layout can't be predicted.

### Interactive states

- **Hover (buttons, rows):** background brightens by one step (`bg-surface` → `bg-elevated`). Text does *not* change color.
- **Hover (accent CTA):** accent lightens 8%, glow intensifies.
- **Press:** 96% scale on buttons, no color change. `dur-fast`.
- **Focus:** 2px accent ring at 4px offset (`box-shadow: 0 0 0 2px var(--accent-primary)`). Never remove outlines without replacing them.
- **Disabled:** 40% opacity, pointer-events none. No grayscale tricks.
- **Selected (nav, list):** `bg-elevated` + a 2px accent bar on the left edge for nav items; no bar for list items — just the bg.

### Borders & dividers

- Everything that could be a card gets a 1px hairline (`#1E2330`) border. No double borders. No dashed borders except on forecast/projection chart lines (dashed = not-yet-real).
- Dividers inside cards are 1px, same color, full-bleed to card edge minus 20px gutter.

### Cards

The canonical Apex card:
- `bg-surface` fill
- 1px hairline border
- 1px inset top highlight (`rgba(255,255,255,0.03)`)
- `radius-md` (10px)
- 20px or 24px padding
- No drop shadow unless elevated as an overlay
- Header row: small-caps label (left) + optional action / filter (right)
- Body: the data
- Optional footer row with subtle divider above

---

## ICONOGRAPHY

Apex 500 uses **[Lucide](https://lucide.dev/)** — a 1.5px stroke, rounded-cap, geometric icon set. Lucide's quiet minimalism matches our aesthetic and it has the financial glyphs we need (TrendingUp, BarChart3, Activity, Sparkles, Command).

- **Loaded via CDN** in prototypes: `<script src="https://unpkg.com/lucide@latest"></script>` then `lucide.createIcons()`. No icon font.
- **Stroke weight:** 1.5px, always. Do not mix weights.
- **Sizes:** 14px (inline), 16px (buttons, nav), 20px (card headers), 24px (hero actions). Nothing larger without explicit purpose.
- **Color:** icons inherit `currentColor`. In nav, they match `fg-secondary`; on hover or selected, `fg-primary`. Accent-colored icons are reserved for the AI/prediction system (the `Sparkles` icon specifically).
- **Never use emoji in the product.** Never.
- **Unicode glyphs we *do* use:** true minus `−` (U+2212), arrows `▲ ▼ → ←`, bullet `•`, thin-space in long numbers where helpful. All tabular-safe.
- **Brand mark.** The Apex logo is a custom SVG — a stylized ascending line crossing a vertical axis, forming an implied "A." See `assets/apex-logo.svg`. It is the only custom-drawn mark in the system.

### Substitution flag

Lucide is a substitution for a not-yet-designed custom icon set. If the brand commissions bespoke icons later, swap the CDN reference and update this section. Flagged: `fonts` (Inter + JetBrains Mono are both loaded from Google Fonts) — both are permissively licensed so this is fine, but the README should note the dependency if the brand ever wants a self-hosted stack.

---

*Last updated: April 2026. Greenfield build — no prior artifacts.*
