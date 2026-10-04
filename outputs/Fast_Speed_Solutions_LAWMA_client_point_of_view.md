# LAWMA Digital Waste Management Transformation
## Domain assessment and recommended direction

**Submitted to:** Management, Lagos Waste Management Authority (LAWMA)  
**Prepared by:** Fast Speed Solutions Limited  
**Date:** 3 October 2026

---

## Executive perspective

Lagos waste management depends on coordinated action across residents and businesses, PSP operators, field crews, vehicles, transfer and disposal facilities, payment channels and LAWMA’s regulatory and customer-service teams. The opportunity is to connect these activities so that service obligations, actual performance, payments and citizen issues can be managed with better evidence and clearer accountability.

The materials provided for this assessment describe a digital platform spanning property and service-area records, PSP operations, fleet and crew activity, TLS and landfill workflows, billing and payment reconciliation, citizen channels, enforcement, GIS and resource recovery. These capabilities support the intended outcomes: more reliable collection, better route planning, stronger PSP oversight, improved payment compliance, better facility operations, responsive citizen service and increased recycling.

LAWMA already has relevant digital foundations. Its public channels include a PSP directory, PAKAM, CitiMonitor, LAWMA App, Locate PSP and LAWMA Recycle. Its bill portal supports payment, service issue reporting, bin purchases and payment history. LAWMA has also described RFID smart bins associated with residences to support collection monitoring. The transformation should build on this foundation, guided by evidence about what is active, effective and ready to connect.

Our recommendation is to develop a trusted operational service record linking each assigned collection to field evidence, facility handoff, financial reconciliation and any follow-up action. Management, operators and residents should be able to understand the evidence behind a decision and correct or challenge records when necessary. This creates a sound basis for performance-based oversight, service recovery and financial accountability.

The supplied proposal and architecture establish an ambitious direction, while several operating, policy, scale and technical decisions remain to be confirmed. A focused validation phase will allow LAWMA to set a practical scope, measurable outcomes and a delivery design that fits existing operations.

## 1. The service challenge

LAWMA coordinates waste services across a large and varied operating network. Effective oversight depends on knowing:

- Which property or customer is served, by which PSP, and under what service expectations.
- What collection work was assigned and what happened in the field.
- Whether collected waste reached an authorized transfer or disposal facility and how it was recorded.
- How customer payments, service outcomes and PSP settlement relate to one another.
- How residents and operators can resolve missed service, incorrect bills or disputed evidence.

Project materials describe fragmented records and manual oversight as barriers to service visibility, PSP cash flow, financial transparency and reliable collection. These are credible problem areas to investigate; current operational baselines are needed to establish their scale and causes.

The central challenge is therefore to connect service assignment, field execution, evidence, operational decisions, financial actions and customer resolution. A command-centre view can help management coordinate this work, but its usefulness depends on reliable records and clear operating rules underneath it.

## 2. A connected operating model

The future service should provide a traceable journey from a collection obligation to a verified outcome:

| Service assignment | Field execution | Facility handoff | Reconciliation | Resolution and oversight |
|---|---|---|---|---|
| Property, service area, PSP and schedule are identified. | Routes, crew activity and collection evidence are recorded. | Vehicle, manifest, scale and tipping records confirm disposal. | Service, facility, invoice, payment and settlement records are matched. | Exceptions, complaints and disputes are resolved; management reviews performance. |

Each stage should preserve who or what created the record, when it occurred, the evidence used, any corrections and the decision made. Exceptions matter: connectivity loss, vehicle substitution, missed collection, scale discrepancy, payment reversal and disputed evidence should have defined handling paths.

This operating model supports four connected business areas identified in the project materials:

- **TLS and landfill operations:** vehicle intake, manifests, weight capture, tipping and facility oversight.
- **PSP logistics and performance:** service schedules, route visibility, field evidence and performance review.
- **Revenue and billing:** property records, invoicing, payment confirmation, settlement and reconciliation.
- **Anti-dumping and citizen care:** reports, evidence, case management, enforcement review and customer resolution.

## 3. What the research indicates

### LAWMA has a foundation to build on

LAWMA’s public [PSP directory](https://lawma.gov.ng/psp-directory-3/) lists operators and service areas. Its [Apps Platform](https://lawma.gov.ng/apps/) lists PAKAM, CitiMonitor, LAWMA App, Locate PSP and LAWMA Recycle. The [Bill Management Portal](https://customerportal.lawma.gov.ng/) supports bill lookup and payment, service issue reporting, bin purchase and payment history. LAWMA has also described [RFID smart bins linked to residences](https://lawma.gov.ng/2024/07/) to help monitor emptying and encourage sorting.

These public services show that the transformation can build from an existing digital footprint. Their current usage, ownership, availability and integration readiness should guide what LAWMA chooses to connect, extend, consolidate or replace.

Lagos State reported in October 2024 an estimated 23 million residents generating 5.46 million tonnes of waste annually, and discussed plans for 100 CNG trucks. These figures provide context, not a current project baseline or confirmed rollout quantity. [Lagos State Government, 17 October 2024](https://lagosstate.gov.ng/news/Environment%20/view/672291f81415802f263211bf)

In 2025, a press report attributed plans for GPS tracking of waste trucks, digitalisation of PSP cash transactions and enumeration of served households and commercial premises to the Environment Commissioner. This supports the strategic direction described in the supplied materials, while detailed requirements and implementation rules still need confirmation. [Nairametrics, 30 April 2025](https://nairametrics.com/2025/04/30/lagos-govt-moves-to-gps-track-all-waste-trucks-mandate-digital-payments-by-psps/)

### Relevant public-sector practices

**Singapore’s National Environment Agency (NEA)** appoints public waste collectors by geographic sector and maintains digital records related to collectors, vehicles, equipment, crews and disposal accounts. NEA describes using GPS to monitor recycling-truck collection and supplementing it with ground spot checks. The transferable practice is to connect regulated service areas, operator records and facility events, while corroborating telemetry with field checks. [NEA collection system](https://www.nea.gov.sg/our-services/waste-management/waste-collection-systems), [NEA recycling monitoring](https://www.nea.gov.sg/our-services/towards-zero-waste)

**England and Wales’ digital waste-tracking service** records incoming waste loads at permitted facilities. Its transition includes defined data requirements, correction of submitted records and initial coexistence with paper records. The transferable practice is to create a uniquely referenced, auditable record for each load and introduce digital reporting with clear correction and fallback processes. [GOV.UK digital waste tracking](https://www.gov.uk/guidance/digital-waste-tracking-check-if-you-need-to-report-the-waste-you-receive)

**UK local-authority collection digitisation** provides an example of joining vehicle tracking with online service forms so route information can support collection planning and near-real-time customer service. [Local Government Association case study](https://www2.local.gov.uk/case-studies/transforming-and-digitising-refuse-and-recycling-service)

These are operating practices to adapt to Lagos’s institutions, infrastructure and PSP model, not systems to copy wholesale.

## 4. Recommended direction

### 1. Establish a trusted property and service-area record

Align property or facility identifiers, addresses, customer accounts, service schedules and PSP coverage. Assign accountable data owners and provide a process to correct uncertain or disputed records. Accurate service mapping is foundational to reliable billing, customer service and route oversight.

### 2. Link service proof to facility evidence

Combine route and vehicle information with crew records, customer reports, bin events where available, and TLS or disposal records. Define how evidence is checked and how exceptions are handled. Use GPS as one signal among several; consequential service or payment decisions should be explainable and reviewable.

### 3. Make billing and PSP settlement transparent

Clarify the complete funds flow: who issues a bill, receives and owns funds, confirms settlement, authorizes PSP payment, handles reversals and approves deductions. Distinguish payment-gateway confirmation from actual bank settlement. Provide clear statements and an auditable reconciliation process for LAWMA and PSPs.

### 4. Connect citizen service to operations

Make it straightforward for residents to identify their PSP, understand and pay a bill, report missed collection, receive case updates and challenge an incorrect record. Route complaints into operational workflows so they can inform service recovery and PSP oversight. Select web, mobile, USSD, WhatsApp or assisted channels according to user needs and operating capacity.

### 5. Align sorting policy with collection and recovery capacity

Source separation can support recycling and reduce reliance on disposal, but it requires collection, transport and downstream facilities to preserve the streams. Confirm material categories, handling, contamination measures, processors and incentives before imposing penalties. Any enforcement should follow confirmed legal authority, documented evidence standards, human review and an appeal route.

### 6. Design for field continuity and secure operations

Field and facility workflows should account for intermittent connectivity, power and device constraints. Define offline capture, safe manual procedures, synchronization and reconciliation after outages. Set security, privacy, access, audit and data-retention requirements for identity, payment, location, photos and CCTV before selecting final architecture and equipment.

### 7. Make management reporting answer operational questions

Provide role-appropriate views for LAWMA operations, PSP oversight, finance, customer care and facility teams. Each measure should have a clear source, owner, refresh rate and decision use. Add route optimization, predictive analytics or computer vision when the underlying data is dependable and the expected benefit is measurable.

## 5. Measures of success

The supplied materials state important outcomes but do not define current baselines or target values. LAWMA may wish to establish measures such as:

- Collection completion and on-time rates; missed pickups; complaint resolution time.
- Route duration, distance, idle time and service coverage.
- Vehicle and field-device availability.
- Facility queue and turnaround times; completeness of weight and tipping records.
- Billing coverage and accuracy; payment completion; arrears; settlement and reconciliation time.
- PSP performance, evidence coverage, disputes and overturned decisions.
- Citizen channel usage, repeat complaints and satisfaction.
- Verified illegal-dumping cases, false positives and appeal outcomes.
- Separated material volumes, contamination and confirmed downstream recovery.
- Platform availability, data freshness, failed synchronization and recovery-test results.

Targets should be set only after LAWMA establishes baselines, data quality and accountable owners for each measure.

## 6. Priorities for validation with LAWMA

To confirm the right scope and delivery design, the following points require management and operational input:

- **Policy and service rules:** What are the authoritative requirements for billing, source sorting, enforcement, PSP performance and appeals? The supplied note asserts mandatory sorting and automated fines from 2026, but the underlying legal instrument was not included.
- **Existing digital services:** Which LAWMA systems are active, who owns them, and which should be integrated, extended, consolidated or retired?
- **Scale and sites:** What are the verified counts for properties, PSPs, vehicles, crews, tricycles, bins and users? Is the TLS scope five sites or 20, and which facilities are included?
- **Financial model:** Who bills and receives funds, what event authorizes PSP settlement, and how are reversals, deductions and disputes handled?
- **Evidence and recourse:** What constitutes verified service, what human review is required, and how can residents and PSPs correct or challenge a decision?
- **Integration and data:** Which agencies and providers have approved access and documented interfaces? Which records are authoritative and how are they corrected?
- **Continuity and security:** What service availability and recovery targets apply? What data-residency, privacy, security and retention rules govern identity, payment, location and video records?
- **Operating ownership:** Who will operate, support and fund the platform, field devices, connectivity and training after launch?

## 7. Recommended immediate action

LAWMA should validate the present operating model before approving a detailed build scope. The next stage should establish current workflows, system and data ownership, field conditions, policy rules, operational and financial baselines, integration commitments and security requirements.

With that foundation, LAWMA can select a representative pilot context, agree success measures, test the evidence and settlement model, and determine the appropriate scale-up path. The commercial estimate should then be reconciled against confirmed quantities, site readiness, hardware, civil works, connectivity, cloud, licensing, taxes, training and ongoing support.

## Conclusion

The transformation can strengthen service accountability, financial transparency, citizen response and resource recovery across Lagos State. The value will come from connecting operational evidence to fair, timely decisions and making those decisions useful to LAWMA, PSPs and residents.

The project materials establish a meaningful direction. Confirming the existing systems, policy rules, service data, facility scale and financial model will enable LAWMA to turn that direction into a practical and measurable programme.

## Sources

### Project materials

- *LAWMA Digital Platform Agency Proposal.pdf*.
- *LAWMA Digital Transformation Architecture.pdf*.
- *LAWMA Post-Transformation Hardware Inventory.xlsx*.
- Two WhatsApp screenshots, two architecture images and project notes.

### Public sources

- LAWMA [PSP Directory](https://lawma.gov.ng/psp-directory-3/), [Apps Platform](https://lawma.gov.ng/apps/), [Bill Management Portal](https://customerportal.lawma.gov.ng/) and [smart-bin statement](https://lawma.gov.ng/2024/07/).
- Lagos State Government, [LAWMA waste-management context, 17 October 2024](https://lagosstate.gov.ng/news/Environment%20/view/672291f81415802f263211bf).
- Nairametrics, [reported Lagos plans for GPS tracking and digital PSP payments, 30 April 2025](https://nairametrics.com/2025/04/30/lagos-govt-moves-to-gps-track-all-waste-trucks-mandate-digital-payments-by-psps/).
- Singapore NEA, [Waste Collection Systems](https://www.nea.gov.sg/our-services/waste-management/waste-collection-systems) and [Towards Zero Waste](https://www.nea.gov.sg/our-services/towards-zero-waste).
- UK Government, [Digital waste tracking guidance](https://www.gov.uk/guidance/digital-waste-tracking-check-if-you-need-to-report-the-waste-you-receive).
- Local Government Association, [Transforming and digitising refuse and recycling service](https://www2.local.gov.uk/case-studies/transforming-and-digitising-refuse-and-recycling-service).
