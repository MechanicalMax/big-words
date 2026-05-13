import './style.css';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const input = document.getElementById('text-input');
const srLive = document.getElementById('sr-live');

// App State
let text = 'Type!';
const fontFamily = 'Arial, sans-serif';

// --- THEMES ---

const THEMES = {
  black: { bg: '#000000', fg: '#ffffff', rainbow: false },
  white: { bg: '#ffffff', fg: '#000000', rainbow: false },
  rainbow: { bg: '#000000', fg: null,    rainbow: true  },
};

let currentTheme = THEMES.black;
let rainbowHue = 0;
let rainbowRafId = null;

function applyTheme(name) {
  const theme = THEMES[name];
  if (!theme) return;

  // Stop any running rainbow animation
  if (rainbowRafId !== null) {
    cancelAnimationFrame(rainbowRafId);
    rainbowRafId = null;
  }

  currentTheme = theme;
  document.documentElement.style.setProperty('background-color', theme.bg);
  document.body.style.backgroundColor = theme.bg;

  if (theme.rainbow) {
    animateRainbow();
  } else {
    render();
  }
}

function animateRainbow() {
  rainbowHue = (rainbowHue + 1) % 360;
  render();
  rainbowRafId = requestAnimationFrame(animateRainbow);
}

// --- SCREEN READER ANNOUNCEMENTS ---

let announceTimer = null;

function announce(msg) {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    srLive.textContent = '';
    requestAnimationFrame(() => {
      srLive.textContent = msg || 'Cleared';
    });
  }, 500);
}

// --- CANVAS RENDERING ---

function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  ctx.scale(dpr, dpr);

  render();
}

function render() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Background
  if (currentTheme.rainbow) {
    ctx.fillStyle = `hsl(${(rainbowHue + 180) % 360}, 100%, 60%)`;
  } else {
    ctx.fillStyle = currentTheme.bg;
  }
  ctx.fillRect(0, 0, width, height);

  if (text.trim() === '') return;

  const baseSize = 100;
  ctx.font = `${baseSize}px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';

  const metrics = ctx.measureText(text);
  const baseAscent = metrics.actualBoundingBoxAscent;
  const baseDescent = metrics.actualBoundingBoxDescent;
  const baseInkHeight = baseAscent + baseDescent;
  const baseInkWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;

  if (baseInkHeight === 0 || baseInkWidth === 0) return;

  const finalScaleFactor = Math.min(width / baseInkWidth, height / baseInkHeight);
  const finalFontSize = baseSize * finalScaleFactor;
  const finalAscent = baseAscent * finalScaleFactor;
  const renderedInkWidth = baseInkWidth * finalScaleFactor;
  const renderedInkHeight = baseInkHeight * finalScaleFactor;

  ctx.font = `${finalFontSize}px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';

  // Foreground color — cycle hue for rainbow, fixed otherwise
  if (currentTheme.rainbow) {
    const bgHue = (rainbowHue + 180) % 360;
    ctx.fillStyle = `hsl(${bgHue}, 100%, 60%)`;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = `hsl(${rainbowHue}, 100%, 60%)`;
  } else {
    ctx.fillStyle = currentTheme.fg;
  }

  const startX = (width - renderedInkWidth) / 2 + metrics.actualBoundingBoxLeft * finalScaleFactor;
  const startY = (height - renderedInkHeight) / 2 + finalAscent;

  ctx.fillText(text, startX, startY);

  canvas.setAttribute('aria-label', text);
}

// --- FULLSCREEN ---

function requestFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  }
}

document.addEventListener('fullscreenchange', () => {
  input.focus();
});

// --- INPUT HANDLING ---

function keepFocused() {
  input.focus({ preventScroll: true });
}

window.addEventListener('load', keepFocused);

document.addEventListener('pointerdown', () => {
  requestFullscreen();
  keepFocused();
});

input.addEventListener('blur', () => {
  setTimeout(keepFocused, 50);
});

// Check if the current text matches a theme name and switch if so
function checkThemeTrigger() {
  const lower = text.toLowerCase();
  if (THEMES[lower] && THEMES[lower] !== currentTheme) {
    const name = lower;
    text = '';
    input.value = '';
    applyTheme(name);
    announce(`Theme changed to ${name}`);
  }
}

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  if (e.key === 'Enter') {
    e.preventDefault();
    text = '';
    input.value = '';
    render();
    announce('Cleared');
    return;
  }

  if (e.key === 'Backspace') {
    e.preventDefault();
    text = text.slice(0, -1);
    input.value = text;
    render();
    announce(text || 'Cleared');
    return;
  }
});

input.addEventListener('input', () => {
  const newValue = input.value;

  if (newValue.length > text.length) {
    text += newValue.slice(text.length);
  } else {
    text = newValue;
  }

  render();
  checkThemeTrigger();
  announce(text);
});

// --- RESIZE ---
window.addEventListener('resize', resizeCanvas);

// --- INIT ---
applyTheme('black');
resizeCanvas();
keepFocused();
