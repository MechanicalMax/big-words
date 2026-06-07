const roomId = 'test-room-123';
const wsUrl  = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/listen/${roomId}`;
const ws     = new WebSocket(wsUrl);

const displayText = document.getElementById('display-text') as HTMLSpanElement;

ws.onopen = () => {
  console.log('Connected as listener!');
};

ws.onmessage = (event) => {
  const data = event.data as string;
  displayText.textContent = data === '' ? '(Empty)' : data;
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = (e) => {
  console.warn('WebSocket closed:', e.code, e.reason);
  displayText.textContent = '(Disconnected)';
};
