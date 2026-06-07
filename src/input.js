import { state } from './state.js';
import { render } from './renderer.js';
import { announce } from './announcer.js';
import { applyTheme, THEMES, themeState } from './themes.js';
import { updateURL } from './url.js';

const input = document.getElementById('text-input');

// --- FOCUS / FULLSCREEN ---

const isMobile = () => window.matchMedia('(pointer: coarse)').matches;

export function keepFocused() {
  input.focus({ preventScroll: true });
}

function requestFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  }
}

document.addEventListener('fullscreenchange', () => {
  input.focus();
});

document.addEventListener('pointerdown', () => {
  keepFocused();
  if (!isMobile()) {
    requestFullscreen();
  }
});

input.addEventListener('blur', () => {
  if (!isMobile()) {
    setTimeout(keepFocused, 50);
  }
});

// --- THEME TRIGGER ---

function checkThemeTrigger() {
  const lower = state.text.toLowerCase();
  if (THEMES[lower] && THEMES[lower] !== themeState.current) {
    state.text   = '';
    input.value  = '';
    applyTheme(lower);
    updateURL();
    announce(`Theme changed to ${lower}`);
  }
}

// --- KEYBOARD ---

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  if (e.key === 'Enter') {
    e.preventDefault();
    state.text  = '';
    input.value = '';
    render();
    updateURL();
    announce('Cleared');
    return;
  }

  if (e.key === 'Backspace') {
    e.preventDefault();
    state.text  = state.text.slice(0, -1);
    input.value = state.text;
    render();
    updateURL();
    announce(state.text || 'Cleared');
    return;
  }
});

// --- INPUT EVENT ---

input.addEventListener('input', () => {
  const newValue = input.value;

  if (newValue.length > state.text.length) {
    state.text += newValue.slice(state.text.length);
  } else {
    state.text = newValue;
  }

  render();
  checkThemeTrigger();
  updateURL();
  announce(state.text);
});
