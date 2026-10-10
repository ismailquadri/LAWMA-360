# UI Accessibility Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix small-text contrast failures, sub-11px type, status-words-in-KPI-slots, and missing font-scaling caps in LAWMA-360 (web `work/` sources) and SmartWaste360 (`customer-app/`), without changing the visual identity or breaking the minified build.

**Architecture:** All web edits go into the git-tracked sources in `work/` (each CSS/JS file is a single minified line — edit via Python scripts doing exact-substring replacement, never by hand). The dashboard is then rebuilt with `python3 work/build_dashboard.py`. A new contrast-audit script acts as the red/green test. Mobile edits are three small property changes checked by `npm run lint` + `npm run typecheck`. `vercel-release/` is never touched.

**Tech Stack:** Python 3 (build + codemods), Node (existing `work/checks/*.cjs`), Expo/React Native + TypeScript (customer-app).

**Spec:** `docs/superpowers/specs/2026-10-10-ui-fixes-design.md`

**Verified color facts (recompute in Task 1, don't trust blindly):**
- Light tokens live in `work/dashboard-v3.css` `:root{--orange:#f47707;--ink:#1b252b;--muted:#748087;...--paper:#f5f6f6}`. Dark tokens live in `work/polish.css` under `html[data-theme=dark]` and already pass (7.5–10:1) — dark mode needs no changes.
- Failing on white/paper (needs ≥4.5:1): `--muted` #748087 (4.05), `.flag-text` #bd641a (4.20), and these text-color literals in `dashboard-v3.css`: #889095, #8c9499, #778188, #8a959b, #7f898f, #8d989d, #849096, #8d9691, #839097, #8c979c, #7f8c87, #87938c, #8d9991 (2.95–3.98).
- Passing replacements: cool gray → `#5d6a71` (5.58 on white), green-tinted gray → `#5c6b64` (5.61), orange text → `#9b4200` (6.62, already used by `.detail-tabs button.active` in polish.css).

---

### Task 1: Contrast audit script (the failing test)

**Files:**
- Create: `work/checks/contrast_audit.py`

- [ ] **Step 1: Write the audit script**

```python
#!/usr/bin/env python3
"""Audit work/*.css for small-text color literals that fail WCAG AA (4.5:1)
against the light theme's worst-case background (white). Dark-theme rule
blocks (html[data-theme=dark]) are skipped — dark tokens were verified
separately. Exit 1 if any failure is found."""
import glob, re, sys

def lum(h):
    h = h.lstrip('#')
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def ratio(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)

# Rules whose colors are not body text on light surfaces (overlays on photos,
# dark panels, vendor chrome). Keep this list short and justified.
SKIP_SELECTORS = ['data-theme=dark', '.entry-story', '.maplibregl', '.auth-visual',
                  '.auth-caption', '.hero-photo-label', '.product-footer',
                  '.partner-strip', '.release-photo-caption', '.mockup-tag']

failures = 0
for path in sorted(glob.glob('work/*.css')):
    for rule in open(path).read().split('}'):
        if any(s in rule for s in SKIP_SELECTORS):
            continue
        # (?<![-a-z]) keeps 'border-color:'/'accent-color:' etc. out of scope
        for m in re.finditer(r'(?<![-a-z])color:\s*#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b', rule):
            hexv = '#' + m.group(1).lower()
            r = ratio(hexv, '#ffffff')
            if r < 4.5:
                failures += 1
                sel = rule.strip()[:60]
                print(f"FAIL {r:4.2f}:1  {hexv}  {path}  {sel}")
print(f"{failures} failing color declaration(s)")
sys.exit(1 if failures else 0)
```

- [ ] **Step 2: Run it to verify it fails (red)**

Run: `cd <repo-root> && python3 work/checks/contrast_audit.py`
Expected: exit 1, with (at least) `--muted:#748087`-colored rules, `.flag-text` #bd641a, and the 13 gray literals listed in the header. Record the exact count — Task 2 must drive it to 0.

Note: the script checks every `color:#hex` in light-theme rules, including some used on colored chip backgrounds (e.g. `.state-pill.amber` #874700 on #fff0df). Those pass 4.5:1 against their own backgrounds; if any appear as false FAILs against white, verify them manually against their actual background with the `ratio()` function and add their selector to `SKIP_SELECTORS` with a comment. Do not skip anything that renders on white/paper.

- [ ] **Step 3: Commit the audit script (red state is fine — it's an audit, not CI)**

```bash
git add work/checks/contrast_audit.py
git commit -m "checks: add WCAG small-text contrast audit for work/*.css"
```

---

### Task 2: Web contrast fixes (make the audit pass)

**Files:**
- Modify: `work/dashboard-v3.css` (single minified line — use the script below)
- Modify: other `work/*.css` only where the audit reported failures

- [ ] **Step 1: Capture a pre-change baseline build**

```bash
python3 work/build_dashboard.py
cp outputs/LAWMA_Service_Assurance_Dashboard.html /tmp/dashboard-baseline.html
```

- [ ] **Step 2: Apply the replacement map**

```python
#!/usr/bin/env python3
# one-shot codemod: run from repo root, then delete (do not commit)
import re

REPLACEMENTS = {
    # token: muted secondary text 4.05:1 -> 5.15:1 on paper
    '--muted:#748087': '--muted:#5d6a71',
    # fleet-list alert orange 4.20:1 -> 6.62:1 (matches polish.css active-tab orange)
    '.flag-text{color:#bd641a!important}': '.flag-text{color:#9b4200!important}',
}
# failing gray text literals -> nearest passing gray of the same temperature
COOL = ['#889095', '#8c9499', '#778188', '#8a959b', '#7f898f', '#8d989d',
        '#849096', '#839097', '#8c979c']
GREEN = ['#8d9691', '#7f8c87', '#87938c', '#8d9991']
for g in COOL:
    REPLACEMENTS[f'color:{g}'] = 'color:#5d6a71'
for g in GREEN:
    REPLACEMENTS[f'color:{g}'] = 'color:#5c6b64'

src = open('work/dashboard-v3.css').read()
for old, new in REPLACEMENTS.items():
    n = src.count(old)
    print(f"{n}x  {old} -> {new}")
    src = src.replace(old, new)
open('work/dashboard-v3.css', 'w').write(src)
```

Expected: every line prints `1x` (or more for repeated literals); `0x` means the source changed since planning — stop and re-grep rather than guessing. If a count is higher than the audit reported for that literal, check whether the extra hit is a `border-color:` match (the bare `color:#…` substring also matches it) and decide deliberately — a slightly darker border is usually fine, but say so in the commit message.

- [ ] **Step 3: Re-run the audit until green**

Run: `python3 work/checks/contrast_audit.py`
Expected: failures only in files other than dashboard-v3.css, if any. For each remaining FAIL, apply the same temperature rule (cool gray → `#5d6a71`, green-tinted → `#5c6b64`, warm/brown → `#5e544a`, orange → `#9b4200`) with an exact-substring replace in that file, re-running until `0 failing color declaration(s)`, exit 0. If a reported color is genuinely not text on a light surface, add its selector to `SKIP_SELECTORS` with a one-line justification instead.

- [ ] **Step 4: Rebuild and diff against baseline**

```bash
python3 work/build_dashboard.py
diff <(tr '{' '\n' < /tmp/dashboard-baseline.html) \
     <(tr '{' '\n' < outputs/LAWMA_Service_Assurance_Dashboard.html) | head -80
```

Expected: only color-value changes, no structural differences.

- [ ] **Step 5: Run the existing checks**

```bash
for f in work/checks/*.cjs; do node "$f" || exit 1; done
```

Expected: all pass (they slice JS functions; CSS edits can't affect them — a failure means something else broke).

- [ ] **Step 6: Commit**

```bash
git add work/*.css outputs/LAWMA_Service_Assurance_Dashboard.html work/checks/contrast_audit.py
git commit -m "fix(a11y): darken small-text colors to meet WCAG AA 4.5:1 in light theme"
```

---

### Task 3: Web minimum type size (9px/10px → 11px)

**Files:**
- Modify: all `work/*.css` (codemod below)

- [ ] **Step 1: Apply the font-size codemod**

```python
#!/usr/bin/env python3
# one-shot codemod: run from repo root, then delete (do not commit)
import glob

# Vendor map chrome: attribution stays small; it's MapLibre's own UI.
EXCEPTIONS = ['.maplibregl-ctrl-attrib']

for path in sorted(glob.glob('work/*.css')):
    rules = open(path).read().split('}')
    out, changed = [], 0
    for rule in rules:
        if not any(e in rule for e in EXCEPTIONS):
            for old in ('font-size:9px', 'font-size: 9px',
                        'font-size:10px', 'font-size: 10px'):
                if old in rule:
                    rule = rule.replace(old, 'font-size:11px')
                    changed += 1
    # NOTE: '!important' variants like 'font-size:9px!important' are caught
    # because the replacement leaves the suffix intact.
        out.append(rule)
    open(path, 'w').write('}'.join(out))
    if changed:
        print(f"{path}: {changed} rule(s) bumped")
```

Expected output: dashboard-v3.css ~35+, journeys.css ~15+, mobile-app.css ~10+, presentation.css ~12+, plus smaller counts in simulation.css, experience.css, modules.css, polish.css. Zero total means the regexes missed — stop and inspect.

- [ ] **Step 2: Verify no sub-11px text remains (except the documented exception)**

```bash
grep -o 'font-size: *\(9\|10\)px' work/*.css | sort | uniq -c
```

Expected: only hits inside `.maplibregl-ctrl-attrib` (check with `grep -o '.maplibregl-ctrl-attrib{[^}]*' work/dashboard-v3.css`).

- [ ] **Step 3: Rebuild, run checks, eyeball layout**

```bash
python3 work/build_dashboard.py
for f in work/checks/*.cjs; do node "$f" || exit 1; done
python3 work/preview_server.py &
```

Open http://127.0.0.1:8765/ — check the fleet list (row subtexts grew ~2px), the detail panel tabs, and the mobile shell at 390px width (devtools). Rows may grow a few px; nothing should truncate or overlap. Kill the server after.

- [ ] **Step 4: Commit**

```bash
git add work/*.css outputs/LAWMA_Service_Assurance_Dashboard.html
git commit -m "fix(a11y): raise sub-11px text to 11px minimum across dashboard styles"
```

---

### Task 4: Status words in KPI slots → chips

**Files:**
- Modify: `work/journeys.js` (lines 35 and 39; single-line-per-statement file — exact substring replace)

The `stats()` renderer (`work/journeys.js:18-24` area) emits `<strong>'+b+'</strong>` without escaping, and `pill()` is defined in the same file (`journeys.js:18`): `const pill=(s,t='')=>'<span class="state-pill '+t+'">'+s+'</span>'`. So pill HTML can be passed directly as the stat value.

- [ ] **Step 1: Replace the two status-word values**

```python
#!/usr/bin/env python3
# one-shot codemod: run from repo root, then delete (do not commit)
src = open('work/journeys.js').read()
edits = {
    # overview page, 'Connected load' stat (journeys.js:35)
    "journey.weighed?'Recorded':'Pending'":
        "journey.weighed?pill('Recorded','good'):pill('Pending','amber')",
    # finance page, 'Bank reconciliation' stat (journeys.js:39)
    "journey.settled?'Matched':'Pending'":
        "journey.settled?pill('Matched','good'):pill('Pending','amber')",
}
for old, new in edits.items():
    n = src.count(old)
    print(f"{n}x  {old}")
    assert n == 1, f"expected exactly 1 occurrence of {old!r}, got {n}"
    src = src.replace(old, new)
open('work/journeys.js', 'w').write(src)
```

- [ ] **Step 2: Rebuild and verify in browser**

```bash
python3 work/build_dashboard.py
for f in work/checks/*.cjs; do node "$f" || exit 1; done
python3 work/preview_server.py &
```

Open http://127.0.0.1:8765/ → enter the Management workspace. On the overview, the "Connected load" stat must show an amber "Pending" chip (not display-size text); numeric stats (1,000 / 24 / 1) unchanged. Walk the scenario to the facility step (or check Revenue directly): "Bank reconciliation" shows the chip, and after reconciling, "Matched"/"Recorded" render as green chips. Toggle dark mode — chips use the existing dark `.state-pill` styles. Kill the server.

- [ ] **Step 3: Commit**

```bash
git add work/journeys.js outputs/LAWMA_Service_Assurance_Dashboard.html
git commit -m "fix(ui): render status words in KPI slots as state chips, not display text"
```

---

### Task 5: Mobile font-scaling resilience

**Files:**
- Modify: `customer-app/src/text.tsx`
- Modify: `customer-app/src/ui.tsx`

- [ ] **Step 1: Cap font scaling in the Text wrapper**

In `customer-app/src/text.tsx`, the wrapper is:

```tsx
return <NativeText {...props} style={[props.style, { fontFamily: family, fontWeight: 'normal' }]} />;
```

Change to (default before the spread so callers can override):

```tsx
return <NativeText maxFontSizeMultiplier={1.4} {...props} style={[props.style, { fontFamily: family, fontWeight: 'normal' }]} />;
```

- [ ] **Step 2: Bump the two 10px styles and fix the multiline field in ui.tsx**

Three exact-substring edits in `customer-app/src/ui.tsx` (file is near-minified; each substring is unique — verify with grep first):

| old | new |
|---|---|
| `eyebrow: { fontSize: 10, fontWeight: '700'` | `eyebrow: { fontSize: 11, fontWeight: '700'` |
| `pillText: { fontSize: 10, color: C.green` | `pillText: { fontSize: 11, color: C.green` |
| `multiline && { height: 130, textAlignVertical:` | `multiline && { minHeight: 130, textAlignVertical:` |

```bash
cd customer-app
grep -c "eyebrow: { fontSize: 10, fontWeight: '700'" src/ui.tsx   # expect 1
grep -c 'pillText: { fontSize: 10, color: C.green' src/ui.tsx     # expect 1
grep -c 'multiline && { height: 130, textAlignVertical:' src/ui.tsx  # expect 1
```

**Documented spec deviations (do NOT change these):** `src/ui.tsx:66` `height:104` is a fixed-size illustration container (width:130 image box) and `src/app/setup.tsx:16` `height: 150` is an `<Image>` — neither contains scalable text, so converting them to minHeight adds risk for no a11y benefit. The spec listed them before their content was inspected.

- [ ] **Step 3: Lint and typecheck**

```bash
cd customer-app && npm run lint && npm run typecheck
```

Expected: both pass with no new warnings.

- [ ] **Step 4: Smoke-check at 1.4× scale**

```bash
cd customer-app && npm run web
```

Open the local URL; in browser devtools set page font-size to 140% (or use OS text-size setting). Walk: landing → setup (3 steps) → each of the 5 tabs. Eyebrows/pills read at 11px; the report/support multiline field grows instead of clipping. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/text.tsx src/ui.tsx
git commit -m "fix(a11y): cap font scaling at 1.4x, 11px minimum labels, growable multiline field"
```

---

### Task 6: Final verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Full web verification**

```bash
python3 work/checks/contrast_audit.py          # expect: 0 failures, exit 0
python3 work/build_dashboard.py                # rebuild clean
for f in work/checks/*.cjs; do node "$f" || exit 1; done
git status --short                             # only intended files changed; vercel-release/ untouched
```

- [ ] **Step 2: Visual comparison against the shipped screenshots**

Serve with `python3 work/preview_server.py`, and at 1440px and 390px in light and dark compare against `outputs/LAWMA_Light_Mode.jpg` and `outputs/LAWMA_Dark_Mode.jpg`: identical layout, slightly darker small text, "Pending" now a chip. If any screen shows truncation/overlap introduced by the 11px bump, fix the specific rule (reduce padding or allow wrap), rebuild, and amend the Task 3 commit.

- [ ] **Step 3: Report**

Summarize: contrast ratios before/after (audit output), rules bumped per file, the two KPI chips, mobile changes, and the note that `vercel-release/` is stale and should be redeployed from the fresh `outputs/LAWMA_Service_Assurance_Dashboard.html` when ready.
