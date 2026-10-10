# UI accessibility and polish fixes — design

Date: 2026-10-10
Status: approved in conversation; pending written-spec review

## Goal

Fix the review findings that affect readability and accessibility — small-text contrast, sub-minimum type sizes, the word "Pending" rendered in a numeric KPI slot, and missing font-scaling resilience in the customer app — without altering the visual identity or breaking the fragile hand-minified build.

## Explicitly out of scope

- Desktop sidebar navigation (structural redesign; kept as a written recommendation only).
- Brand unification between LAWMA 360 and SmartWaste360 (business decision).
- Any edits to `vercel-release/` (stale artifact; redeploy from a fresh build separately).
- Refactoring/un-golfing the code-golfed sources.

## Changes

### 1. Web — contrast tokens (`work/dashboard-v3.css`, dark overrides in `work/polish.css`)

Current light tokens (`dashboard-v3.css` `:root`): `--orange:#f47707`, `--muted:#748087`, `--paper:#f5f6f6`. `#f47707` on `#f5f6f6` is ~2.5:1 — fails WCAG AA (4.5:1) wherever it colors small text.

- Add a text-safe orange token (target ≈ `#b35309`, verified ≥4.5:1 against `--paper` and white surfaces) and apply it **only to small-text usages** of `--orange` (eyebrows, inline labels like "3 service events to review", small links). Buttons, fills, large display text, and chart/map accents keep `#f47707`, preserving the brand look.
- Darken `--muted` until it clears 4.5:1 on `--paper` (target ≈ `#5d6a71`; compute exact value during implementation).
- Dark mode (`polish.css` `[data-theme=dark]`): verify `--muted:#b7afa5`, the `#bfb6aa` secondary-text override, and `--lawma-text:#ffb16d` against `--paper:#171615` / `--surface:#22201e` separately; adjust any failures the same way.
- Every color change is verified with a contrast calculation before and after; record the ratios in the implementation notes.

### 2. Web — minimum type sizes (all `work/*.css`)

The stylesheets contain many 9–11px `font-size` declarations (all on the single minified line of each file). Audit each 9px and 10px declaration:

- Raise to 11px minimum where the rule styles **readable text content** (eyebrows, labels, cell subtexts, pills).
- Leave documented exceptions where the rule styles non-text or purely decorative elements (e.g., map/chart tick marks), listing each exception in the implementation notes.
- Letter-spaced all-caps eyebrows at 11px are acceptable; nothing should reflow by more than a pixel or two. Verify against current screenshots.

### 3. Web — status words in KPI slots → chips (`work/journeys.js`)

Two stat entries render status words at display size:

- `journeys.js:35` (overview): `['Connected load', journey.weighed?'Recorded':'Pending', 'LD-0218 · facility receipt']`
- `journeys.js:39` (finance): `['Bank reconciliation', journey.settled?'Matched':'Pending', 'Human confirmation in this demonstration']`

Change both to render the existing `pill()` component (`modules.js:12` maps states to good/amber variants) in the value slot instead of display-size text. The `stats()` renderer (`journeys.js:24`) must be checked for HTML escaping of the value slot; if it escapes, extend it minimally (e.g., accept a pre-rendered flag) rather than removing escaping globally. Numeric KPIs are untouched.

### 4. Mobile — font-scaling resilience (`customer-app/src`)

- `src/text.tsx`: the custom `Text` wrapper (used app-wide) gets a default `maxFontSizeMultiplier={1.4}`, overridable via props. Font scaling currently works unbounded; this caps it at a level the fixed layouts tolerate.
- `src/ui.tsx:13` `eyebrow` fontSize 10 → 11; `src/ui.tsx:25` `pillText` fontSize 10 → 11.
- Fixed heights that clip scaled text become `minHeight`: `src/ui.tsx:43` (`height: 130`, multiline field), `src/ui.tsx:66` (`height:104`), `src/app/setup.tsx:16` (`height: 150`).
- No screen-level layout changes.

## Verification plan ("don't break anything")

Web:
1. Rebuild with `python3 work/build_dashboard.py`; diff the new `outputs/LAWMA_Service_Assurance_Dashboard.html` against a pre-change build to confirm only intended changes.
2. Run all three checks in `work/checks/` (they string-slice source, so confirm they still pass after JS edits).
3. Serve via `work/preview_server.py`; screenshot light + dark at 1440px and 390px; compare against `outputs/LAWMA_Light_Mode.jpg` / `LAWMA_Dark_Mode.jpg` for unintended layout shifts.

Mobile:
1. `npm run lint` and `npm run typecheck` in `customer-app/`.
2. Web-export smoke check of the five tabs plus the setup flow at default font scale and at 1.4× (browser font-size simulation), confirming no clipping.

## Error handling / rollback

All edits are in git-tracked sources (`work/`, `customer-app/src/`); `vercel-release/` is untouched. A single revert restores the previous state. The rebuilt dashboard HTML is regenerated output; if a regression is found post-build, revert sources and rebuild.
