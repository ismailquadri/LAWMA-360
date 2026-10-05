# LAWMA 360 — project documentation

**Prepared for:** LAWMA / Fastspeed Solutions Limited  
**Document date:** 4 October 2026  
**Status:** Interactive proposal prototype

## 1. Product objective

Make the operational chain visible and accountable: service assignment → field evidence → facility handoff → financial reconciliation → citizen resolution and oversight.

The interface supports familiar records used by operational teams: route sheets, collection events, vehicle registers, manifests, scale readings, receipts, invoices and case references. GPS location is one piece of evidence; it does not independently prove collection or authorize payment.

## 2. Personas and entry points

| Persona | Starting workspace | Main responsibility |
|---|---|---|
| Management | Overview | Authority-wide priorities and service-chain progress |
| Operations supervisor | Fleet map | Locate vehicles, inspect evidence and assign follow-up |
| PSP dispatcher | PSP operations | Route assignment and vehicle/crew readiness |
| Field crew | My shift | Property matching, collection capture and outbox |
| Facility operator | Facilities | Arrival, weights, tipping and receipt |
| Revenue officer | Revenue | Property exceptions, invoices and bank match |
| Customer care | Citizen care | Case recovery and confirmed resolution |
| Resident | My service | Schedule, bill and service requests |
| Enforcement reviewer | Enforcement | Review unverified incidents and appeals |
| Recovery officer | Resource recovery | Processor receipts and material quality |
| Platform administrator | Platform health | Integration readiness and accountable follow-up |

Navigation is tailored for each preview persona. This is not a security boundary: there is no real login or authorization layer.

## 3. Connected example

The primary illustrative record connects:

- Property **PR-0182**, account **AC-0182**, tag **BIN-0182**.
- Route **IKJ-07**, vehicle **FLT-0042**, collection record **SR-0042**.
- Facility load **LD-0218**.
- Invoice **INV-0182**, amount **NGN 15,000**, sample reference **BANK-DEMO-0182**.
- Citizen case **CC-1048** and sample new request **CC-1049**.

All identifiers and amounts are demonstration fixtures. A reconciled customer payment is distinct from a PSP disbursement. Completing one record does not establish that other operational evidence is valid.

## 4. Interaction behavior

### Fleet

A seeded 1,000-record dataset supplies status, district, crew, operator, coordinates and evidence counts. Search, status/district filters, viewport filtering, pagination and CSV export support exploration. MapLibre clusters vehicles geographically; close zoom reveals small stationary truck symbols and labels. Only the selected assignment displays its route.

Vehicle details separate telemetry, collection evidence and facility handoff. Stale devices show a last-known-position warning. The service-review action records a local follow-up without changing evidence completeness.

### Crew and facility

A route assignment precedes sample crew capture. The expected tag is validated. Captured events enter a local outbox, and offline simulation prevents sync until connectivity is restored. Sync is a local state transition, not a network request.

Facility intake validates that gross weight exceeds tare weight and requires unloading confirmation. Net weight is calculated and the receipt becomes visible in the linked vehicle record. No scale, RFID reader, camera or physical gate is controlled.

### Finance and citizen care

Reconciliation requires the sample invoice amount to match and a bank-match confirmation. It records the local result without initiating payments. A citizen case moves from received to recovery assigned and then resolved with resident confirmation. The resident view displays the resulting state.

### Other workflows

Enforcement, recovery, asset-maintenance and platform-support workflows provide sample registers and accountable review forms. They do not implement complete legal adjudication, optimization, asset lifecycle management or infrastructure monitoring.

## 5. Technical architecture

The application is plain HTML, CSS and JavaScript, bundled into one static HTML artifact. This preserves the existing shareable prototype format.

| File | Responsibility |
|---|---|
| `work/dashboard-v3.html` | Base document, SVG icon symbols, fleet interface and build placeholders |
| `work/dashboard-v3.css` | Fleet layout, controls, map/detail panels and responsive styles |
| `work/dashboard-v3.js` | Seeded fleet data, search/filter, map layers, detail views, dialogs and export |
| `work/journeys.js` | Persona navigation, domain workspaces, workflow forms and session state |
| `work/polish.js` | Motion, dialog background isolation, lazy map initialization and appearance preference |
| `work/polish.css` | LAWMA-inspired brand tokens, light/dark themes and interaction polish |
| `work/journeys.css` | Connected workspace styling and accessibility provisions |
| `work/routes.json` | Cached route geometry used by the application |
| `work/build_dashboard.py` | Replaces template placeholders and writes the standalone HTML |
| `work/preview_server.py` | Localhost-only dashboard preview server on port 8765 |
| `work/get_routes.py` | Optional route-fixture refresh using the public OSRM endpoint |
| `work/render_lawma_report.py` | Optional research-report PDF generator |

Run the build and preview commands from the repository root. Edit source files rather than the generated dashboard, as rebuilding replaces the generated HTML.

The fleet script defines shared helpers used by the journey script. Keep their script order intact. MapLibre and routes must load before the fleet script.

## 6. State and persistence

- Fleet data is regenerated deterministically on page load.
- Fleet filters and follow-up notes use in-memory state.
- Connected journeys use the session-storage key `lawma-journey-v1`.
- The journey log records sample actor view, time and action in local session state.
- Reset clears the journey key and reloads the page.
- There is no server database, durable audit trail, cross-device synchronization or authentication.

Do not enter real personal, financial or operational data into this public demonstration. Production storage, audit, access and retention requirements are not implemented.

## 7. External dependencies

MapLibre GL JS 5.6.2 is bundled locally. The vector basemap uses OpenFreeMap / OpenStreetMap-derived mapping. Cached route geometry came from OSRM driving routes and is not heavy-vehicle routing approval. Normal application builds do not re-fetch routes.

A modern browser with WebGL and internet access is required for map tiles. The map has a loading/error state, while the fleet list remains usable. The public preview server binds to `127.0.0.1`, not all network interfaces.

## 8. Build and optional report generation

Dashboard build, no third-party Python dependency:

```sh
python3 work/build_dashboard.py
python3 work/preview_server.py
```

Optional report regeneration:

```sh
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements-report.txt
python3 work/render_lawma_report.py
```

The report renderer currently uses macOS Arial font paths under `/System/Library/Fonts/Supplemental/`. On other platforms, configure equivalent licensed font files before running it. The committed PDF is ready to read without installing anything.

The historical scripts in `archive/` are retained for project provenance. They are not part of the supported build and should not be run against the current dashboard.

## 9. Accessibility and usability

Implemented provisions include visible focus states, labelled forms, native required-field constraints, text statuses, a skip link, modal focus handling, Escape dismissal, responsive layouts, reduced-motion styles and a list alternative to map selection.

A production release still needs keyboard and screen-reader review, measured contrast checks, zoom/reflow assessment, low-bandwidth field-device trials, multilingual content decisions and research with actual LAWMA and PSP users. No WCAG certification is asserted.

## 10. Evidence and review status

The browser walkthrough covered the core assignment, collection, sync, receipt, reconciliation and resident-confirmed case path. Earlier fleet review observed map loading, clustering, selection, filtering and stale GPS messaging. This repository upload did not add or run an automated test suite.

The consolidated assessment and client point-of-view documents were reviewed for requirements. Original source attachments were not present in this workspace and are not included. See the coverage document for explicit distinctions between demonstrated behavior, proposals and unresolved requirements.

## 11. Production decisions still required

- Authoritative property, PSP, vehicle and facility records, identifiers and correction ownership.
- Actual fleet/site scale, service boundaries, schedules and approved operational rules.
- Evidence thresholds, dispute handling, human decision rights and audit retention.
- Tariffs, ownership of funds, invoice generation, bank reconciliation, PSP payout and reversal rules.
- Hardware adapters, gate safety, scale certification and site outage procedures.
- Identity provider, enforced roles, MFA, privacy, residency and retention.
- Existing LAWMA platform integrations and approved external agency access.
- AWS/Azure topology: the supplied material contains conflicting standby descriptions; recovery targets and failover authority remain unresolved.
- Production offline storage, idempotent synchronization, conflict handling and device management.

## 12. Handover and presentation

Start with Management → Scenario guide, then switch personas to demonstrate how the same service record travels across teams. Reset between presentations. Keep the visible simulation indicators intact. Use the research report for the client-facing domain narrative and the coverage document for scope validation.

The GitHub repository is a source/document handover. A public deployment, domain connection or GitHub Pages configuration is a separate action.

## 13. Appearance and motion refinement

Light/dark/system preference is saved under `lawma-appearance` in local storage and applied before rendering. Map styles follow appearance (OpenFreeMap Positron/Dark). The map engine remains embedded but is evaluated and initialized on first fleet entry. Dialog and drawer transitions use the Web Animations API, with immediate state changes for reduced-motion preferences. Offscreen panels use CSS content visibility. These changes are not a measured performance or accessibility certification.
