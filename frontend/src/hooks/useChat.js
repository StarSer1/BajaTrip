import { useCallback, useEffect, useRef, useState } from 'react';

// Conexión WebSocket con la sala de chat del Worker (/api/chat). Se reconecta sola con
// espera creciente si se cae la red o se reinicia el servidor.
export default function useChat(enabled) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle');
  const [online, setOnline] = useState(0);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let retry = 0;
    let timer;
    let stopped = false;

    function connect() {
      setStatus('connecting');
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${location.host}/api/chat`);
      socketRef.current = socket;

      socket.addEventListener('open', () => { retry = 0; setStatus('open'); setError(''); });
      socket.addEventListener('message', (event) => {
        let data;
        try { data = JSON.parse(event.data); } catch { return; }
        if (data.type === 'history') setMessages(data.messages);
        else if (data.type === 'message') setMessages((list) => [...list.slice(-99), data.message]);
        else if (data.type === 'presence') setOnline(data.count);
        else if (data.type === 'error') setError(data.message);
      });
      socket.addEventListener('close', () => {
        if (socketRef.current === socket) socketRef.current = null;
        if (stopped) return;
        setStatus('closed');
        timer = setTimeout(connect, Math.min(1000 * 2 ** retry++, 15000));
      });
    }

    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [enabled]);

  const send = useCallback((name, text) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ type: 'message', name, text }));
    return true;
  }, []);

  return { messages, status, online, error, send };
}
