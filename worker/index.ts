import { send, parse, type ServerMessage, type ClientMessage } from '../src/protocol';

export interface Env {
  ROOM: DurableObjectNamespace;
  ASSETS: Fetcher;
}

// --- ROUTER ---

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    // Intercept WebSocket upgrades to /room/[id] — everything else is the SPA.
    if (url.pathname.startsWith('/room/') && request.headers.get('Upgrade') === 'websocket') {
      const roomId = url.pathname.slice(6); // strip "/room/"
      const stub   = env.ROOM.get(env.ROOM.idFromName(roomId));
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};

// --- DURABLE OBJECT ---

export class Room {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const { 0: client, 1: server } = new WebSocketPair();
    const isHost = this.state.getWebSockets('host').length === 0;
    const role   = isHost ? 'host' : 'viewer';

    this.state.acceptWebSocket(server, [role]);

    // Send role assignment.
    send(server, { type: 'role', role });

    // Send current room state.
    const text  = (await this.state.storage.get<string>('text'))  ?? '';
    const theme = (await this.state.storage.get<string>('theme')) ?? 'black';
    send(server, { type: 'data', text, theme });

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // Only the host can push state.
    if (this.state.getTags(ws)[0] !== 'host') return;

    const msg = parse<ClientMessage>(message);
    if (!msg || msg.type !== 'data') return;

    // Persist both fields.
    await this.state.storage.put('text',  msg.text);
    await this.state.storage.put('theme', msg.theme);

    // Broadcast to all viewers.
    const payload: ServerMessage = { type: 'data', text: msg.text, theme: msg.theme };
    this.state.getWebSockets('viewer').forEach((sock) => send(sock, payload));
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    ws.close(code, reason);
    await this.teardown(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    ws.close(1011, 'WebSocket error.');
    await this.teardown(ws);
  }

  private async teardown(ws: WebSocket): Promise<void> {
    const role = this.state.getTags(ws)[0];

    if (role === 'host') {
      // Notify all viewers that the host has left.
      const payload: ServerMessage = { type: 'status', hostActive: false };
      this.state.getWebSockets('viewer').forEach((sock) => send(sock, payload));
    }

    // Wipe storage when the room is empty.
    if (this.state.getWebSockets().length === 0) {
      await this.state.storage.deleteAll();
    }
  }
}
