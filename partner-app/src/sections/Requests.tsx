import { useState } from 'react';
import { useStore } from '../lib/store';
import { money } from '../lib/money';
import { Chip } from '../components/Chip';
import { Dialog } from '../components/Dialog';
import { EmptyState } from '../components/EmptyState';
import { ShimmerSection } from '../components/Shimmer';
import { useSectionLoading } from '../lib/useSectionLoading';
import { useToast } from '../lib/toast';
import type { Pickup } from '../lib/types';

export function Requests() {
  const { model, acceptRequest, declineRequest, approveBinRequest, declineBinRequest } = useStore();
  const loading = useSectionLoading('requests');
  const { show } = useToast();
  const [acceptTarget, setAcceptTarget] = useState<Pickup | null>(null);
  const [declineTarget, setDeclineTarget] = useState<Pickup | null>(null);
  const [binDeclineTarget, setBinDeclineTarget] = useState<string | null>(null);

  const pendingPickups = model.customers.flatMap((c) =>
    c.pickups.filter((p) => p.status === 'Requested').map((p) => ({ pickup: p, customer: c })),
  );
  const pendingBinRequests = model.binRequests.filter((b) => b.status === 'Pending');

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1>Requests</h1></div>
        <ShimmerSection rows={5} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Requests</h1>
          <p>Pickup and bin allocation requests awaiting your action.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 className="section-title">Pickup requests</h2>
        {pendingPickups.length === 0 ? (
          <EmptyState title="No pending pickup requests" hint="New customer requests will appear here for accept or decline." />
        ) : (
          <div className="stack">
            {pendingPickups.map(({ pickup, customer }) => (
              <div key={pickup.id} className="card" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
                <div className="flex-between" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <strong>{customer.name}</strong>
                    <div className="text-muted" style={{ fontSize: 12 }}>{customer.address}, {customer.area}</div>
                  </div>
                  <Chip label={pickup.status} />
                </div>
                <div className="text-muted" style={{ fontSize: 12.5, marginBottom: 10 }}>
                  Bin {customer.bins[0]?.id ?? '—'} · Requested window: {pickup.window} · Reserved {money(pickup.amount)}
                </div>
                <div className="flex-row">
                  <button className="btn btn-primary btn-sm" onClick={() => setAcceptTarget(pickup)}>Accept</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setDeclineTarget(pickup)}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Bin allocation requests</h2>
        {pendingBinRequests.length === 0 ? (
          <EmptyState title="No pending bin requests" hint="New or additional bin requests from customers will appear here." />
        ) : (
          <div className="stack">
            {pendingBinRequests.map((req) => {
              const customer = model.customers.find((c) => c.id === req.customerId);
              return (
                <div key={req.id} className="card" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
                  <div className="flex-between" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <strong>{customer?.name ?? req.customerId}</strong>
                      <div className="text-muted" style={{ fontSize: 12 }}>{customer?.address}, {customer?.area}</div>
                    </div>
                    <Chip label={req.kind === 'new' ? 'New bin' : 'Additional bin'} tone="neutral" />
                  </div>
                  <div className="text-muted" style={{ fontSize: 12.5, marginBottom: 10 }}>
                    {req.size} L requested · {req.time}
                  </div>
                  <div className="flex-row">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        approveBinRequest(req.id);
                        show(`Bin request approved for ${customer?.name ?? 'customer'}. Delivery scheduled.`, 'success');
                      }}
                    >
                      Approve &amp; schedule delivery
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setBinDeclineTarget(req.id)}>Decline</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {acceptTarget && (
        <AcceptDialog
          pickup={acceptTarget}
          onClose={() => setAcceptTarget(null)}
          onConfirm={(crewId, window) => {
            acceptRequest(acceptTarget.id, crewId, window);
            show(`${acceptTarget.id} accepted and scheduled.`, 'success');
            setAcceptTarget(null);
          }}
        />
      )}

      {declineTarget && (
        <DeclineDialog
          onClose={() => setDeclineTarget(null)}
          onConfirm={(reason) => {
            declineRequest(declineTarget.id, reason);
            show(`${declineTarget.id} declined.`, 'info');
            setDeclineTarget(null);
          }}
        />
      )}

      {binDeclineTarget && (
        <DeclineDialog
          onClose={() => setBinDeclineTarget(null)}
          onConfirm={(reason) => {
            declineBinRequest(binDeclineTarget, reason);
            show('Bin request declined.', 'info');
            setBinDeclineTarget(null);
          }}
        />
      )}
    </div>
  );
}

function AcceptDialog({
  pickup,
  onClose,
  onConfirm,
}: {
  pickup: Pickup;
  onClose: () => void;
  onConfirm: (crewId: string, window: string) => void;
}) {
  const { model } = useStore();
  const [crewId, setCrewId] = useState(model.crews[0]?.id ?? '');
  const [window, setWindow] = useState(pickup.window);

  return (
    <Dialog title={`Accept ${pickup.id}`} onClose={onClose}>
      <label>
        Crew
        <select value={crewId} onChange={(e) => setCrewId(e.target.value)}>
          {model.crews.map((c) => (
            <option key={c.id} value={c.id}>{c.name} · {c.plate}</option>
          ))}
        </select>
      </label>
      <label>
        Time slot
        <input value={window} onChange={(e) => setWindow(e.target.value)} placeholder="e.g. Friday, 9 am–noon" />
      </label>
      <div className="dialog-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onConfirm(crewId, window)} disabled={!crewId || !window.trim()}>
          Confirm accept
        </button>
      </div>
    </Dialog>
  );
}

function DeclineDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <Dialog title="Decline request" onClose={onClose}>
      <label>
        Reason
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Let the customer know why" />
      </label>
      <div className="dialog-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={() => onConfirm(reason.trim() || 'Unable to fulfil at this time')}>
          Confirm decline
        </button>
      </div>
    </Dialog>
  );
}
