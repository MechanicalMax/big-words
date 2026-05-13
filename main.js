import './style.css';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const input = document.getElementById('text-input');
const srLive = document.getElementById('sr-live');

// App State
let text = 'Type!';
const fontFamily = 'Arial, sans-serif';

// --- SCREEN READER ANNOUNCEMENTS ---

let announceTimer = null;

/**
 * Debounced announcement so screen readers aren't flooded on every keystroke.
 */
function announce(msg) {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    srLive.textContent = '';
    // Force re-announcement by toggling content
    requestAnimationFrame(() => {
      srLive.textContent = msg || 'Cleared';
    });
  }, 500);
}

// --- CANVAS RENDERING ---

/**
 * Sizes the canvas to the window and handles DPI scaling.
 */
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

/**
 * Renders text scaled to fill the screen as large as possible.
 */
function render() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  ctx.clearRect(0, 0, width, height);

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
  ctx.fillStyle = '#ffffff';

  const startX = (width - renderedInkWidth) / 2 + metrics.actualBoundingBoxLeft * finalScaleFactor;
  const startY = (height - renderedInkHeight) / 2 + finalAscent;

  ctx.fillText(text, startX, startY);

  // Keep canvas aria-label in sync for screen readers
  canvas.setAttribute('aria-label', text);
}

// --- FULLSCREEN ---

/**
 * Requests fullscreen on the document element.
 * Must be called from within a user gesture.
 */
function requestFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {
      // Silently ignore — some browsers/contexts block fullscreen (e.g. iframes)
    });
  }
}

// Re-focus the input whenever fullscreen changes (focus can be lost on transition)
document.addEventListener('fullscreenchange', () => {
  input.focus();
});

// --- INPUT HANDLING ---

/**
 * Keeps the hidden input focused so keyboard events are always captured.
 * We use the input element rather than raw keydown so mobile keyboards work too.
 */
function keepFocused() {
  input.focus({ preventScroll: true });
}

// Focus on load
window.addEventListener('load', keepFocused);

// Re-focus if the user clicks/taps anywhere
document.addEventListener('pointerdown', (e) => {
  // First interaction: request fullscreen (requires user gesture)
  requestFullscreen();
  keepFocused();
});

// Prevent the input from losing focus to anything else
input.addEventListener('blur', () => {
  // Small delay so legitimate focus changes (e.g. browser UI) aren't fought
  setTimeout(keepFocused, 50);
});

// Desktop: intercept keydown for Backspace and Enter before the input value changes
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

// Desktop + Mobile: sync single character additions via the input event
input.addEventListener('input', () => {
  // input.value may contain the full string on mobile (e.g. after autocomplete)
  // On desktop it will be one character ahead of `text` after a printable key
  const newValue = input.value;

  if (newValue.length > text.length) {
    // Characters were added — append only the new portion
    text += newValue.slice(text.length);
  } else {
    // Fallback: trust the input value directly (e.g. mobile IME composition)
    text = newValue;
  }

  render();
  announce(text);
});

// --- RESIZE ---
window.addEventListener('resize', resizeCanvas);

// --- INIT ---
resizeCanvas();
keepFocused();
