import './style.css';

const path = location.pathname;

if (path.startsWith('/listen/')) {
  // Listener route — driven by WebSocket, no input handling.
  import('./src/listen.ts');
} else {
  // Default route — full interactive app.
  import('./src/app.js');
}
