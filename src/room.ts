import { send, parseMessage, isValidTheme, type ServerMessage, type ClientMessage } from './protocol';
import { state } from './state.js';
import { applyTheme, themeState } from './themes.js';
import { render } from './renderer.js';
import { announce } from './announcer.js';
import { notify } from './notify.js';
import { updateURL, clearRoomURL } from './url.js';

// --- ROOM STATE ---

export const roomState = {
  connected: false,
  roomId:    '' as string,
  role:      'viewer' as 'host' | 'viewer',
};

let ws: WebSocket | null = null;

// --- JOIN ---

export function joinRoom(roomId: string): void {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}/room/${roomId}`);

  roomState.roomId = roomId;
  updateURL(roomId); // sets ?room=[id], drops ?m= and ?t=

  ws.onopen = () => {
    // Don't mark connected yet — wait for the role assignment from the server.
  };

  ws.onmessage = (event) => {
    const msg = parseMessage<ServerMessage>(event.data);
    if (!msg) return;

    if (msg.type === 'role') {
      roomState.role      = msg.role;
      roomState.connected = true; // role is known — connection is fully ready
      announce(msg.role === 'host' ? 'You are the host' : 'Joined as viewer');
    }

    if (msg.type === 'data') {
      state.text = msg.text;
      if (isValidTheme(msg.theme)) applyTheme(msg.theme);
      render();
      announce(msg.text || 'Cleared');
    }

    if (msg.type === 'status' && !msg.hostActive) {
      notify('The host has left. Refresh the page to try to become the new host.');
    }
  };

  ws.onerror = () => {
    notify('Connection error. Please try again.');
    _cleanup();
  };

  ws.onclose = (e) => {
    // Ignore clean closes we triggered ourselves via leaveRoom().
    if (!roomState.connected) return;
    console.warn('[Room] WebSocket closed unexpectedly:', e.code, e.reason);
    _cleanup();
  };
}

// --- BROADCAST (host only) ---

export function broadcast(): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  if (roomState.role !== 'host') return;

  const msg: ClientMessage = { type: 'data', text: state.text, theme: themeState.name };
  send(ws, msg);
}

// --- LEAVE ---

export function leaveRoom(): void {
  _cleanup();
  // Navigate back to home — restores "Type!" default state.
  location.href = '/';
}

// --- INTERNAL ---

function _cleanup(): void {
  roomState.connected = false;
  roomState.roomId    = '';
  roomState.role      = 'viewer';
  clearRoomURL();

  if (ws) {
    ws.onclose = null; // prevent re-entrant close handler
    ws.close(1000, 'Left room');
    ws = null;
  }
}
