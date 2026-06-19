import { parseCommand } from './protocol';

const hudEl    = document.getElementById('hud')    as HTMLDivElement;
const hudInput = document.getElementById('hud-input') as HTMLInputElement;

// Callback set by the caller — executed with a parsed command on Enter.
type ExecuteFn = (result: ReturnType<typeof parseCommand>) => void;
let onExecute: ExecuteFn = () => {};

// Callback set by the caller — called when the HUD closes to return focus.
let onClose: () => void = () => {};

export function setCommandHandler(fn: ExecuteFn): void {
  onExecute = fn;
}

export function setFocusHandler(fn: () => void): void {
  onClose = fn;
}

export function isOpen(): boolean {
  return !hudEl.hidden;
}

export function openHUD(): void {
  hudEl.hidden   = false;
  hudInput.value = '/';
  hudInput.focus();
}

export function closeHUD(): void {
  hudEl.hidden   = true;
  hudInput.value = '';
  onClose();
}

// --- INPUT HANDLING ---

hudInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeHUD();
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    const result = parseCommand(hudInput.value);
    closeHUD();
    onExecute(result);
    return;
  }

  // Backspace to empty closes the HUD.
  if (e.key === 'Backspace' && hudInput.value.length <= 1) {
    e.preventDefault();
    closeHUD();
    return;
  }
});

// If the user somehow clears the leading "/", close gracefully.
hudInput.addEventListener('input', () => {
  if (!hudInput.value.startsWith('/')) {
    closeHUD();
  }
});
