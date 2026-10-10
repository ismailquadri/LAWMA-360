import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { ShimmerSection } from '../components/Shimmer';
import { useSectionLoading } from '../lib/useSectionLoading';

type ThreadId = 'lawma' | string;

export function Messages() {
  const { model, sendMessageToCustomer, sendMessageToLawma, receiveLawmaAck } = useStore();
  const loading = useSectionLoading('messages');
  const [activeId, setActiveId] = useState<ThreadId>('lawma');
  const [draft, setDraft] = useState('');
  const [seen, setSeen] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const ackTimer = useRef<number | null>(null);

  const customerThreads = model.customers.filter((c) => c.supportMessages.length > 0);

  useEffect(() => {
    setSeen((s) => ({ ...s, [activeId]: activeId === 'lawma' ? model.lawmaThread.length : model.customers.find((c) => c.id === activeId)?.supportMessages.length ?? 0 }));
  }, [activeId, model.lawmaThread.length, model.customers]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [activeId, model.lawmaThread, model.customers]);

  useEffect(() => () => { if (ackTimer.current) window.clearTimeout(ackTimer.current); }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1>Messages</h1></div>
        <ShimmerSection rows={6} />
      </div>
    );
  }

  const activeCustomer = activeId !== 'lawma' ? model.customers.find((c) => c.id === activeId) : undefined;
  const messages = activeId === 'lawma' ? model.lawmaThread : activeCustomer?.supportMessages ?? [];

  function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    if (activeId === 'lawma') {
      sendMessageToLawma(text);
      // Simulated LAWMA acknowledgment arrives ~2s later.
      ackTimer.current = window.setTimeout(() => {
        receiveLawmaAck();
      }, 2000) as unknown as number;
    } else if (activeCustomer) {
      sendMessageToCustomer(activeCustomer.id, text);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Messages</h1>
          <p>LAWMA management and customer support threads.</p>
        </div>
      </div>

      <div className="messages-layout card" style={{ padding: 10 }}>
        <div className="thread-list" role="listbox" aria-label="Conversations">
          <ThreadRow
            active={activeId === 'lawma'}
            onClick={() => setActiveId('lawma')}
            name="LAWMA Management"
            preview={model.lawmaThread[model.lawmaThread.length - 1]?.text ?? 'No messages yet'}
            unread={Math.max(0, model.lawmaThread.length - (seen.lawma ?? 0))}
            pinned
          />
          {customerThreads.map((c) => (
            <ThreadRow
              key={c.id}
              active={activeId === c.id}
              onClick={() => setActiveId(c.id)}
              name={c.name}
              preview={c.supportMessages[c.supportMessages.length - 1]?.text ?? ''}
              unread={Math.max(0, c.supportMessages.length - (seen[c.id] ?? 0))}
            />
          ))}
          {customerThreads.length === 0 && (
            <div className="text-muted" style={{ fontSize: 12, padding: 10 }}>No customer conversations yet.</div>
          )}
        </div>

        <div className="conversation">
          <div className="conversation-messages" ref={scrollRef} aria-live="polite">
            {messages.length === 0 ? (
              <div className="text-muted" style={{ fontSize: 12.5, padding: 20 }}>No messages in this thread yet.</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`msg-bubble ${m.role === 'assistant' ? 'msg-assistant' : 'msg-customer'}`}>
                  <div>{m.text}</div>
                  {m.time && <div className="msg-time">{m.time}</div>}
                </div>
              ))
            )}
          </div>
          <div className="conversation-input">
            <input
              aria-label="Message"
              placeholder={activeId === 'lawma' ? 'Message LAWMA Management…' : `Reply to ${activeCustomer?.name ?? 'customer'}…`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button className="btn btn-primary" onClick={send} disabled={!draft.trim()}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadRow({
  active,
  onClick,
  name,
  preview,
  unread,
  pinned,
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  preview: string;
  unread: number;
  pinned?: boolean;
}) {
  return (
    <button className="thread-item" role="option" aria-selected={active} aria-current={active} onClick={onClick}>
      <span>
        <span className="thread-name">{pinned ? '📌 ' : ''}{name}</span>
        <span className="thread-preview">{preview}</span>
      </span>
      {unread > 0 && <span className="unread-badge">{unread}</span>}
    </button>
  );
}
