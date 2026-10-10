import { useState } from 'react';
import { useStore } from '../lib/store';
import { useToast } from '../lib/toast';
import { Dialog } from '../components/Dialog';
import { IconReset } from '../components/icons';

export function Settings() {
  const { model, updateProfile, reset } = useStore();
  const { show } = useToast();
  const [name, setName] = useState(model.profile.name);
  const [areas, setAreas] = useState(model.profile.areas);
  const [contact, setContact] = useState(model.profile.contact);
  const [confirmingReset, setConfirmingReset] = useState(false);

  function saveProfile() {
    updateProfile({ name: name.trim(), areas: areas.trim(), contact: contact.trim() });
    show('Partner profile updated.', 'success');
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Partner profile, notifications, and demonstration controls.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, maxWidth: 480 }}>
        <h2 className="section-title">Partner profile</h2>
        <div className="field-group">
          <label htmlFor="profile-name">Business name</label>
          <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field-group">
          <label htmlFor="profile-areas">Service areas</label>
          <input id="profile-areas" value={areas} onChange={(e) => setAreas(e.target.value)} />
        </div>
        <div className="field-group">
          <label htmlFor="profile-contact">Contact</label>
          <input id="profile-contact" value={contact} onChange={(e) => setContact(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={saveProfile}>Save changes</button>
      </div>

      <div className="card" style={{ marginBottom: 20, maxWidth: 480 }}>
        <h2 className="section-title">Notifications</h2>
        <ToggleRow
          label="New requests"
          checked={model.profile.notifyRequests}
          onChange={(v) => updateProfile({ notifyRequests: v })}
        />
        <ToggleRow
          label="Customer messages"
          checked={model.profile.notifyMessages}
          onChange={(v) => updateProfile({ notifyMessages: v })}
        />
        <ToggleRow
          label="Remittance reminders"
          checked={model.profile.notifyRemittance}
          onChange={(v) => updateProfile({ notifyRemittance: v })}
        />
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <h2 className="section-title">Demonstration</h2>
        <p className="text-muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
          Resets all customers, requests, operations, and finance data back to the seeded demo state.
        </p>
        <button className="btn btn-danger" onClick={() => setConfirmingReset(true)}>
          <IconReset style={{ width: 14, height: 14 }} /> Reset demonstration
        </button>
      </div>

      <p className="footer-note">Demonstration · fictional records · no real payments</p>

      {confirmingReset && (
        <Dialog title="Reset demonstration?" onClose={() => setConfirmingReset(false)}>
          <p style={{ fontSize: 13.5 }}>This clears all local demo data and reseeds the original fictional records. This cannot be undone.</p>
          <div className="dialog-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmingReset(false)}>Cancel</button>
            <button
              className="btn btn-danger"
              onClick={() => {
                reset();
                setConfirmingReset(false);
                show('Demonstration reset.', 'info');
              }}
            >
              Reset
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="toggle-row">
      <span style={{ fontSize: 13 }}>{label}</span>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
        <span className="switch-track" />
        <span className="switch-thumb" />
      </label>
    </div>
  );
}
