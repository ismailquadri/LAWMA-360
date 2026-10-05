# LAWMA 360: designing service assurance across a waste-management network

**Project stage:** Pre-contract concept and interactive prototype  
**Documented iteration period:** 3–4 October 2026  
**Context:** Quadri represented Sparkr Digitals as a prospective white-label delivery partner to Fastspeed Solutions Limited. Client-facing materials used Fastspeed branding; the product interface used LAWMA branding.  
**Contribution record:** Quadri supplied context, design references, constraints and design direction. Research synthesis, documentation and prototype implementation were developed with AI assistance. No stakeholder interview or usability-study participants were recruited during this documented work.

## Overview

LAWMA 360 explored how a waste-management authority could connect service assignments, vehicle activity, collection evidence, facility receipts, financial records and citizen resolution. The output was an interactive proposal prototype with 11 persona entry points and a synthetic 1,000-vehicle map. It was not a launched system, and no operational impact or contract outcome has been established.

## 1. The problem we framed

The supplied project material proposed four business engines: landfill/TLS operations, PSP logistics, revenue discovery and billing, and anti-dumping/citizen care. The difficult design problem was how records and responsibilities moved between them.

A truck appearing near a property could support an investigation, but could not establish that the waste had been collected. A gateway payment notification did not establish bank settlement. A camera detection did not establish an enforceable violation. Those distinctions shaped the information architecture and decision points.

The working question became: **How might we help each participant complete their part of the service while preserving enough evidence for the next person to act confidently?**

This was a design hypothesis grounded in the assembled brief, not a finding from field observation.

## 2. Evidence and research boundaries

| Evidence | What was available | How it informed the work | Limitation |
|---|---|---|---|
| Project-material synthesis | Consolidated review of proposal, architecture, inventory, screenshots and supplied notes | Domain coverage, stakeholder map, contradictions and dependencies | Original attachments were not re-opened in the later design iterations |
| User-provided context | White-label relationship, presentation needs and desired business outcomes | Branding, audience and prototype depth | Not a substitute for LAWMA operational interviews |
| Public-source desk research | LAWMA channels and selected public-sector examples in the research report | Existing-system awareness and transferable practices | Public descriptions do not prove integration readiness or effectiveness |
| Technical desk research | Fleet Engine concepts, MapLibre clustering, OpenFreeMap mapping | Separation of vehicle/task context and scalable geographic display | Not a comparative usability study |
| Visual references | Seven supplied logistics/map/dashboard screenshots | Map-led layouts, compact lists and vehicle detail hierarchy | References were aesthetic/interaction inputs, not validated product benchmarks |
| Iteration feedback | Quadri’s critique in this conversation | Smaller stationary markers, real routes, simpler cards and coherent icons | Feedback came from the project representative, not research participants |
| Browser walkthrough | Inspection of implemented sample flows | Implementation issues and flow continuity | Not a user study, accessibility certification or production load test |

No interviews, surveys, contextual inquiry, diary studies, moderated usability sessions or A/B tests were conducted. We did not infer quotations, participant counts or business results for this case study.

## 3. Research process completed

### A. Separate requirements from proposals

The consolidated assessment distinguished stakeholder outcomes from architectural suggestions. It identified unresolved fleet/site quantities, contradictory warm/hot standby descriptions, unclear settlement rules, unknown evidence thresholds and missing ownership decisions.

**Artifact:** [Project understanding review](../outputs/LAWMA_project_understanding_review.md).

**Design consequence:** The prototype labelled operational data as simulated and presented proposed integrations as unconnected. It avoided treating deployment diagrams as approved operating requirements.

### B. Map the service and its handoffs

The service chain was reconstructed as assignment → collection → facility → reconciliation → resolution. Each handoff asked four questions: which record moves, who owns the next action, what evidence is needed, and what happens when the record is incomplete?

**Artifact:** [Client point of view](../outputs/Fast_Speed_Solutions_LAWMA_client_point_of_view.md).

**Design consequence:** The example property, route, vehicle, load and invoice references recur across workspaces. This allows a presenter to explain traceability through concrete records.

### C. Identify provisional personas and mental models

Personas were role hypotheses derived from the proposed operating model. They were not research-validated demographic personas.

| Role group | Likely mental model | Proposed interface object | What must be validated |
|---|---|---|---|
| Management | Exceptions and accountability | Overview and service-chain progress | Which measures drive actual decisions |
| Operations / PSP dispatcher | Route sheet and available vehicles | Fleet list, assignment and readiness | Dispatch practice and substitution authority |
| Crew | Next stop and proof of work | Stop capture and outbox | Device use, literacy, connectivity and evidence burden |
| Facility staff | Arrival register and weigh ticket | Intake and load receipt | Scale practice, lane safety and fallback procedures |
| Finance | Ledger and bank match | Invoice and reconciliation record | Funds ownership and PSP settlement rules |
| Customer care | Case reference and follow-up | Inbox and resolution stages | Contact channels and closure policy |
| Resident | Next collection, bill and complaint | My service | Language, trust, access and assisted-channel needs |
| Enforcement / recovery | Evidence file and custody record | Incident / material register | Legal authority and acceptance standards |
| Platform support | Source readiness and incidents | Integration register and local activity | Support ownership and recovery authority |

### D. Convert uncertainty into interaction hypotheses

| Hypothesis | Prototype response | Evidence needed next |
|---|---|---|
| Dense fleet displays need progressive disclosure | Geographic clusters, small stationary markers and selected-only route | Time and error rate locating a specified vehicle |
| Operators need evidence quality alongside location | Freshness warning, service record and facility receipt separation | Whether users distinguish a position from verified service |
| One shared vocabulary will reduce handoff confusion | Repeated identifiers across workspaces | Cross-role comprehension and traceability tasks |
| Crews need continuity through outages | Local queued/synced states | Real low-connectivity field study and recovery tests |
| Residents need a visible resolution outcome | Case progress and confirmed closure | Understanding of status and ability to reopen/report issues |
| Authority identity should be visible without competing with status | Orange actions, neutral surfaces, separate success/warning colours | Brand approval and contrast assessment |

## 4. Iterations and decisions

### From animated map concept to an operational fleet view

Quadri’s feedback was explicit: the map looked like a game and would not accommodate 1,000 trucks. The response was to replace the schematic view with actual street mapping, reduce marker scale, group nearby vehicles and display one selected road route at a time.

**Trade-off:** A city overview shows clusters rather than every vehicle ID. The list preserves access to individual records without forcing map precision.

### From decorative cards to workspaces

The feedback identified left-stroke cards and inconsistent menu icons as weak. The design moved toward flat summary strips, consistent SVG symbols, compact lists, registers and a detail drawer.

**Trade-off:** Lower visual decoration gave more space to status, ownership and the next action. The visual treatment remains a proposal rather than an approved LAWMA design system.

### From fleet-only demonstration to connected journeys

The prototype expanded to role-specific entry points, crew capture, facility intake, bank reconciliation and citizen resolution. A resident sees their account and request; a crew member sees their next collection; a facility operator sees arriving loads.

**Trade-off:** Role previews make the concept easy to explore, but do not demonstrate secure authorization. Some secondary exception forms only record a review; they do not implement full adjudication.

### Brand and motion refinement

The orange/black/white direction was strengthened by removing green-tinted decorative surfaces. Orange carries primary action and selected navigation, while success remains a distinct semantic state. The palette was inferred from the public LAWMA logo, not an official identity manual.

Short page entrances, drawer/modal open and close motion, press feedback and popovers were added to clarify state changes. Reduced-motion users receive immediate transitions. Light, dark and system appearance options preserve the brand accent and save the preference locally.

The MapLibre engine is embedded but parsed/initialized on first fleet entry. This defers work; it does not reduce the downloaded standalone HTML size. Below-fold panels use browser rendering deferral. Loading feedback is tied to actual map initialization, not an artificial wait.

## 5. Proposed service blueprint

| Stage | User action | Visible response | Production dependency |
|---|---|---|---|
| Assignment | Dispatcher confirms crew/vehicle readiness | Route marked assigned | Authoritative roster and operating permissions |
| Collection | Crew matches tag and captures event | Queued record with original timestamp | Device capture, secure offline storage and deduplication |
| Facility | Operator validates load and weights | Calculated net weight and receipt | Certified scale, manifest and safe gate controls |
| Reconciliation | Finance checks invoice and bank event | Match recorded separately from PSP payment | Bank evidence, ledger and approved financial rules |
| Resolution | Care team confirms recovery with resident | Case marked resolved | Actual recovery evidence, communication and appeal/reopen process |

## 6. Accessibility and usability intent

Implemented provisions include labelled forms, visible keyboard focus, a skip link, text status labels, modal focus handling, background isolation during dialogs, Escape dismissal, detail-tab arrow-key support and reduced-motion handling. A list provides an alternative way to select fleet records. Appearance preference respects the system unless explicitly overridden.

These provisions require assistive-technology and contrast validation. They should not be described as WCAG conformance. Field use may require larger touch targets, localized language, audio assistance and workflows for shared devices; these remain research questions.

## 7. Validation plan — not yet executed

### Discovery recruitment

Recruit across management, two or more PSP operating contexts, crews with varied device confidence, facility staff, finance, customer care and residents using both digital and assisted channels. Include accessibility needs and different connectivity conditions. Sample sizes should follow access, diversity and saturation needs rather than an invented claim of statistical representation.

### Interview and observation topics

- Walk through a recent missed pickup, disputed bill or unmatched load.
- Identify the records people trust and the records they routinely correct.
- Observe dispatch, collection capture and facility weighing in context.
- Document outages, substitutions, shared-device practices and approval boundaries.
- Confirm who can resolve, reverse, reject or reopen a decision.

Obtain consent, minimize personal data, and keep actual operational records out of the public prototype.

### Moderated task plan

1. Locate a vehicle and explain whether its position is current.
2. Determine whether collection proof is sufficient and assign follow-up.
3. Capture a stop offline and explain what remains unsynced.
4. Process a load with an invalid tare reading, then correct it.
5. Identify a payment mismatch without marking the invoice reconciled.
6. Resolve a missed collection while preserving resident confirmation.
7. Explain what an unverified camera flag permits the reviewer to do.

Measure task completion, consequential errors, assistance required, time on task, confidence and single-ease ratings. Capture reasons for hesitation and terminology mismatches. Define success criteria with LAWMA before testing; no targets or results are asserted here.

### Synthesis and prioritization

Store observations separately from interpretation. Group findings by task and handoff, link each issue to evidence, rank by consequence/frequency/recoverability, and update the prototype. Re-test changed critical tasks before broad rollout.

## 8. Outcomes we can substantiate

The work produced a shareable interactive prototype, domain assessment, client report, journey coverage matrix and repository handover. The recorded walkthrough demonstrated core sample state transitions. The available record does not establish adoption, cost savings, improved payment compliance, reduced missed pickups, accessibility compliance, a won contract or production performance.

## 9. Reflection and next step

The most useful shift was treating waste collection as a sequence of evidence-bearing handoffs. Visual fidelity made those relationships easier to present, but could not settle rules that the brief left unresolved.

The next step is field discovery and usability evaluation with the actual authority and PSP ecosystem. A stronger case study would add consented observations, participant-backed findings, measured task outcomes and the resulting revisions. Portfolio publication should also confirm permission to disclose client branding, white-label relationships and project material.

## Sources and artifacts

- [Journey coverage](../outputs/LAWMA_Prototype_Journeys_and_Coverage.md)
- [Domain research report](../outputs/Fast_Speed_Solutions_LAWMA_Domain_Research_Report.pdf)
- [Earlier fleet design notes](../outputs/LAWMA_Dashboard_Design_Notes.md)
- [Google Fleet Engine concepts](https://developers.google.com/maps/documentation/mobility/fleet-engine/essentials)
- [MapLibre clustering](https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/)
- [OpenFreeMap styles and integration](https://openfreemap.org/quick_start/)
