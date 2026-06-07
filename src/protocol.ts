// Shared WebSocket message contract used by both the worker and frontends.

export type ServerMessage =
  | { type: 'data';   value: string }
  | { type: 'status'; emitterActive: boolean }
  | { type: 'error';  message: string };

export type ClientMessage =
  | { type: 'data'; value: string };

export const send = (ws: WebSocket, msg: ServerMessage | ClientMessage) =>
  ws.send(JSON.stringify(msg));

export const parse = <T>(raw: string | ArrayBuffer): T | null => {
  try {
    return JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)) as T;
  } catch {
    return null;
  }
};
