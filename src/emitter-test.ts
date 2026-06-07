import { parse, type ServerMessage, type ClientMessage } from './protocol';

const params   = new URLSearchParams(location.search);
const roomId   = params.get('room') ?? 'test-room-123';
const wsUrl    = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/emit/${roomId}`;
const ws       = new WebSocket(wsUrl);

const input      = document.getElementById('host-input') as HTMLInputElement;
const statusEl   = document.getElementById('status') as HTMLParagraphElement;
const takeoverEl = document.getElementById('takeover') as HTMLDivElement;

ws.onopen = () => console.log('WebSocket connected!');

ws.onmessage = (event) => {
  const msg = parse<ServerMessage>(event.data);
  if (!msg) return;

  if (msg.type === 'status' && msg.emitterActive) {
    statusEl.textContent = 'You are the host.';
    input.disabled = false;
    input.focus();
  }

  if (msg.type === 'error') {
    statusEl.textContent = `Error: ${msg.message}`;
    input.disabled = true;
  }
};

input.addEventListener('input', (e) => {
  const value = (e.target as HTMLInputElement).value;
  const msg: ClientMessage = { type: 'data', value };
  ws.send(JSON.stringify(msg));
});

ws.onerror = (error) => console.error('WebSocket error:', error);

ws.onclose = (e) => {
  console.warn('WebSocket closed:', e.code, e.reason);
  input.disabled = true;

  if (e.code === 4000) {
    // Room is taken — show takeover UI so they can claim it once it's free.
    statusEl.textContent = e.reason || 'Session in use.';
    takeoverEl.hidden = false;
  } else {
    statusEl.textContent = e.reason || 'Disconnected.';
  }
};

// Reload the page to re-attempt claiming the emitter lock.
document.getElementById('takeover-btn')?.addEventListener('click', () => {
  location.reload();
});
