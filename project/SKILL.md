---
name: apex-500-design
description: Use this skill to generate well-branded interfaces and assets for Apex 500 — an AI-powered S&P 500 prediction platform. Dark-mode first, analyst-grade density, electric indigo accent. Use for production UI, throwaway prototypes, mocks, slides, or marketing artifacts.
user-invocable: true
---

Read `README.md` within this skill for full brand context — product positioning, voice, visual foundations, iconography rules.

Key files:
- `colors_and_type.css` — design tokens (colors, type, spacing, radius, shadow, motion). Import this in every HTML artifact.
- `assets/` — Apex 500 logo (mark + wordmark SVG).
- `preview/` — reference cards for every primitive (colors, type, spacing, components).
- `ui_kits/dashboard/` — the canonical product UI. Read `src/*.jsx` to see exact component implementations (Sidebar, TopBar, HeroChart, PredictionCards, SectorHeatmap, CorrelationMatrix, Watchlist, InsightPanel, SentimentMeter, NewsTicker, WhatIfPanel, CommandPalette).

When creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out and produce static HTML files that link `colors_and_type.css`. When working on production code, read the rules here to become an expert in designing with this brand.

Non-negotiables:
- Dark-mode first; pure black (#000) is forbidden — use `--bg-canvas` (#07090D).
- One accent only (electric indigo `#6366F1`) — never gradient the accent itself; use it for prediction lines, primary CTAs, focus rings.
- Numerics are JetBrains Mono with `font-variant-numeric: tabular-nums`. Prices and percentages always. Use true minus (`−`, U+2212), not hyphen.
- Sentence case everywhere. No emoji in product surfaces.
- Skeletons, not spinners. Cards defined by hairline borders + inset top highlight, not drop shadows.
- Icons via Lucide stroke 1.5 — already a documented substitution for a not-yet-designed bespoke set.

If the user invokes this skill without guidance, ask what they want to build, ask a few clarifying questions, then act as an expert Apex 500 designer who outputs HTML artifacts or production code, as needed.
