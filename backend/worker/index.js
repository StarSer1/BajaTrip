import { DurableObject } from 'cloudflare:workers';

// Worker de BajaTrip: /api/chat abre el WebSocket del chat; el resto de las rutas las
// atienden los archivos estáticos de la compilación (dist/).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/chat') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Se esperaba una conexión WebSocket', { status: 426 });
      }
      // Una sola sala para todo el sitio: siempre el mismo Durable Object.
      const room = env.CHAT_ROOM.get(env.CHAT_ROOM.idFromName('general'));
      return room.fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};

const HISTORY_SIZE = 50;
const MAX_NAME = 24;
const MAX_TEXT = 500;
const MIN_INTERVAL_MS = 800;

// Sala de chat. Usa la API de hibernación: Cloudflare mantiene abiertos los sockets aunque
// el objeto se descargue de memoria, así que solo se cobra el tiempo en que hay mensajes.
export class ChatRoom extends DurableObject {
  async fetch() {
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ lastMessageAt: 0 });

    const history = (await this.ctx.storage.get('history')) ?? [];
    server.send(JSON.stringify({ type: 'history', messages: history }));
    this.broadcastPresence();

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    if (data?.type !== 'message') return;

    const name = clean(data.name, MAX_NAME) || 'Viajero';
    const text = clean(data.text, MAX_TEXT);
    if (!text) return;

    // Límite por conexión para que nadie inunde la sala.
    const attachment = ws.deserializeAttachment() ?? { lastMessageAt: 0 };
    const now = Date.now();
    if (now - attachment.lastMessageAt < MIN_INTERVAL_MS) {
      ws.send(JSON.stringify({ type: 'error', message: 'Vas muy rápido: espera un momento antes de enviar otro mensaje.' }));
      return;
    }
    ws.serializeAttachment({ ...attachment, lastMessageAt: now });

    const message = { id: crypto.randomUUID(), name, text, time: now };
    const history = (await this.ctx.storage.get('history')) ?? [];
    history.push(message);
    await this.ctx.storage.put('history', history.slice(-HISTORY_SIZE));

    this.broadcast({ type: 'message', message });
  }

  webSocketClose(ws) {
    this.broadcastPresence(ws);
  }

  webSocketError(ws) {
    this.broadcastPresence(ws);
  }

  broadcastPresence(leaving) {
    const count = this.ctx.getWebSockets().filter((socket) => socket !== leaving).length;
    this.broadcast({ type: 'presence', count }, leaving);
  }

  broadcast(payload, except) {
    const text = JSON.stringify(payload);
    for (const socket of this.ctx.getWebSockets()) {
      if (socket === except) continue;
      try {
        socket.send(text);
      } catch {
        // El socket ya se estaba cerrando; Cloudflare lo retira solo.
      }
    }
  }
}

// Texto plano de una línea (salvo el mensaje, que conserva saltos), recortado y sin
// caracteres de control. React escapa el HTML al mostrarlo.
function clean(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').trim().slice(0, max);
}
