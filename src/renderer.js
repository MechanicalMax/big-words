import { state, fontFamily } from './state.js';
import { themeState } from './themes.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

export function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.style.width  = `${width}px`;
  canvas.style.height = `${height}px`;

  const dpr = window.devicePixelRatio || 1;
  canvas.width  = width  * dpr;
  canvas.height = height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  render();
}

export function render() {
  const { current: theme, rainbowHue } = themeState;
  const width  = window.innerWidth;
  const height = window.innerHeight;

  // Background
  if (theme.rainbow) {
    ctx.fillStyle = `hsl(${(rainbowHue + 180) % 360}, 100%, 60%)`;
  } else {
    ctx.fillStyle = theme.bg;
  }
  ctx.fillRect(0, 0, width, height);

  if (state.text.trim() === '') return;

  const baseSize = 100;
  ctx.font = `${baseSize}px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';

  const metrics = ctx.measureText(state.text);
  const baseAscent   = metrics.actualBoundingBoxAscent;
  const baseDescent  = metrics.actualBoundingBoxDescent;
  const baseInkHeight = baseAscent + baseDescent;
  const baseInkWidth  = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;

  if (baseInkHeight === 0 || baseInkWidth === 0) return;

  const finalScaleFactor  = Math.min(width / baseInkWidth, height / baseInkHeight);
  const finalFontSize     = baseSize * finalScaleFactor;
  const finalAscent       = baseAscent * finalScaleFactor;
  const renderedInkWidth  = baseInkWidth  * finalScaleFactor;
  const renderedInkHeight = baseInkHeight * finalScaleFactor;

  ctx.font = `${finalFontSize}px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';

  // Foreground color
  if (theme.rainbow) {
    const bgHue = (rainbowHue + 180) % 360;
    ctx.fillStyle = `hsl(${bgHue}, 100%, 60%)`;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = `hsl(${rainbowHue}, 100%, 60%)`;
  } else {
    ctx.fillStyle = theme.fg;
  }

  const startX = (width  - renderedInkWidth)  / 2 + metrics.actualBoundingBoxLeft * finalScaleFactor;
  const startY = (height - renderedInkHeight) / 2 + finalAscent;

  ctx.fillText(state.text, startX, startY);

  canvas.setAttribute('aria-label', state.text);
}
