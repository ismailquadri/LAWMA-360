import { useStore } from '../lib/store';
import {
  IconOverview,
  IconRequests,
  IconCustomers,
  IconOperations,
  IconFinance,
  IconMessages,
  IconLive,
  IconSettings,
} from './icons';
import type { Section } from '../App';

const items: { id: Section; label: string; icon: typeof IconOverview }[] = [
  { id: 'overview', label: 'Overview', icon: IconOverview },
  { id: 'requests', label: 'Requests', icon: IconRequests },
  { id: 'customers', label: 'Customers', icon: IconCustomers },
  { id: 'operations', label: 'Operations', icon: IconOperations },
  { id: 'finance', label: 'Finance', icon: IconFinance },
  { id: 'messages', label: 'Messages', icon: IconMessages },
  { id: 'live', label: 'Live Link', icon: IconLive },
  { id: 'settings', label: 'Settings', icon: IconSettings },
];

export function Sidebar({ active, onSelect }: { active: Section; onSelect: (s: Section) => void }) {
  const { model } = useStore();
  return (
    <nav className="sidebar" aria-label="Primary">
      <div className="sidebar-brand">
        <img src="/favicon.png" alt="" />
        <div className="sidebar-brand-text">
          <strong>SmartWaste360</strong>
          <span>Partner console</span>
        </div>
      </div>
      <ul className="nav-list">
        {items.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              className="nav-item"
              aria-current={active === id ? 'page' : undefined}
              onClick={() => onSelect(id)}
            >
              <Icon />
              <span className="nav-label">{label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="sidebar-identity">
        <strong className="full">{model.profile.name}</strong>
        <span>{model.profile.areas}</span>
      </div>
    </nav>
  );
}
