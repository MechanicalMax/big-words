const srLive = document.getElementById('sr-live');
let announceTimer = null;

export function announce(msg) {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    srLive.textContent = '';
    requestAnimationFrame(() => {
      srLive.textContent = msg || 'Cleared';
    });
  }, 500);
}
