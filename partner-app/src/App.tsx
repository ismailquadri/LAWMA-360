import { useState } from 'react';
import { StoreProvider } from './lib/store';
import { ToastProvider } from './lib/toast';
import { Sidebar } from './components/Sidebar';
import { Overview } from './sections/Overview';
import { Requests } from './sections/Requests';
import { Customers } from './sections/Customers';
import { Operations } from './sections/Operations';
import { Finance } from './sections/Finance';
import { Messages } from './sections/Messages';
import { LiveLink } from './sections/LiveLink';
import { Settings } from './sections/Settings';

export type Section = 'overview' | 'requests' | 'customers' | 'operations' | 'finance' | 'messages' | 'live' | 'settings';

function AppShell() {
  const [section, setSection] = useState<Section>('overview');

  return (
    <div className="app-shell">
      <Sidebar active={section} onSelect={setSection} />
      <main className="main" id="main-content">
        {section === 'overview' && <Overview onNavigate={setSection} />}
        {section === 'requests' && <Requests />}
        {section === 'customers' && <Customers />}
        {section === 'operations' && <Operations />}
        {section === 'finance' && <Finance />}
        {section === 'messages' && <Messages />}
        {section === 'live' && <LiveLink />}
        {section === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <AppShell />
      </StoreProvider>
    </ToastProvider>
  );
}
