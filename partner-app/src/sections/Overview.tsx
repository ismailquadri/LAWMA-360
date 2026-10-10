import { useStore } from '../lib/store';
import { money } from '../lib/money';
import { ShimmerSection } from '../components/Shimmer';
import { useSectionLoading } from '../lib/useSectionLoading';
import type { Section } from '../App';

export function Overview({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const { model } = useStore();
  const loading = useSectionLoading('overview');

  const pendingRequests = model.customers.flatMap((c) => c.pickups.filter((p) => p.status === 'Requested')).length;
  const pendingBinRequests = model.binRequests.filter((b) => b.status === 'Pending').length;
  const pickupsToday = model.routeStops.filter((s) => !s.done).length;
  const activeBins = model.customers.reduce((n, c) => n + c.bins.filter((b) => b.state === 'Active').length, 0);
  const totalCaptured = model.settlements.reduce((n, s) => n + s.partnerShare, 0);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>Good morning, {model.profile.name}</h1>
            <p>Here is what is happening across your customers today.</p>
          </div>
        </div>
        <ShimmerSection kpis={5} rows={5} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Good morning, {model.profile.name}</h1>
          <p>Here is what is happening across your customers today.</p>
        </div>
      </div>

      <div className="grid grid-kpi" style={{ marginBottom: 20 }}>
        <div className="card kpi-card">
          <span className="kpi-label">Pending requests</span>
          <span className="kpi-value">{pendingRequests + pendingBinRequests}</span>
          <span className="kpi-sub">{pendingRequests} pickups · {pendingBinRequests} bin requests</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-label">Pickups today</span>
          <span className="kpi-value">{pickupsToday}</span>
          <span className="kpi-sub">On the active route plan</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-label">Active bins</span>
          <span className="kpi-value">{activeBins}</span>
          <span className="kpi-sub">Across {model.customers.length} customers</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-label">Wallet earnings</span>
          <span className="kpi-value">{money(totalCaptured)}</span>
          <span className="kpi-sub">Remitted partner share to date</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-label">Due to LAWMA</span>
          <span className="kpi-value">{money(model.earningsUncaptured)}</span>
          <span className="kpi-sub">{model.earningsUncaptured > 0 ? 'Remittance pending' : 'All settled'}</span>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 className="section-title">Activity feed</h2>
          {model.activity.length === 0 ? (
            <div className="text-muted">No recent activity.</div>
          ) : (
            <ul className="feed-list">
              {model.activity.slice(0, 10).map((a) => (
                <li key={a.id} className="feed-item">
                  <span className="feed-dot" aria-hidden="true" />
                  <div>
                    <div>{a.text}</div>
                    <div className="feed-time">{a.time}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="section-title">Needs attention</h2>
          <div>
            {pendingRequests === 0 && pendingBinRequests === 0 && model.earningsUncaptured === 0 ? (
              <div className="text-muted" style={{ fontSize: 12.5 }}>Nothing urgent right now.</div>
            ) : (
              <>
                {pendingRequests > 0 && (
                  <div className="attention-item">
                    <span className="attention-text">
                      <strong>{pendingRequests} pickup request{pendingRequests > 1 ? 's' : ''}</strong>
                      Awaiting accept or decline
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('requests')}>Review</button>
                  </div>
                )}
                {pendingBinRequests > 0 && (
                  <div className="attention-item">
                    <span className="attention-text">
                      <strong>{pendingBinRequests} bin allocation request{pendingBinRequests > 1 ? 's' : ''}</strong>
                      Awaiting approval
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('requests')}>Review</button>
                  </div>
                )}
                {model.earningsUncaptured > 0 && (
                  <div className="attention-item">
                    <span className="attention-text">
                      <strong>{money(model.earningsUncaptured)} unpaid remittance</strong>
                      Due to LAWMA authority
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('finance')}>Remit</button>
                  </div>
                )}
                {model.customers.some((c) => c.status === 'Attention needed') && (
                  <div className="attention-item">
                    <span className="attention-text">
                      <strong>Open customer issue</strong>
                      A customer reported a problem
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('customers')}>View</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
