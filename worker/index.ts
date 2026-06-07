import { send, parse, type ServerMessage, type ClientMessage } from '../src/protocol';

export interface Env {
  STRING_STATE_ROOM: DurableObjectNamespace;
}

// --- ROUTER (Front Door) ---

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/emit/') || url.pathname.startsWith('/listen/')) {
      const roomId = url.pathname.split('/')[2];
      const id     = env.STRING_STATE_ROOM.idFromName(roomId);
      const stub   = env.STRING_STATE_ROOM.get(id);
      return stub.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};

// --- DURABLE OBJECT (State Manager) ---

export class StringStateRoom {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 400 });
    }

    const url = new URL(request.url);
    const { 0: client, 1: server } = new WebSocketPair();

    if (url.pathname.startsWith('/emit/')) {
      // --- LOCK CHECK ---
      if (this.state.getWebSockets('emitter').length > 0) {
        server.accept();
        send(server, { type: 'error', message: 'Session in use' });
        server.close(4000, 'Session in use');
        return new Response(null, { status: 101, webSocket: client });
      }

      this.state.acceptWebSocket(server, ['emitter']);
      // Confirm to the emitter that they now hold the lock.
      send(server, { type: 'status', emitterActive: true });
      // Notify all existing listeners that a host is now live.
      const hostJoined: ServerMessage = { type: 'status', emitterActive: true };
      this.state.getWebSockets('listener').forEach((sock) => send(sock, hostJoined));

    } else {
      // --- LISTENER ---
      this.state.acceptWebSocket(server, ['listener']);

      // Send current value + emitter presence immediately on connect.
      const currentValue    = (await this.state.storage.get<string>('value')) ?? '';
      const emitterActive   = this.state.getWebSockets('emitter').length > 0;
      send(server, { type: 'data',   value: currentValue });
      send(server, { type: 'status', emitterActive });
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const role = this.state.getTags(ws)[0];
    if (role !== 'emitter') return;

    const msg = parse<ClientMessage>(message);
    if (!msg || msg.type !== 'data') return;

    // 1. Persist to SQLite.
    await this.state.storage.put('value', msg.value);

    // 2. Broadcast to all listeners.
    const payload: ServerMessage = { type: 'data', value: msg.value };
    this.state.getWebSockets('listener').forEach((sock) => send(sock, payload));

    console.log(`[DO] Saved & broadcasted: "${msg.value}"`);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    ws.close(code, reason);
    await this.notifyAndTeardown(ws);
  }

  async webSocketError(ws: WebSocket) {
    ws.close(1011, 'WebSocket error.');
    await this.notifyAndTeardown(ws);
  }

  private async notifyAndTeardown(ws: WebSocket) {
    const role = this.state.getTags(ws)[0];

    if (role === 'emitter') {
      console.log('[DO] Host disconnected — lock released.');
      // Tell all listeners the host is gone.
      const payload: ServerMessage = { type: 'status', emitterActive: false };
      this.state.getWebSockets('listener').forEach((sock) => send(sock, payload));
    }

    if (this.state.getWebSockets().length === 0) {
      await this.state.storage.deleteAll();
      console.log('[DO] All connections closed — storage wiped.');
    }
  }
}
