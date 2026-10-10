import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { BinRequest, Crew, Customer, PartnerModel, Pickup, RouteStop, Settlement } from './types';
import { seedModel } from './seed';

const KEY = 'smartwaste360-partner-demo-v1';
const PARTNER_SHARE = 0.8;

const stamp = () => new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
const id = (prefix: string) => `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
const limit = <T,>(items: T[], item: T, max = 30) => [item, ...items].slice(0, max);

type Store = {
  model: PartnerModel;
  ready: boolean;
  customerById: (id: string) => Customer | undefined;
  acceptRequest: (pickupId: string, crewId: string, window: string) => void;
  declineRequest: (pickupId: string, reason: string) => void;
  approveBinRequest: (binRequestId: string) => void;
  declineBinRequest: (binRequestId: string, reason: string) => void;
  completeStop: (stopId: string) => void;
  remitToLawma: () => Settlement;
  sendMessageToCustomer: (customerId: string, text: string) => void;
  sendMessageToLawma: (text: string) => void;
  receiveLawmaAck: () => void;
  resolveIssue: (customerId: string, issueId: string, reply: string) => void;
  updateProfile: (patch: Partial<PartnerModel['profile']>) => void;
  reset: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = useState<PartnerModel>(seedModel);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setModel({ ...seedModel, ...(JSON.parse(raw) as PartnerModel) });
    } catch {
      /* keep fresh demo */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(model));
  }, [model, ready]);

  const store = useMemo<Store>(
    () => ({
      model,
      ready,
      customerById: (cid) => model.customers.find((c) => c.id === cid),

      acceptRequest(pickupId, crewId, window) {
        setModel((s) => {
          let customerId = '';
          let amount = 0;
          const customers = s.customers.map((c) => {
            const idx = c.pickups.findIndex((p) => p.id === pickupId);
            if (idx === -1) return c;
            customerId = c.id;
            amount = c.pickups[idx].amount;
            const pickups = c.pickups.map((p, i) => (i === idx ? { ...p, status: 'Scheduled' as const, window, crew: crewId } : p));
            return {
              ...c,
              pickups,
              reserved: Math.max(0, c.reserved - amount),
              entries: limit(c.entries, { id: id('PAY'), title: `Partner credited ${money(amount)} · ${pickupId}`, amount: 0, time: stamp(), kind: 'paid' as const }),
            };
          });
          const crew = s.crews.find((c) => c.id === crewId);
          const customer = customers.find((c) => c.id === customerId);
          const routeStops: RouteStop[] = customer
            ? [
                ...s.routeStops,
                { id: id('STOP'), crewId, customerId, pickupId, address: `${customer.address}, ${customer.area}`, window, done: false },
              ]
            : s.routeStops;
          return {
            ...s,
            customers,
            routeStops,
            activity: limit(s.activity, {
              id: id('ACT'),
              time: stamp(),
              text: `${pickupId} accepted for ${customer?.name ?? 'customer'} · ${crew?.name ?? crewId} · ${window}.`,
              customerId,
            }),
          };
        });
      },

      declineRequest(pickupId, reason) {
        setModel((s) => {
          let customerId = '';
          const customers = s.customers.map((c) => {
            const idx = c.pickups.findIndex((p) => p.id === pickupId);
            if (idx === -1) return c;
            customerId = c.id;
            const amount = c.pickups[idx].amount;
            const pickups = c.pickups.map((p, i) => (i === idx ? { ...p, status: 'Declined' as const } : p));
            return {
              ...c,
              pickups,
              reserved: Math.max(0, c.reserved - amount),
              balance: c.balance + amount,
              entries: limit(c.entries, { id: id('REL'), title: `Reservation released · ${pickupId}`, amount, time: stamp(), kind: 'released' as const }),
              notices: limit(c.notices, `Pickup ${pickupId} was declined: ${reason}. Your reservation was returned.`),
            };
          });
          const customer = customers.find((c) => c.id === customerId);
          return {
            ...s,
            customers,
            activity: limit(s.activity, { id: id('ACT'), time: stamp(), text: `${pickupId} declined for ${customer?.name ?? 'customer'}: ${reason}.`, customerId }),
          };
        });
      },

      approveBinRequest(binRequestId) {
        setModel((s) => {
          const req = s.binRequests.find((b) => b.id === binRequestId);
          if (!req) return s;
          const customers = s.customers.map((c) =>
            c.id === req.customerId
              ? {
                  ...c,
                  bins: [...c.bins, { id: id('BIN'), size: req.size, state: 'Out for delivery' as const }],
                  notices: limit(c.notices, `Your ${req.kind === 'new' ? 'new' : 'additional'} ${req.size} L bin is approved and delivery is scheduled.`),
                }
              : c,
          );
          const binRequests: BinRequest[] = s.binRequests.map((b) => (b.id === binRequestId ? { ...b, status: 'Approved' as const } : b));
          const customer = customers.find((c) => c.id === req.customerId);
          return {
            ...s,
            customers,
            binRequests,
            activity: limit(s.activity, { id: id('ACT'), time: stamp(), text: `Bin request approved for ${customer?.name ?? 'customer'} · delivery scheduled.`, customerId: req.customerId }),
          };
        });
      },

      declineBinRequest(binRequestId, reason) {
        setModel((s) => {
          const req = s.binRequests.find((b) => b.id === binRequestId);
          if (!req) return s;
          const binRequests: BinRequest[] = s.binRequests.map((b) => (b.id === binRequestId ? { ...b, status: 'Declined' as const } : b));
          const customers = s.customers.map((c) =>
            c.id === req.customerId ? { ...c, notices: limit(c.notices, `Bin request declined: ${reason}.`) } : c,
          );
          return { ...s, customers, binRequests };
        });
      },

      completeStop(stopId) {
        setModel((s) => {
          const stop = s.routeStops.find((r) => r.id === stopId);
          if (!stop || stop.done) return s;
          const routeStops = s.routeStops.map((r) => (r.id === stopId ? { ...r, done: true } : r));
          let capturedAmount = 0;
          const customers = s.customers.map((c) => {
            if (c.id !== stop.customerId) return c;
            const idx = c.pickups.findIndex((p) => p.id === stop.pickupId);
            if (idx === -1) return c;
            capturedAmount = c.pickups[idx].amount;
            const pickups = c.pickups.map((p, i) =>
              i === idx ? { ...p, status: 'Completed' as const, evidence: 'CREW-EVIDENCE-01 · collection evidence recorded' } : p,
            );
            return {
              ...c,
              pickups,
              entries: limit(c.entries, {
                id: id('ENT'),
                title: `Pickup completed · ${stop.pickupId}`,
                amount: 0,
                time: stamp(),
                kind: 'paid' as const,
              }),
              notices: limit(c.notices, `Pickup ${stop.pickupId} completed by ${s.crews.find((cr) => cr.id === stop.crewId)?.name ?? 'crew'}.`),
            };
          });
          const customer = customers.find((c) => c.id === stop.customerId);
          return {
            ...s,
            customers,
            routeStops,
            earningsUncaptured: s.earningsUncaptured + capturedAmount,
            activity: limit(s.activity, {
              id: id('ACT'),
              time: stamp(),
              text: `Stop completed for ${customer?.name ?? 'customer'} · ${money(capturedAmount)} captured to earnings.`,
              customerId: stop.customerId,
            }),
          };
        });
      },

      remitToLawma() {
        let settlement: Settlement = { ref: id('SET'), date: stamp(), amount: 0, partnerShare: 0, authorityShare: 0 };
        setModel((s) => {
          const amount = s.earningsUncaptured;
          const authorityShare = Math.round(amount * (1 - PARTNER_SHARE));
          const partnerShare = amount - authorityShare;
          settlement = { ref: id('SET'), date: stamp(), amount, partnerShare, authorityShare };
          return {
            ...s,
            earningsUncaptured: 0,
            settlements: [settlement, ...s.settlements],
            activity: limit(s.activity, { id: id('ACT'), time: stamp(), text: `Remitted ${money(amount)} to LAWMA · ref ${settlement.ref}.` }),
          };
        });
        return settlement;
      },

      sendMessageToCustomer(customerId, text) {
        setModel((s) => ({
          ...s,
          customers: s.customers.map((c) =>
            c.id === customerId ? { ...c, supportMessages: [...c.supportMessages, { id: id('MSG'), role: 'assistant' as const, text, time: stamp() }].slice(-50) } : c,
          ),
        }));
      },

      sendMessageToLawma(text) {
        setModel((s) => ({
          ...s,
          lawmaThread: [...s.lawmaThread, { id: id('LMSG'), role: 'customer' as const, text, time: stamp() }].slice(-50),
        }));
      },

      receiveLawmaAck() {
        setModel((s) => ({
          ...s,
          lawmaThread: [
            ...s.lawmaThread,
            { id: id('LMSG'), role: 'assistant' as const, text: 'Received. The revenue team will confirm your settlement.', time: stamp() },
          ].slice(-50),
        }));
      },

      resolveIssue(customerId, issueId, reply) {
        setModel((s) => ({
          ...s,
          customers: s.customers.map((c) =>
            c.id === customerId
              ? { ...c, issues: c.issues.map((i) => (i.id === issueId ? { ...i, status: 'Resolved' as const, reply } : i)) }
              : c,
          ),
        }));
      },

      updateProfile(patch) {
        setModel((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
      },

      reset() {
        localStorage.removeItem(KEY);
        setModel(seedModel);
      },
    }),
    [model, ready],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const v = useContext(StoreContext);
  if (!v) throw new Error('StoreProvider missing');
  return v;
}

function money(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
}

export type { Customer, Crew, Pickup, RouteStop, Settlement };
