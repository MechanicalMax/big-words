export interface Env {
  STRING_STATE_ROOM: DurableObjectNamespace;
}

// --- ROUTER (Front Door) ---

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/emit/')) {
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

    const { 0: client, 1: server } = new WebSocketPair();

    this.state.acceptWebSocket(server);

    server.addEventListener('message', async (event) => {
      const newString = event.data as string;
      await this.state.storage.put('value', newString);
      console.log(`[DO Storage] Saved: "${newString}"`);
    });

    return new Response(null, { status: 101, webSocket: client });
  }
}
