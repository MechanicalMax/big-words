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

    // Tag the socket so we know its role in webSocketMessage
    const role = url.pathname.startsWith('/listen/') ? 'listener' : 'emitter';
    this.state.acceptWebSocket(server, [role]);

    // Send the current stored value immediately to new listeners
    if (role === 'listener') {
      const currentValue = (await this.state.storage.get<string>('value')) ?? '';
      server.send(currentValue);
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  // Called by the runtime for every message received on any accepted WebSocket
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const role = this.state.getTags(ws)[0];

    if (role !== 'emitter') return;

    const newString = typeof message === 'string' ? message : '';

    // 1. Persist to SQLite
    await this.state.storage.put('value', newString);

    // 2. Broadcast to all listeners
    this.state.getWebSockets('listener').forEach((sock) => {
      sock.send(newString);
    });

    console.log(`[DO] Saved & broadcasted: "${newString}"`);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    ws.close(code, reason);
  }
}
