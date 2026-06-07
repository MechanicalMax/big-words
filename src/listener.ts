import { parse, type ServerMessage } from './protocol';

// Pull the roomId from the URL (?room=xxx) so the takeover link targets the right room.
const params  = new URLSearchParams(location.search);
const roomId  = params.get('room') ?? 'test-room-123';
const wsUrl   = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/listen/${roomId}`;
const ws      = new WebSocket(wsUrl);

const displayText = document.getElementById('display-text') as HTMLSpanElement;
const statusEl    = document.getElementById('status') as HTMLParagraphElement;
const takeoverEl  = document.getElementById('takeover') as HTMLDivElement;

function setHostLive(active: boolean) {
  if (active) {
    statusEl.textContent = 'Host is live.';
    takeoverEl.hidden = true;
  } else {
    statusEl.textContent = 'Host has left.';
    takeoverEl.hidden = false;
  }
}

ws.onopen = () => console.log('Connected as listener!');

ws.onmessage = (event) => {
  const msg = parse<ServerMessage>(event.data);
  if (!msg) return;

  if (msg.type === 'data') {
    displayText.textContent = msg.value === '' ? '(Empty)' : msg.value;
  }

  if (msg.type === 'status') {
    setHostLive(msg.emitterActive);
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

// Wire up the takeover button — navigate to the emitter page for this room.
document.getElementById('takeover-btn')?.addEventListener('click', () => {
  location.href = `/emitter-test.html?room=${encodeURIComponent(roomId)}`;
});
