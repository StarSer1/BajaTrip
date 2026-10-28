import { useEffect, useId, useRef, useState } from 'react';
import useChat from '../hooks/useChat.js';

const NAME_KEY = 'bajatrip-chat-nombre';

function readName() {
  try { return localStorage.getItem(NAME_KEY) ?? ''; } catch { return ''; }
}

function saveName(name) {
  try { localStorage.setItem(NAME_KEY, name); } catch { /* sin almacenamiento se pide de nuevo */ }
}

const timeFormat = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' });

const statusText = {
  idle: '',
  connecting: 'Conectando…',
  open: '',
  closed: 'Sin conexión, reintentando…',
};

// Chat en vivo para todas las personas conectadas al sitio. Solo abre el WebSocket
// cuando el panel se despliega por primera vez.
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [name, setName] = useState(readName);
  const [draft, setDraft] = useState('');
  const { messages, status, online, error, send } = useChat(started);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (open) setStarted(true);
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function handleSubmit(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const author = name.trim() || 'Viajero';
    if (send(author, text)) {
      saveName(name.trim());
      setDraft('');
    }
  }

  return <div className="chat">
    {open && <section id={panelId} className="chat__panel" aria-label="Chat de viajeros">
      <header className="chat__header">
        <div>
          <h2>Chat de viajeros</h2>
          <p>{status === 'open'
            ? `${online} ${online === 1 ? 'persona conectada' : 'personas conectadas'}`
            : statusText[status]}</p>
        </div>
        <button type="button" className="chat__close" onClick={() => setOpen(false)} aria-label="Cerrar chat">×</button>
      </header>

      <ol className="chat__messages" ref={listRef} aria-live="polite">
        {messages.length === 0 && <li className="chat__empty">Aún no hay mensajes. ¡Saluda a los demás viajeros!</li>}
        {messages.map((message) => <li key={message.id} className="chat__message">
          <span className="chat__meta"><b>{message.name}</b> <time dateTime={new Date(message.time).toISOString()}>{timeFormat.format(message.time)}</time></span>
          <p>{message.text}</p>
        </li>)}
      </ol>

      {error && <p className="chat__error" role="alert">{error}</p>}

      <form className="chat__form" onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor={`${panelId}-nombre`}>Tu nombre</label>
        <input id={`${panelId}-nombre`} className="chat__name" value={name} maxLength={24}
          onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" autoComplete="nickname" />
        <div className="chat__send">
          <label className="visually-hidden" htmlFor={`${panelId}-mensaje`}>Mensaje</label>
          <input id={`${panelId}-mensaje`} ref={inputRef} value={draft} maxLength={500}
            onChange={(event) => setDraft(event.target.value)} placeholder="Escribe un mensaje…" autoComplete="off" />
          <button type="submit" disabled={status !== 'open' || !draft.trim()}>Enviar</button>
        </div>
      </form>
    </section>}

    <button type="button" className="chat__toggle" aria-expanded={open} aria-controls={open ? panelId : undefined}
      onClick={() => setOpen((value) => !value)}>
      {open ? 'Cerrar chat' : 'Chat en vivo'}
    </button>
  </div>;
}
