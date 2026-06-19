import { state } from './state.js';
import { themeState } from './themes.js';
import { isValidTheme } from './protocol';

/**
 * Update the URL to reflect current app state.
 * Pass roomId when in a room — drops ?m= and ?t= in that case.
 * Pass null (or omit) for solo mode.
 */
export function updateURL(roomId: string | null = null): void {
  const params = new URLSearchParams();

  if (roomId) {
    params.set('room', roomId);
    history.replaceState(null, '', '?' + params.toString());
    return;
  }

  // Solo mode — track text and theme.
  if (state.text) params.set('m', state.text);
  if (themeState.name !== 'black') params.set('t', themeState.name);
  history.replaceState(null, '', params.toString() ? '?' + params.toString() : '/');
}

export function clearRoomURL(): void {
  history.replaceState(null, '', '/');
}

export function readURL(): { roomId: string | null } {
  const params = new URLSearchParams(window.location.search);

  const roomId = params.get('room');
  if (roomId) {
    return { roomId };
  }

  // Solo mode — restore text and theme.
  const msg   = params.get('m');
  const theme = params.get('t');

  if (msg !== null) {
    state.text = msg;
    const input = document.getElementById('text-input') as HTMLInputElement;
    if (input) input.value = msg;
  }

  if (theme && isValidTheme(theme)) {
    themeState.name = theme;
  }

  return { roomId: null };
}
