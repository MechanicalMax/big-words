import { state } from './state.js';
import { themeState } from './themes.js';
import { roomState } from './room.js';
import { isValidTheme } from './protocol';

export function updateURL(): void {
  const params = new URLSearchParams();

  if (roomState.connected || roomState.roomId) {
    // In a room — only track the room ID.
    params.set('room', roomState.roomId);
  } else {
    // Solo mode — track text and theme.
    if (state.text) params.set('m', state.text);
    if (themeState.name !== 'black') params.set('t', themeState.name);
    // If both are defaults, push a clean "/" with no params.
    history.replaceState(null, '', params.toString() ? '?' + params.toString() : '/');
    return;
  }

  history.replaceState(null, '', '?' + params.toString());
}

export function clearRoomURL(): void {
  history.replaceState(null, '', '/');
}

export function readURL(): { roomId: string | null } {
  const params = new URLSearchParams(window.location.search);

  const roomId = params.get('room');
  if (roomId) {
    // Room join handled by app.ts after init — just return the ID.
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
