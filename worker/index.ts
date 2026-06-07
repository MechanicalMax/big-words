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
      // getWebSockets('emitter') survives hibernation; no in-memory state needed.
      const existingEmitters = this.state.getWebSockets('emitter');
      if (existingEmitters.length > 0) {
        // Reject the newcomer — a host is already active.
        server.accept();
        server.close(4000, 'Room already has an active host.');
        return new Response(null, { status: 101, webSocket: client });
      }

      this.state.acceptWebSocket(server, ['emitter']);

    } else {
      // --- LISTENER ---
      this.state.acceptWebSocket(server, ['listener']);

      // Send the current stored value immediately on connect.
      const currentValue = (await this.state.storage.get<string>('value')) ?? '';
      server.send(currentValue);
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  // Handles all incoming messages from accepted WebSockets.
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const role = this.state.getTags(ws)[0];
    if (role !== 'emitter') return;

    const newString = typeof message === 'string' ? message : '';

    // 1. Persist to SQLite.
    await this.state.storage.put('value', newString);

    // 2. Broadcast to all listeners.
    this.state.getWebSockets('listener').forEach((sock) => sock.send(newString));

    console.log(`[DO] Saved & broadcasted: "${newString}"`);
  }

  // Called when any accepted WebSocket closes — releases the emitter lock automatically.
  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    const role = this.state.getTags(ws)[0];
    if (role === 'emitter') {
      console.log('[DO] Host disconnected — lock released.');
    }
    ws.close(code, reason);
    await this.teardownIfEmpty();
  }

  // Also release on error so a crashed tab doesn't permanently hold the lock.
  async webSocketError(ws: WebSocket) {
    const role = this.state.getTags(ws)[0];
    if (role === 'emitter') {
      console.log('[DO] Host errored — lock released.');
    }
    ws.close(1011, 'WebSocket error.');
    await this.teardownIfEmpty();
  }

  // Wipe storage when the last connection drops — keeps SQLite footprint at zero.
  private async teardownIfEmpty() {
    if (this.state.getWebSockets().length === 0) {
      await this.state.storage.deleteAll();
      console.log('[DO] All connections closed — storage wiped.');
    }
  }
}
