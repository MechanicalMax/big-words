import { readURL } from './url.js';
import { applyTheme, themeState } from './themes.js';
import { resizeCanvas } from './renderer.js';
import { keepFocused } from './input.js';
import { setCommandHandler } from './hud.js';
import { executeCommand } from './commands.js';
import { joinRoom } from './room.js';

// --- INIT ---
const { roomId } = readURL();
applyTheme(themeState.name);
resizeCanvas();
keepFocused();

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', keepFocused);

// Wire the HUD to the command executor.
setCommandHandler(executeCommand);

// If the URL already has ?room=, join immediately.
if (roomId) {
  joinRoom(roomId);
}
