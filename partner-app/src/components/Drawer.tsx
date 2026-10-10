import React, { useEffect, useRef } from 'react';
import { IconClose } from './icons';

export function Drawer({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Customer detail" tabIndex={-1} ref={ref}>
        <button className="btn-icon" aria-label="Close drawer" onClick={onClose} style={{ alignSelf: 'flex-end' }}>
          <IconClose />
        </button>
        {children}
      </div>
    </>
  );
}
