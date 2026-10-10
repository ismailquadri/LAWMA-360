# SmartWaste 360 icon library

Edit individual SVG files in `assets/` and their entries in `manifest.json`.

Rebuild from the repository root:

```sh
python3 work/illustrations/build_library.py
```

Outputs:
- `smartwaste-library.svg`: complete SVG symbol sprite.
- `smartwaste-icons.js`: standalone browser helper with embedded assets.
- `docs/ICON-LIBRARY.html`: searchable offline gallery and motion review.

Load the runtime with a script tag, then:

```js
const icon = SmartWasteIcons.create('sw-success-receipt', {size: 96});
container.append(icon);
// Call after the associated save succeeds.
SmartWasteIcons.animate(icon);
```

`create()` returns a decorative SVG unless a `label` is supplied. Give icon-only buttons their own accessible name. Controls use the interface text colour; place illustrated icons on a warm backing on dark surfaces. Use `saved-compact` for small notifications instead of shrinking a complex scene.

The gallery uses a native dialog with Escape and browser focus handling. Motion replay obeys reduced-motion preferences. No remote assets or libraries are required.

These assets are a reusable review library. Operational screens have not yet been migrated. Older `smartwaste-state-icons.svg` and `ICON-STATE-REVIEW.html` represent previous review iterations; use the complete library for new implementation.

## Consistency standard

Every source SVG uses a 48-unit viewBox, 2-unit effective outline and rounded caps/joins. Most geometry fits a centred 38-unit frame; sparse controls use 36. Normalization transforms include compensating stroke widths. Measure rendered bounds before changing those transforms.
