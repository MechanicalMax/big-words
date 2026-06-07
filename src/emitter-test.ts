// Bare-minimum emitter test — connects to the local Durable Object
// and writes every keystroke to SQLite storage.
// Uses a relative WS URL so it works with @cloudflare/vite-plugin (single port).

const roomId = 'test-room-123';
const wsUrl  = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/emit/${roomId}`;
const ws     = new WebSocket(wsUrl);

const input = document.getElementById('host-input') as HTMLInputElement;

ws.onopen = () => {
  console.log('WebSocket connected!');
  input.disabled = false;
};

input.addEventListener('input', (e) => {
  const value = (e.target as HTMLInputElement).value;
  ws.send(value);
  console.log('Sent:', value);
});

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = (e) => {
  console.warn('WebSocket closed:', e.code, e.reason);
  input.disabled = true;
};
