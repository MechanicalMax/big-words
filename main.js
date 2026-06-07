import './style.css';
import { readURL, updateURL } from './src/url.js';
import { applyTheme } from './src/themes.js';
import { resizeCanvas } from './src/renderer.js';
import { keepFocused } from './src/input.js';
import { themeState } from './src/themes.js';

// --- INIT ---
readURL();
applyTheme(themeState.name);
resizeCanvas();
keepFocused();
updateURL();

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', keepFocused);
