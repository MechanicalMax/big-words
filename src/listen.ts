import { state } from './state.js';
import { applyTheme, THEMES } from './themes.js';
import { render, resizeCanvas } from './renderer.js';
import { parse, type ServerMessage } from './protocol';

const roomId = location.pathname.split('/')[2] ?? '';

if (!roomId) {
  // No room specified — nothing to listen to.
  document.title = 'Big Words';
  state.text = 'No room';
}

const srLive = document.getElementById('sr-live') as HTMLElement;

function announce(msg: string) {
  srLive.textContent = '';
  requestAnimationFrame(() => { srLive.textContent = msg; });
}

// --- INIT CANVAS ---
applyTheme('black');
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// --- WEBSOCKET ---
if (roomId) {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/listen/${roomId}`);

  ws.onmessage = (event) => {
    const msg = parse<ServerMessage>(event.data);
    if (!msg) return;

    if (msg.type === 'data') {
      // Check for a theme trigger before rendering.
      const lower = msg.value.toLowerCase();
      if (THEMES[lower as keyof typeof THEMES]) {
        applyTheme(lower as keyof typeof THEMES);
        state.text = msg.value;
      } else {
        state.text = msg.value;
        render();
      }
      announce(msg.value || 'Cleared');
    }

    if (msg.type === 'status' && !msg.emitterActive) {
      // Host left — prompt the viewer to take over.
      const takeover = window.confirm('The host has left. Do you want to become the host?');
      if (takeover) {
        location.href = `/emit/${roomId}`;
      }
    }
  };

  ws.onerror = () => console.error('Listener WebSocket error.');
  ws.onclose = (e) => console.warn('Listener WebSocket closed:', e.code, e.reason);
}
