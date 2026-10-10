import { useCallback, useEffect, useRef, useState } from 'react';

// Client implementation of the SmartWaste360 session-sync protocol described in
// customer-app/src/service-sync.ts and vercel-release/api/service.js.
//
// Session rooms live at API, identified by a 32-hex-char code used as a
// Bearer token. GET returns { revision, state, events }. POST sends either a
// `patch` (partial field overwrite) or a `command` (server-applied action,
// see applyCommand in service.js) together with an idempotent `eventId` and
// the `revision` the client last saw. A 409 means another writer raced us —
// we must refetch (the response body already contains the fresh doc) and may
// retry. A 410 means the session expired. A 401 means the code is invalid.

const API = 'https://vercel-release-eight.vercel.app/api/service';

const fields = [
  'premiseId',
  'partnerId',
  'providerChangeId',
  'capacityRequest',
  'bins',
  'balance',
  'reserved',
  'pickups',
  'entries',
  'issues',
  'notices',
  'requestBinOnMove',
  'archives',
  'supportMessages',
] as const;

export type SharedFields = (typeof fields)[number];

export type SharedState = {
  premiseId: string;
  partnerId: string;
  providerChangeId: string;
  capacityRequest: number;
  bins: { id: string; size: number; state: string }[];
  balance: number;
  reserved: number;
  pickups: {
    id: string;
    status: string;
    amount: number;
    created: string;
    window: string;
    partner: string;
    evidence?: string;
  }[];
  entries: { id: string; title: string; amount: number; time: string; kind: string }[];
  issues: { id: string; type: string; detail: string; status: string; time: string; reply?: string }[];
  notices: string[];
  requestBinOnMove: boolean;
  archives: unknown[];
  supportMessages: { id: string; role: 'assistant' | 'customer'; text: string }[];
};

export type LiveDoc = { revision: number; state: SharedState; error?: string };

export type LiveStatus = 'idle' | 'connecting' | 'connected' | 'waiting' | 'offline' | 'error';

export type PickupCommand = {
  action: 'accept' | 'decline' | 'schedule' | 'collect' | 'complete' | 'bins' | 'capacity' | 'provider' | 'review' | 'resolve' | 'reply';
  id?: string;
  detail?: string;
};

function eventId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useLiveLink() {
  const [session, setSession] = useState('');
  const [status, setStatus] = useState<LiveStatus>('idle');
  const [statusText, setStatusText] = useState('Not connected');
  const [doc, setDoc] = useState<LiveDoc | null>(null);
  const busy = useRef(false);
  const loaded = useRef(false);

  const reset = useCallback(() => {
    loaded.current = false;
    setDoc(null);
  }, []);

  const tick = useCallback(async () => {
    if (!session || busy.current) return;
    busy.current = true;
    try {
      const r = await fetch(API, { headers: { Authorization: 'Bearer ' + session } });
      if (r.status === 401) {
        setStatus('error');
        setStatusText('That code is not valid. Check the 32-character code and try again.');
        return;
      }
      if (r.status === 410) {
        setStatus('error');
        setStatusText('This session has expired. Ask the customer for a fresh link.');
        return;
      }
      const d = (await r.json()) as LiveDoc;
      if (!r.ok) throw new Error(d.error || 'Unable to reach the shared session.');
      loaded.current = true;
      setDoc(d);
      setStatus('connected');
      setStatusText('Connected · live');
    } catch (e) {
      setStatus('offline');
      setStatusText(e instanceof Error ? e.message : 'Waiting to reconnect.');
    } finally {
      busy.current = false;
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    setStatus('connecting');
    setStatusText('Connecting…');
    void tick();
    const timer = setInterval(tick, 5000);
    return () => clearInterval(timer);
  }, [session, tick]);

  const connect = useCallback(
    (value: string) => {
      const code = value.trim().match(/[a-f0-9]{32}/i)?.[0]?.toLowerCase();
      if (!code) return false;
      reset();
      setSession(code);
      return true;
    },
    [reset],
  );

  const disconnect = useCallback(() => {
    setSession('');
    setStatus('idle');
    setStatusText('Not connected');
    reset();
  }, [reset]);

  const sendCommand = useCallback(
    async (command: PickupCommand): Promise<{ ok: boolean; message: string }> => {
      if (!session || !doc) return { ok: false, message: 'Connect to a live session first.' };
      try {
        const r = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session },
          body: JSON.stringify({ revision: doc.revision, eventId: eventId('P'), command }),
        });
        const d = (await r.json()) as LiveDoc;
        if (r.status === 409) {
          setDoc(d);
          return { ok: false, message: 'A newer update arrived from the customer. Review it and try again.' };
        }
        if (r.status === 410) {
          setStatus('error');
          setStatusText('This session has expired. Ask the customer for a fresh link.');
          return { ok: false, message: 'Session expired.' };
        }
        if (r.status === 401) {
          setStatus('error');
          setStatusText('That code is not valid.');
          return { ok: false, message: 'Invalid session code.' };
        }
        if (!r.ok) return { ok: false, message: d.error || 'The update was rejected.' };
        setDoc(d);
        return { ok: true, message: 'Sent. The customer app will reflect this immediately.' };
      } catch {
        return { ok: false, message: 'Network error sending the update. Your local view is unchanged.' };
      }
    },
    [session, doc],
  );

  return { session, status, statusText, doc, connect, disconnect, sendCommand, refresh: tick };
}
