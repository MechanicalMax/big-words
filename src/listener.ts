import { parse, type ServerMessage } from './protocol';

const roomId = 'test-room-123';
const wsUrl  = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/listen/${roomId}`;
const ws     = new WebSocket(wsUrl);

const displayText = document.getElementById('display-text') as HTMLSpanElement;
const statusEl    = document.getElementById('status') as HTMLParagraphElement;

ws.onopen = () => console.log('Connected as listener!');

ws.onmessage = (event) => {
  const msg = parse<ServerMessage>(event.data);
  if (!msg) return;

  if (msg.type === 'data') {
    displayText.textContent = msg.value === '' ? '(Empty)' : msg.value;
  }

  if (msg.type === 'status') {
    statusEl.textContent = msg.emitterActive ? 'Host is live.' : 'Waiting for host...';
  }

  if (msg.type === 'error') {
    statusEl.textContent = `Error: ${msg.message}`;
  }
};

ws.onerror = (error) => console.error('WebSocket error:', error);

ws.onclose = (e) => {
  console.warn('WebSocket closed:', e.code, e.reason);
  statusEl.textContent = 'Disconnected.';
};
