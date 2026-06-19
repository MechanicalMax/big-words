import { readURL } from './url.js';
import { applyTheme, themeState, setRenderHandler } from './themes.js';
import { render, resizeCanvas } from './renderer.js';
import { keepFocused } from './input.js';
import { setCommandHandler, setFocusHandler } from './hud.js';
import { executeCommand } from './commands.js';
import { joinRoom } from './room.js';

// --- WIRE CALLBACKS (breaks circular imports) ---
// themes.ts needs render, hud.ts needs keepFocused — both registered here
// so neither module needs to import from its dependent.
setRenderHandler(render);
setFocusHandler(keepFocused);
setCommandHandler(executeCommand);

// --- INIT ---
const { roomId } = readURL();
applyTheme(themeState.name);
resizeCanvas();
keepFocused();

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', keepFocused);

// If the URL already has ?room=, join immediately.
if (roomId) {
  joinRoom(roomId);
}
