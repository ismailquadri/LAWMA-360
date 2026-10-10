import { useStore } from '../lib/store';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { ShimmerSection } from '../components/Shimmer';
import { useSectionLoading } from '../lib/useSectionLoading';
import { useToast } from '../lib/toast';
import { IconCheck, IconTruck } from '../components/icons';
import { money } from '../lib/money';

export function Operations() {
  const { model, completeStop, customerById } = useStore();
  const loading = useSectionLoading('operations');
  const { show } = useToast();

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1>Operations</h1></div>
        <ShimmerSection rows={5} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Operations</h1>
          <p>Today&rsquo;s crew roster and route plan.</p>
        </div>
      </div>

      <div className="grid grid-kpi" style={{ marginBottom: 20 }}>
        {model.crews.map((crew) => {
          const stops = model.routeStops.filter((s) => s.crewId === crew.id);
          const done = stops.filter((s) => s.done).length;
          return (
            <div key={crew.id} className="card crew-card">
              <div className="flex-between">
                <strong>{crew.name}</strong>
                <IconTruck />
              </div>
              <span>{crew.plate}</span>
              <span>{crew.members.join(' · ')}</span>
              <span className="text-muted">{done}/{stops.length} stops complete</span>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 className="section-title">Route list</h2>
        {model.routeStops.length === 0 ? (
          <EmptyState title="No stops scheduled" hint="Accept pickup requests to build today's route." />
        ) : (
          <div>
            {model.routeStops.map((stop) => {
              const crew = model.crews.find((c) => c.id === stop.crewId);
              const customer = customerById(stop.customerId);
              const pickup = customer?.pickups.find((p) => p.id === stop.pickupId);
              return (
                <div key={stop.id} className={`stop-row ${stop.done ? 'done' : ''}`}>
                  <div className="stop-main">
                    <strong>{customer?.name ?? stop.customerId}</strong>
                    <span>{stop.address} · {stop.window} · {crew?.name} ({crew?.plate})</span>
                    {pickup && <span>{pickup.id} · {money(pickup.amount)}</span>}
                  </div>
                  <div className="flex-row">
                    <Chip label={stop.done ? 'Completed' : 'Scheduled'} />
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={stop.done}
                      onClick={() => {
                        completeStop(stop.id);
                        show(`Stop completed for ${customer?.name ?? 'customer'}. Earnings captured.`, 'success');
                      }}
                    >
                      <IconCheck style={{ width: 14, height: 14 }} /> Mark complete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
