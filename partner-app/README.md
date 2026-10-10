# SmartWaste360 Partner — Mainland Clean Services

The agency console for SmartWaste360 waste-collection partners. It sits between LAWMA
management and citizens: partners review pickup and bin-allocation requests, run daily
crew operations, track earnings and remit the LAWMA authority share, message customers
and LAWMA, and — via **Live Link** — connect to a customer's live shared session to act
on their requests in real time.

This is a standalone demo app (Vite + React + TypeScript, hand-rolled CSS, no UI
libraries). All data is seeded fictional records persisted to `localStorage` under
`smartwaste360-partner-demo-v1`.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build    # tsc -b && vite build
npm run preview  # serve the production build locally
npm run lint      # oxlint
```

## Live Link — how it works

Live Link is a **client** implementation of the SmartWaste360 session-sync protocol
used by the customer app (see `customer-app/src/service-sync.ts` and
`vercel-release/api/service.js`):

1. On the customer app's Connection screen, the customer shares a 32-character
   hex session code (a shared-session Bearer token).
2. Paste that code into Live Link and click **Connect**. The app polls
   `GET https://vercel-release-eight.vercel.app/api/service` every 5 seconds with
   `Authorization: Bearer <code>`, rendering the shared document (bins, wallet
   balance/reserved, pickups, notices) as it changes.
3. Accepting a live "Requested" pickup sends
   `POST { revision, eventId, command: { action: "accept", id } }` to the same
   endpoint; the customer app sees the acceptance immediately on its own poll.
   "Scheduling" a pickup sends `command: { action: "schedule", id, detail }`.
4. Status line reflects connection state: connecting / connected / waiting
   (offline, retrying) / error. The client handles:
   - `401` — invalid session code (human copy, no retry)
   - `404`/fresh session (`revision === 0`) — waiting for the customer to populate data
   - `409` — another writer raced us; the response already contains the fresh
     document, which is applied, and the user is asked to retry
   - `410` — session expired; asks for a fresh link from the customer

## Demo disclaimer

Demonstration · fictional records · no real payments. Eight seeded customers across
Ajah, Ikeja, and Lekki illustrate pending requests, bin allocation, scheduled and
completed pickups, and an open customer issue. Use **Settings → Reset demonstration**
to clear local data and reseed.
