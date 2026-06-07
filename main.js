import './style.css';

const path = location.pathname;

if (path.startsWith('/listen/')) {
  // Listener route — driven by WebSocket, no input handling.
  import('./src/listen.ts');
} else if (path.startsWith('/emit/')) {
  // Emitter route — full app + broadcasts keystrokes via WebSocket.
  import('./src/emit.ts');
} else {
  // Default route — full interactive app, no sync.
  import('./src/app.js');
}
