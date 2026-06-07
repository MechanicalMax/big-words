import { readURL, updateURL } from './url.js';
import { applyTheme, themeState } from './themes.js';
import { resizeCanvas } from './renderer.js';
import { keepFocused } from './input.js';
import { state } from './state.js';
import { send, parse, type ServerMessage, type ClientMessage } from './protocol';

// --- STANDARD APP INIT (same as app.js) ---
readURL();
applyTheme(themeState.name);
resizeCanvas();
keepFocused();
updateURL();

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', keepFocused);

// --- WEBSOCKET ---
const roomId = location.pathname.split('/')[2] ?? '';
const proto  = location.protocol === 'https:' ? 'wss' : 'ws';
const ws     = new WebSocket(`${proto}://${location.host}/emit/${roomId}`);

ws.onopen = () => console.log('[Emit] WebSocket connected.');

ws.onmessage = (event) => {
  const msg = parse<ServerMessage>(event.data);
  if (!msg) return;

  // Server confirmed we hold the lock — nothing extra needed, app is already running.
  if (msg.type === 'status' && msg.emitterActive) {
    console.log('[Emit] Lock acquired.');
  }

  if (msg.type === 'error') {
    console.warn('[Emit] Server error:', msg.message);
  }
};

ws.onerror = () => console.error('[Emit] WebSocket error.');

ws.onclose = (e) => {
  console.warn('[Emit] WebSocket closed:', e.code, e.reason);
  if (e.code === 4000) {
    // Room is taken — redirect to the listener page.
    location.replace(`/listen/${roomId}`);
  }
};

// --- BROADCAST ON CHANGE ---
// Intercept every state change by observing the hidden input after input.js
// has already updated state.text.
const input = document.getElementById('text-input') as HTMLInputElement;

function broadcast() {
  if (ws.readyState !== WebSocket.OPEN) return;
  const msg: ClientMessage = { type: 'data', value: state.text };
  send(ws, msg);
}

input.addEventListener('input', broadcast);

// Keyboard handler in input.js fires before this, so state.text is already
// updated by the time our listener runs on the next tick.
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Enter' || e.key === 'Backspace') {
    // Defer so input.js processes the key first.
    setTimeout(broadcast, 0);
  }
}, { capture: false });
