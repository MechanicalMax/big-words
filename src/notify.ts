// Non-blocking notification overlay for system messages.
// Used instead of alert() for events that may fire while the page is backgrounded
// (e.g. host disconnect on mobile), where alert() is suppressed by the browser.

const el = document.createElement('div');
el.id = 'notify';
el.setAttribute('role', 'status');
el.setAttribute('aria-live', 'assertive');
el.hidden = true;
document.getElementById('app')?.appendChild(el);

let hideTimer: ReturnType<typeof setTimeout> | null = null;

// Registered by app.ts — returns true when the HUD is open.
// Dismissal is suppressed while the HUD is active so error messages
// shown before or after a command aren't immediately cleared.
let isHUDOpen: () => boolean = () => false;
export function setHUDStateProvider(fn: () => boolean): void {
  isHUDOpen = fn;
}

/**
 * Show a notification message for the given duration (default 6s).
 * Dismissed early by any tap/click outside the HUD.
 */
export function notify(message: string, durationMs = 6000): void {
  el.textContent = message;
  el.hidden = false;

  if (hideTimer !== null) clearTimeout(hideTimer);
  hideTimer = setTimeout(hide, durationMs);
}

function hide(): void {
  el.hidden = true;
  el.textContent = '';
  hideTimer = null;
}

// Dismiss on any interaction — but not while the HUD is open.
document.addEventListener('pointerdown', () => {
  if (!el.hidden && !isHUDOpen()) hide();
}, { capture: true });
