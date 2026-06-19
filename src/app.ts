import { readURL } from './url.js';
import { applyTheme, themeState, setRenderHandler } from './themes.js';
import { render, resizeCanvas } from './renderer.js';
import { keepFocused } from './input.js';
import { setCommandHandler, setFocusHandler, isOpen as isHUDOpen } from './hud.js';
import { executeCommand } from './commands.js';
import { joinRoom } from './room.js';
import { setHUDStateProvider } from './notify.js';

// --- WIRE CALLBACKS (breaks circular imports) ---
setRenderHandler(render);
setFocusHandler(keepFocused);
setCommandHandler(executeCommand);
setHUDStateProvider(isHUDOpen);

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
