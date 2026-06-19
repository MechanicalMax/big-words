const srLive = document.getElementById('sr-live') as HTMLElement;
let announceTimer: ReturnType<typeof setTimeout> | null = null;

export function announce(msg: string): void {
  if (announceTimer !== null) clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    srLive.textContent = '';
    requestAnimationFrame(() => {
      srLive.textContent = msg || 'Cleared';
    });
  }, 500);
}
