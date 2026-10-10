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
