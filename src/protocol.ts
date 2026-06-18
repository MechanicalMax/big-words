// Shared WebSocket message contract used by both the worker and frontends.

// Server → client
export type ServerMessage =
  | { type: 'data';   text: string; theme: string }   // room state (initial or live update)
  | { type: 'role';   role: 'host' | 'viewer' }       // role assigned on connect
  | { type: 'status'; hostActive: false };             // host has disconnected

// Client → server (host only)
export type ClientMessage =
  | { type: 'data'; text: string; theme: string };

export const send = (ws: WebSocket, msg: ServerMessage | ClientMessage): void =>
  ws.send(JSON.stringify(msg));

export const parse = <T>(raw: string | ArrayBuffer): T | null => {
  try {
    return JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)) as T;
  } catch {
    return null;
  }
};
