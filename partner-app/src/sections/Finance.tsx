import { useState } from 'react';
import { useStore } from '../lib/store';
import { money } from '../lib/money';
import { Dialog } from '../components/Dialog';
import { EmptyState } from '../components/EmptyState';
import { ShimmerSection } from '../components/Shimmer';
import { useSectionLoading } from '../lib/useSectionLoading';
import { useToast } from '../lib/toast';
import type { Settlement } from '../lib/types';

const PARTNER_PCT = 80;
const AUTHORITY_PCT = 20;

export function Finance() {
  const { model, remitToLawma } = useStore();
  const loading = useSectionLoading('finance');
  const { show } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [receipt, setReceipt] = useState<Settlement | null>(null);

  const capturedEntries = model.customers.flatMap((c) =>
    c.entries.filter((e) => e.kind === 'paid' || e.title.toLowerCase().includes('bin')).map((e) => ({ ...e, customer: c.name })),
  ).sort((a, b) => (a.time < b.time ? 1 : -1));

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1>Finance</h1></div>
        <ShimmerSection kpis={3} rows={4} />
      </div>
    );
  }

  const partnerShare = Math.round(model.earningsUncaptured * (PARTNER_PCT / 100));
  const authorityShare = model.earningsUncaptured - partnerShare;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Finance</h1>
          <p>Earnings ledger, revenue split, and remittance to LAWMA.</p>
        </div>
      </div>

      <div className="grid grid-kpi" style={{ marginBottom: 20 }}>
        <div className="card kpi-card">
          <span className="kpi-label">Accumulated due to LAWMA</span>
          <span className="kpi-value">{money(model.earningsUncaptured)}</span>
          <span className="kpi-sub">Since last remittance</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-label">Partner share ({PARTNER_PCT}%)</span>
          <span className="kpi-value">{money(partnerShare)}</span>
          <span className="kpi-sub">Retained by Mainland Clean Services</span>
        </div>
        <div className="card kpi-card">
          <span className="kpi-label">Authority share ({AUTHORITY_PCT}%)</span>
          <span className="kpi-value">{money(authorityShare)}</span>
          <span className="kpi-sub">Owed to LAWMA</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 className="section-title mb-0">Remit to LAWMA</h2>
            <p className="text-muted" style={{ fontSize: 12.5 }}>
              Settle the accumulated authority share for completed pickups and bin deliveries.
            </p>
          </div>
          <button className="btn btn-primary" disabled={model.earningsUncaptured === 0} onClick={() => setConfirming(true)}>
            Remit now
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 className="section-title">Earnings ledger</h2>
        {capturedEntries.length === 0 ? (
          <EmptyState title="No captured earnings yet" hint="Completed pickups and bin deliveries will appear here." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Description</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {capturedEntries.slice(0, 12).map((e) => (
                  <tr key={e.id} style={{ cursor: 'default' }}>
                    <td>{e.customer}</td>
                    <td>{e.title}</td>
                    <td>{e.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Settlements history</h2>
        {model.settlements.length === 0 ? (
          <EmptyState title="No settlements yet" hint="Remittance receipts will be listed here." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Partner share</th>
                  <th>Authority share</th>
                </tr>
              </thead>
              <tbody>
                {model.settlements.map((s) => (
                  <tr key={s.ref} style={{ cursor: 'default' }}>
                    <td>{s.ref}</td>
                    <td>{s.date}</td>
                    <td>{money(s.amount)}</td>
                    <td>{money(s.partnerShare)}</td>
                    <td>{money(s.authorityShare)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirming && (
        <Dialog title="Confirm remittance" onClose={() => setConfirming(false)}>
          <p style={{ fontSize: 13.5 }}>
            You are about to remit <strong>{money(model.earningsUncaptured)}</strong> to LAWMA
            ({money(partnerShare)} partner share retained, {money(authorityShare)} authority share transferred).
            This will reset your accumulated balance to zero.
          </p>
          <div className="dialog-actions">
            <button className="btn btn-ghost" onClick={() => setConfirming(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                const settlement = remitToLawma();
                setConfirming(false);
                setReceipt(settlement);
                show(`Remitted ${money(settlement.amount)} to LAWMA · ${settlement.ref}.`, 'success');
              }}
            >
              Confirm &amp; remit
            </button>
          </div>
        </Dialog>
      )}

      {receipt && (
        <Dialog title="Remittance receipt" onClose={() => setReceipt(null)}>
          <div className="stack" style={{ gap: 8, fontSize: 13.5 }}>
            <div className="flex-between"><span className="text-muted">Reference</span><strong>{receipt.ref}</strong></div>
            <div className="flex-between"><span className="text-muted">Date</span><strong>{receipt.date}</strong></div>
            <div className="flex-between"><span className="text-muted">Amount</span><strong>{money(receipt.amount)}</strong></div>
            <div className="flex-between"><span className="text-muted">Partner share</span><strong>{money(receipt.partnerShare)}</strong></div>
            <div className="flex-between"><span className="text-muted">Authority share</span><strong>{money(receipt.authorityShare)}</strong></div>
          </div>
          <div className="dialog-actions">
            <button className="btn btn-primary" onClick={() => setReceipt(null)}>Done</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
