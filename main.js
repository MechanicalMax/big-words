import './style.css';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const fsBtn = document.getElementById('fs-btn');

// App State
let text = "Type!";
const fontFamily = "Arial, sans-serif";

/**
 * Sizes the canvas strictly to the window dimensions and handles DPI scaling
 */
function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Set physical CSS bounds
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // Handle Retina/High-DPI displays
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  
  // Normalize drawing coordinates back to CSS pixels
  ctx.scale(dpr, dpr);

  render();
}

/**
 * Core rendering logic utilizing pixel-perfect mathematical scaling
 */
function render() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Clear previous frame
  ctx.clearRect(0, 0, width, height);

  // If text is empty, nothing to draw
  if (text.trim() === "") return;

  const baseSize = 100;
  ctx.font = `${baseSize}px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';

  const metrics = ctx.measureText(text);

  const baseAscent = metrics.actualBoundingBoxAscent;
  const baseDescent = metrics.actualBoundingBoxDescent;
  
  const baseInkHeight = baseAscent + baseDescent;
  const baseInkWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;

  // Prevent division by zero if invisible characters are typed
  if (baseInkHeight === 0 || baseInkWidth === 0) return;

  const scaleFactorY = height / baseInkHeight;
  const scaleFactorX = width / baseInkWidth;

  const finalScaleFactor = Math.min(scaleFactorX, scaleFactorY);
  const finalFontSize = baseSize * finalScaleFactor;

  const renderedInkWidth = baseInkWidth * finalScaleFactor;
  const renderedInkHeight = baseInkHeight * finalScaleFactor;
  const finalAscent = baseAscent * finalScaleFactor;

  // Apply final sizes
  ctx.font = `${finalFontSize}px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';

  // Centering logic
  const emptySpaceX = width - renderedInkWidth;
  const emptySpaceY = height - renderedInkHeight;

  const offsetX = emptySpaceX / 2;
  const offsetY = emptySpaceY / 2;

  const startX = offsetX + (metrics.actualBoundingBoxLeft * finalScaleFactor);
  const startY = offsetY + finalAscent;

  ctx.fillText(text, startX, startY);
}

// --- EVENT LISTENERS ---

// 1. Handle Window Resizing
window.addEventListener('resize', resizeCanvas);

// 2. Handle Typing Interaction
window.addEventListener('keydown', (e) => {
  // Ignore meta keys (Cmd, Ctrl, Alt) so browser shortcuts still work
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  if (e.key === 'Enter') {
    text = '';
  } else if (e.key === 'Backspace') {
    text = text.slice(0, -1);
  } else if (e.key.length === 1) {
    // Only capture single characters (avoids keys like "Shift", "ArrowUp", etc.)
    text += e.key;
  }
  
  render();
});

// 3. Handle Fullscreen Toggle
fsBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.warn(`Fullscreen error: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
});

// Initialize the first frame
resizeCanvas();