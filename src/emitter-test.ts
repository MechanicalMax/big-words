import { parse, type ServerMessage, type ClientMessage } from './protocol';

const roomId = 'test-room-123';
const wsUrl  = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/emit/${roomId}`;
const ws     = new WebSocket(wsUrl);

const input      = document.getElementById('host-input') as HTMLInputElement;
const statusEl   = document.getElementById('status') as HTMLParagraphElement;

ws.onopen = () => console.log('WebSocket connected!');

ws.onmessage = (event) => {
  const msg = parse<ServerMessage>(event.data);
  if (!msg) return;

  if (msg.type === 'status' && msg.emitterActive) {
    statusEl.textContent = 'You are the host.';
    input.disabled = false;
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
  statusEl.textContent = e.reason || 'Disconnected.';
  input.disabled = true;
};
