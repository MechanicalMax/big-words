// Shared WebSocket message contract used by both the worker and frontends.

// --- THEMES ---

export const VALID_THEMES = ['black', 'white', 'rainbow'] as const;
export type Theme = typeof VALID_THEMES[number];

export function isValidTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (VALID_THEMES as readonly string[]).includes(value);
}

// --- MESSAGES ---

// Server → client
export type ServerMessage =
  | { type: 'data';   text: string; theme: Theme }   // room state (initial or live update)
  | { type: 'role';   role: 'host' | 'viewer' }      // role assigned on connect
  | { type: 'status'; hostActive: false };            // host has disconnected

// Client → server (host only)
export type ClientMessage =
  | { type: 'data'; text: string; theme: Theme };

// --- COMMANDS ---

export type Command =
  | { cmd: 'theme'; theme: Theme }
  | { cmd: 'room';  roomId: string }
  | { cmd: 'exit' };

export type ParseCommandResult =
  | { ok: true;  command: Command }
  | { ok: false; error: string };

/**
 * Parse a raw input string into a Command.
 * Input must begin with "/" — call only when that is already known.
 * Returns an error description for any validation failure.
 */
export function parseCommand(raw: string): ParseCommandResult {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) {
    return { ok: false, error: 'Commands must start with "/".' };
  }

  const parts = trimmed.slice(1).trim().split(/\s+/);
  const cmd   = parts[0].toLowerCase();
  const arg   = parts.slice(1).join(' ').trim();

  switch (cmd) {
    case 'theme': {
      if (!arg) {
        return { ok: false, error: `Usage: /theme [${VALID_THEMES.join(' | ')}]` };
      }
      if (!isValidTheme(arg)) {
        return { ok: false, error: `Unknown theme "${arg}". Available: ${VALID_THEMES.join(', ')}.` };
      }
      return { ok: true, command: { cmd: 'theme', theme: arg } };
    }

    case 'room': {
      if (!arg) {
        return { ok: false, error: 'Usage: /room [id]' };
      }
      // Room IDs: alphanumeric, hyphens, underscores, 1–64 chars.
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(arg)) {
        return { ok: false, error: 'Room ID may only contain letters, numbers, hyphens, and underscores (max 64 chars).' };
      }
      return { ok: true, command: { cmd: 'room', roomId: arg } };
    }

    case 'exit': {
      return { ok: true, command: { cmd: 'exit' } };
    }

    default:
      return { ok: false, error: `Unknown command "/${cmd}".` };
  }
}

// --- WIRE HELPERS ---

export const send = (ws: WebSocket, msg: ServerMessage | ClientMessage): void =>
  ws.send(JSON.stringify(msg));

/**
 * Parse and validate an inbound WebSocket message.
 * Returns null for any malformed or invalid payload.
 */
export function parseMessage<T extends ServerMessage | ClientMessage>(
  raw: string | ArrayBuffer
): T | null {
  try {
    const obj = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw));
    if (typeof obj !== 'object' || obj === null || typeof obj.type !== 'string') return null;
    return obj as T;
  } catch {
    return null;
  }
}

/**
 * Validate an inbound ClientMessage from a host.
 * Checks structure and that theme is a known value.
 */
export function validateClientMessage(raw: string | ArrayBuffer): ClientMessage | null {
  const msg = parseMessage<ClientMessage>(raw);
  if (!msg) return null;
  if (msg.type !== 'data') return null;
  if (typeof msg.text !== 'string') return null;
  if (!isValidTheme(msg.theme)) return null;
  return msg;
}
