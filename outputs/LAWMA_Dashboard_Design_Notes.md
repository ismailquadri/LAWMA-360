# LAWMA fleet dashboard — design rationale

## Purpose
A presentation prototype for fleet visibility and service assurance, styled for LAWMA. The primary journey is: locate a vehicle → inspect its assignment and evidence → assign a service follow-up.

## What changed
- Real Lagos street mapping with pan, zoom, scale and attribution.
- 1,000 simulated records grouped into clickable geographic clusters. Individual vehicles use small stationary symbols, with labels revealed at close zoom.
- Road-aligned sample routes appear only for a selected vehicle.
- Search, district/status filters, viewport filtering and pagination support fleet exploration.
- A flat status summary, restrained orange accents, consistent line icons and a list/detail layout replace decorative cards and moving trucks.
- Vehicle telemetry, collection evidence and facility handoff are separate records. GPS alone is not collection proof or a payment decision.
- Follow-up assignments stay within the demonstration session and do not change the underlying evidence status.

## Project grounding
Reviewed the available consolidated project understanding and client point-of-view documents in this workspace. These synthesize the earlier project materials; this revision did not independently re-open the original proposal PDFs or hardware workbook.

The design emphasizes PSP oversight, evidence quality, last-known-position confidence and supervisor accountability. It is a focused fleet demonstration, not a complete representation of billing, citizen care, enforcement or landfill operations.

## Research references
- [Google Fleet Engine essentials](https://developers.google.com/maps/documentation/mobility/fleet-engine/essentials): vehicle tracking and task/trip context informed the operational hierarchy.
- [MapLibre clustering example](https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/): scalable marker aggregation and cluster expansion.
- [MapLibre guidance for large GeoJSON sources](https://maplibre.org/maplibre-gl-js/docs/guides/large-data/): map rendering considerations.
- [OpenFreeMap quick start](https://openfreemap.org/quick_start/): vector basemap integration.

## Demonstration boundaries
All vehicle, operator, crew, service and telemetry records are simulated. The 1,000-vehicle count demonstrates interface scale and is not a confirmed LAWMA fleet inventory. Nine road-aligned sample routes are reused across the synthetic dataset; they are not approved operational routes. Routing does not establish heavy-vehicle access. Fleet positions remain fixed at the labelled snapshot.

The standalone HTML bundles its interface and sample data. Internet access and browser WebGL are required for map tiles. No live LAWMA system is connected. Follow-up changes reset on reload.

## Review performed
Observed map loading, cluster expansion, vehicle selection, selected route display, street-level zoom, search empty state, status filtering, stale GPS warnings, service records and follow-up validation/saving in the browser. Inspected desktop and narrow-screen layouts. These are prototype interaction checks, not production performance, accessibility or integration certification.
