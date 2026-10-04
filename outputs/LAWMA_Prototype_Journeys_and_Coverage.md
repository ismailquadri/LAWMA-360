# LAWMA service assurance prototype

Prepared under Fastspeed Solutions Limited branding. Updated 4 October 2026.

## Start here
Open `LAWMA_Service_Assurance_Dashboard.html` in a current browser. Internet and WebGL are needed for the street map. Use **View as** to enter a persona’s workspace. **Scenario guide** provides the connected walkthrough. **Reset demonstration** clears the local journey progress for another presentation.

This is an interactive proposal prototype. It is not connected to LAWMA, payment providers, physical gates, cameras or identity systems. Personas preview proposed responsibilities, not authenticated access. Session progress is retained in the current browser tab; it is not a production database.

## Personas and complete demonstration paths

| Persona | Entry point | Primary journey | Completion shown |
|---|---|---|---|
| Management | Authority overview | Follow assignment, collection, facility and financial records | Service-chain progress and case outcome |
| Operations supervisor | Fleet map | Search/filter a vehicle, inspect evidence, assign follow-up | Updated review queue and activity |
| PSP dispatcher | PSP operations | Review readiness and assign IKJ-07 | Assignment available to the crew |
| Field crew | My shift | Match BIN-0182, capture sample evidence, sync outbox | Synced event with original capture time |
| Facility operator | Arrival register | Match vehicle, enter gross/tare, confirm tipping | LD-0218 receipt and calculated net weight |
| Revenue officer | Revenue | Match invoice amount to sample bank settlement | Reconciled invoice, distinct from PSP payout |
| Customer care | Case inbox | Assign recovery, capture outcome and resident confirmation | Resolved CC-1048 |
| Resident | My service | See schedule, invoice and case; submit service issue | CC-1049 reference and updated case/bill status |
| Enforcement reviewer | Incident register | Human review of an unverified camera flag | Recorded follow-up; no automatic penalty |
| Recovery officer | Material register | Validate accepted weight and link processor receipt | Receipt-linked material batch |
| Platform administrator | Platform health | Inspect proposed sources and record accountable follow-up | Local activity history |

## Real-life exception handling

The concept includes stale GPS, missing collection evidence, a wrong property tag, offline capture and later sync, invalid gross/tare values, payment amount mismatch, manifest mismatch, scale outage, reversed payment review, property data correction, contested enforcement evidence, material contamination and vehicle maintenance follow-up.

The first six use explicit states or validation. The remaining exceptions use accountable review forms and local activity records; their complete adjudication and recovery processes remain to be designed with operators.

## Usability and accessibility choices

- Role-specific entry points and focused navigation.
- Familiar operational objects: route sheets, outbox, arrival register, receipt, account ledger and case inbox.
- Status is expressed in text as well as colour.
- Labelled fields, required input constraints and visible validation messages.
- Keyboard focus styles, a skip link, modal Escape handling and focus trapping.
- Restrained hover/press feedback; reduced-motion styles.
- Responsive layouts, scrollable data tables and a fleet list alternative to map selection.

These are implemented design provisions, not a WCAG conformance certification. Assistive-technology assessment, contrast measurement, field usability research, low-bandwidth device trials and multilingual content validation remain necessary.

## Coverage against the assembled project requirements

| Project area | Representation in the prototype | Still requires confirmation / implementation |
|---|---|---|
| PSP logistics and performance | Assignments, fleet visibility, service evidence and review | Franchise rules, approved schedules, actual service boundaries, performance formulas |
| Route rationalisation | Geographic visibility and individual road-aligned routes | Optimization model, heavy-vehicle constraints, traffic and actual capacity |
| TLS / landfill | Arrival register, weights, tipping confirmation and receipt | Site inventory, certified scale adapters, gate safety, lane control, outage procedures |
| Revenue discovery / billing | Property exception, invoice, payment and reversal review | Enumeration, tariff engine, invoice generation/delivery, live checkout and approved funds flow |
| PSP financial sustainability | Separates collection evidence, bank match and disbursement decisions | PSP ledger, payout approval, deductions, disputes and settlement policy |
| Anti-dumping | Flag register, human review and appeal follow-up | Camera feeds, model quality, lawful evidence rules and full case adjudication |
| Citizen care | Assisted-channel case, recovery and resident confirmation | Live WhatsApp, USSD, telephone tools, messaging and notification delivery |
| Resource recovery | Material batches, weight validation and processor receipt | Full chain of custody, sorting policy, processor integrations and incentives |
| Fleet renewal | Vehicle-unavailable scenario and inspection follow-up | Asset lifecycle, maintenance planning, procurement and funding |
| Hardware | GPS, RFID, ANPR, scale and edge-source readiness displayed | Physical device commissioning and all hardware control |
| Security / IAM | Persona previews and session activity | Authentication, MFA, enforced permissions, immutable audit, privacy and retention controls |
| Cloud / resilience | Proposed source register and unresolved standby decisions | Agreed AWS/Azure design, RTO/RPO, failover, backups and operational monitoring |
| Governance | Source distinctions and visible human decisions | Policy ownership, target baselines, records management and formal approvals |

## Source basis and limits

This iteration used the workspace’s consolidated `LAWMA_project_understanding_review.md` and `Fast_Speed_Solutions_LAWMA_client_point_of_view.md`. Those contain the assembled assessment of the original proposal, architecture, hardware workbook, screenshots and notes. The original attachments were not independently re-opened during this iteration.

The 1,000 vehicles, people, PSP labels, property IDs, weights, invoice amounts, schedules and cases are illustrative. Nine cached routes follow mapped roads but are not approved heavy-vehicle operating routes. The simulated crew outbox uses local session state, not a production offline synchronization engine. Bank matching does not initiate transfers. No automatic sanctions are applied.

A claim that every client requirement has been finalized or implemented would be premature. This prototype covers the principal domain journeys and exposes the outstanding operational, policy and integration decisions for validation.
