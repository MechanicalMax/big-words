import { state } from './state.js';
import { render } from './renderer.js';
import { announce } from './announcer.js';
import { updateURL } from './url.js';
import { roomState, broadcast } from './room.js';
import { openHUD, isOpen as isHUDOpen } from './hud.js';

const input = document.getElementById('text-input') as HTMLInputElement;

// --- FOCUS / FULLSCREEN ---

const isMobile = () => window.matchMedia('(pointer: coarse)').matches;

export function keepFocused(): void {
  // Don't steal focus from the HUD input.
  if (isHUDOpen()) return;
  input.focus({ preventScroll: true });
}

function requestFullscreen(): void {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  }
}

document.addEventListener('fullscreenchange', () => {
  keepFocused();
});

document.addEventListener('pointerdown', () => {
  if (!isMobile()) requestFullscreen();
  // Always attempt fullscreen on interaction (including viewers).
  keepFocused();
});

input.addEventListener('blur', () => {
  if (!isMobile() && !isHUDOpen()) {
    setTimeout(keepFocused, 50);
  }
});

// --- KEYBOARD ---

window.addEventListener('keydown', (e) => {
  // Let HUD handle its own keys.
  if (isHUDOpen()) return;

  // Viewers: request fullscreen on any keystroke, then stop.
  if (roomState.role === 'viewer' && roomState.connected) {
    if (!isMobile()) requestFullscreen();
    return;
  }

  if (e.metaKey || e.ctrlKey || e.altKey) return;

  if (e.key === 'Enter') {
    e.preventDefault();
    state.text  = '';
    input.value = '';
    render();
    updateURL();
    announce('Cleared');
    broadcast();
    return;
  }

  if (e.key === 'Backspace') {
    e.preventDefault();
    state.text  = state.text.slice(0, -1);
    input.value = state.text;
    render();
    updateURL();
    announce(state.text || 'Cleared');
    broadcast();
    return;
  }
});

// --- INPUT EVENT ---

input.addEventListener('input', () => {
  // Viewers ignore canvas input.
  if (roomState.role === 'viewer' && roomState.connected) {
    input.value = state.text; // reset any stray input
    return;
  }

  const newValue = input.value;

  // Open HUD when "/" is the only character on a blank screen.
  if (newValue === '/' && state.text === '') {
    input.value = '';
    openHUD();
    return;
  }

  if (newValue.length > state.text.length) {
    state.text += newValue.slice(state.text.length);
  } else {
    state.text = newValue;
  }

  render();
  updateURL();
  announce(state.text);
  broadcast();
});
