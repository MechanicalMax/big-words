import { readURL, updateURL } from './url.js';
import { applyTheme, themeState } from './themes.js';
import { resizeCanvas } from './renderer.js';
import { keepFocused } from './input.js';

// --- INIT ---
readURL();
applyTheme(themeState.name);
resizeCanvas();
keepFocused();
updateURL();

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', keepFocused);
