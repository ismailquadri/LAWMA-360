import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { money } from '../lib/money';
import { Chip } from '../components/Chip';
import { Drawer } from '../components/Drawer';
import { EmptyState } from '../components/EmptyState';
import { ShimmerSection } from '../components/Shimmer';
import { useSectionLoading } from '../lib/useSectionLoading';
import { IconSearch } from '../components/icons';

export function Customers() {
  const { model } = useStore();
  const loading = useSectionLoading('customers');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return model.customers;
    return model.customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q) || c.area.toLowerCase().includes(q),
    );
  }, [model.customers, query]);

  const openCustomer = model.customers.find((c) => c.id === openId);

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1>Customers</h1></div>
        <ShimmerSection rows={6} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>{model.customers.length} customers across your service areas.</p>
        </div>
      </div>

      <div className="flex-row" style={{ marginBottom: 14 }}>
        <div style={{ position: 'relative', maxWidth: 320, width: '100%' }}>
          <IconSearch style={{ position: 'absolute', left: 10, top: 10, width: 16, height: 16, color: 'var(--muted)' }} />
          <input
            className="search-input"
            style={{ paddingLeft: 32 }}
            placeholder="Search by name, address, or area"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search customers"
          />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState title="No matching customers" hint="Try a different name, address, or area." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Bins</th>
                  <th>Wallet balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    tabIndex={0}
                    onClick={() => setOpenId(c.id)}
                    onKeyDown={(e) => (e.key === 'Enter' ? setOpenId(c.id) : undefined)}
                  >
                    <td>{c.name}</td>
                    <td>{c.address}, {c.area}</td>
                    <td>{c.bins.length}</td>
                    <td>{money(c.balance)}</td>
                    <td><Chip label={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openCustomer && (
        <Drawer onClose={() => setOpenId(null)}>
          <CustomerDetail customerId={openCustomer.id} />
        </Drawer>
      )}
    </div>
  );
}

function CustomerDetail({ customerId }: { customerId: string }) {
  const { customerById } = useStore();
  const c = customerById(customerId);
  if (!c) return null;

  return (
    <>
      <div className="drawer-header">
        <div>
          <h2>{c.name}</h2>
          <p>{c.address}, {c.area} · {c.phone}</p>
        </div>
        <Chip label={c.status} />
      </div>

      <div className="card" style={{ boxShadow: 'none' }}>
        <h3 className="section-title">Wallet</h3>
        <div className="flex-between">
          <span className="text-muted">Balance</span>
          <strong>{money(c.balance)}</strong>
        </div>
        <div className="flex-between">
          <span className="text-muted">Reserved</span>
          <strong>{money(c.reserved)}</strong>
        </div>
      </div>

      <div className="card" style={{ boxShadow: 'none' }}>
        <h3 className="section-title">Bins</h3>
        {c.bins.length === 0 ? (
          <span className="text-muted" style={{ fontSize: 12.5 }}>No bins allocated yet.</span>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {c.bins.map((b) => (
              <div key={b.id} className="flex-between">
                <span style={{ fontSize: 13 }}>{b.id} · {b.size} L</span>
                <Chip label={b.state} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ boxShadow: 'none' }}>
        <h3 className="section-title">Pickup history</h3>
        {c.pickups.length === 0 ? (
          <span className="text-muted" style={{ fontSize: 12.5 }}>No pickups yet.</span>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {c.pickups.map((p) => (
              <div key={p.id} className="flex-between">
                <div>
                  <div style={{ fontSize: 13 }}>{p.id} · {money(p.amount)}</div>
                  <div className="text-muted" style={{ fontSize: 11.5 }}>{p.window} · {p.created}</div>
                </div>
                <Chip label={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ boxShadow: 'none' }}>
        <h3 className="section-title">Activity</h3>
        {c.entries.length === 0 ? (
          <span className="text-muted" style={{ fontSize: 12.5 }}>No wallet activity yet.</span>
        ) : (
          <ul className="feed-list">
            {c.entries.slice(0, 8).map((e) => (
              <li key={e.id} className="feed-item">
                <span className="feed-dot" />
                <div>
                  <div>{e.title}</div>
                  <div className="feed-time">{e.time}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card" style={{ boxShadow: 'none' }}>
        <h3 className="section-title">Support messages</h3>
        {c.supportMessages.length === 0 ? (
          <span className="text-muted" style={{ fontSize: 12.5 }}>No messages yet.</span>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {c.supportMessages.map((m) => (
              <div key={m.id} style={{ fontSize: 12.5 }}>
                <strong>{m.role === 'customer' ? c.name : 'You'}:</strong> {m.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {c.issues.length > 0 && (
        <div className="card" style={{ boxShadow: 'none' }}>
          <h3 className="section-title">Open issues</h3>
          <div className="stack" style={{ gap: 8 }}>
            {c.issues.map((i) => (
              <div key={i.id} className="flex-between">
                <div>
                  <div style={{ fontSize: 13 }}>{i.type}</div>
                  <div className="text-muted" style={{ fontSize: 11.5 }}>{i.detail}</div>
                </div>
                <Chip label={i.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
