type Tone = 'amber' | 'green' | 'red' | 'neutral';

const statusTone: Record<string, Tone> = {
  Requested: 'amber',
  Pending: 'amber',
  Accepted: 'green',
  Scheduled: 'amber',
  Collected: 'amber',
  Completed: 'green',
  Approved: 'green',
  Active: 'green',
  Declined: 'red',
  Cancelled: 'red',
  'Attention needed': 'red',
  Open: 'red',
  'In review': 'amber',
  Resolved: 'green',
  Allocated: 'amber',
  'Out for delivery': 'amber',
  Delivered: 'amber',
};

export function Chip({ label, tone }: { label: string; tone?: Tone }) {
  const t = tone ?? statusTone[label] ?? 'neutral';
  return <span className={`chip chip-${t}`}>{label}</span>;
}
