import { useState } from 'react';
import { useLiveLink } from '../lib/live-link';
import { Chip } from '../components/Chip';
import { Dialog } from '../components/Dialog';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../lib/toast';
import { money } from '../lib/money';

export function LiveLink() {
  const { session, status, statusText, doc, connect, disconnect, sendCommand } = useLiveLink();
  const { show } = useToast();
  const [code, setCode] = useState('');
  const [acceptTarget, setAcceptTarget] = useState<string | null>(null);

  const dotClass =
    status === 'connected' ? 'live-dot-connected' : status === 'offline' || status === 'error' ? 'live-dot-offline' : 'live-dot-waiting';

  async function onConnect() {
    const ok = connect(code);
    if (!ok) show('Enter a valid 32-character session code.', 'error');
  }

  async function onAccept(pickupId: string) {
    const result = await sendCommand({ action: 'accept', id: pickupId });
    show(result.message, result.ok ? 'success' : 'error');
    setAcceptTarget(null);
  }

  async function onSchedule(pickupId: string, win: string) {
    const result = await sendCommand({ action: 'schedule', id: pickupId, detail: win });
    show(result.message, result.ok ? 'success' : 'error');
  }

  const state = doc?.state;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Live Link</h1>
          <p>Connect to a customer&rsquo;s live session to view and act on their shared record in real time.</p>
        </div>
      </div>

      {!session ? (
        <div className="card" style={{ maxWidth: 480 }}>
          <h2 className="section-title">Connect to a customer session</h2>
          <p className="text-muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
            Paste the 32-character session code from the customer app&rsquo;s Connection screen.
          </p>
          <div className="field-group">
            <label htmlFor="session-code">Session code</label>
            <input
              id="session-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. a1b2c3d4e5f6…"
              aria-describedby="session-code-hint"
            />
          </div>
          <button className="btn btn-primary" onClick={onConnect} disabled={!code.trim()}>Connect</button>
        </div>
      ) : (
        <>
          <div className="live-status-line" role="status" style={{ marginBottom: 18 }}>
            <span className={`live-dot ${dotClass}`} aria-hidden="true" />
            <span>{statusText}</span>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={disconnect}>
              Disconnect
            </button>
          </div>

          {!state ? (
            <div className="card"><EmptyState title="Waiting for the shared session" hint="Polling the customer's live document every 5 seconds." /></div>
          ) : (
            <div className="grid grid-2">
              <div className="stack">
                <div className="card">
                  <h2 className="section-title">Live pickups</h2>
                  {state.pickups.length === 0 ? (
                    <EmptyState title="No pickups yet" hint="Pickup requests from the customer will appear here." />
                  ) : (
                    <div className="stack" style={{ gap: 10 }}>
                      {state.pickups.map((p) => (
                        <div key={p.id} className="flex-between" style={{ alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: 13 }}>{p.id} · {money(p.amount)}</div>
                            <div className="text-muted" style={{ fontSize: 11.5 }}>{p.window} · {p.partner}</div>
                          </div>
                          <div className="flex-row">
                            <Chip label={p.status} />
                            {p.status === 'Requested' && (
                              <button className="btn btn-primary btn-sm" onClick={() => setAcceptTarget(p.id)}>
                                Accept
                              </button>
                            )}
                            {p.status === 'Accepted' && (
                              <button className="btn btn-secondary btn-sm" onClick={() => onSchedule(p.id, p.window)}>
                                Schedule
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <h2 className="section-title">Bins</h2>
                  {state.bins.length === 0 ? (
                    <EmptyState title="No bins yet" hint="The customer's bins will appear here once allocated." />
                  ) : (
                    <div className="stack" style={{ gap: 8 }}>
                      {state.bins.map((b) => (
                        <div key={b.id} className="flex-between">
                          <span style={{ fontSize: 13 }}>{b.id} · {b.size} L</span>
                          <Chip label={b.state} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="stack">
                <div className="card">
                  <h2 className="section-title">Wallet</h2>
                  <div className="flex-between">
                    <span className="text-muted">Balance</span>
                    <strong>{money(state.balance)}</strong>
                  </div>
                  <div className="flex-between">
                    <span className="text-muted">Reserved</span>
                    <strong>{money(state.reserved)}</strong>
                  </div>
                </div>

                <div className="card">
                  <h2 className="section-title">Notices</h2>
                  {state.notices.length === 0 ? (
                    <span className="text-muted" style={{ fontSize: 12.5 }}>No notices yet.</span>
                  ) : (
                    <ul className="feed-list">
                      {state.notices.slice(0, 6).map((n, i) => (
                        <li key={i} className="feed-item">
                          <span className="feed-dot" />
                          <div>{n}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {acceptTarget && (
        <Dialog title={`Accept ${acceptTarget}`} onClose={() => setAcceptTarget(null)}>
          <p style={{ fontSize: 13 }}>This sends an &ldquo;accept&rdquo; command to the customer&rsquo;s live session. Their app will update immediately.</p>
          <div className="dialog-actions">
            <button className="btn btn-ghost" onClick={() => setAcceptTarget(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onAccept(acceptTarget)}>Confirm accept</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
