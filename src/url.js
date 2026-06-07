import { state } from './state.js';
import { themeState, THEMES } from './themes.js';

export function updateURL() {
  const params = new URLSearchParams();
  params.set('m', state.text);
  if (themeState.name !== 'black') {
    params.set('t', themeState.name);
  }
  history.replaceState(null, '', '?' + params.toString());
}

export function readURL() {
  const params = new URLSearchParams(window.location.search);
  const msg   = params.get('m');
  const theme = params.get('t');

  if (msg !== null) {
    state.text = msg;
    document.getElementById('text-input').value = msg;
  }

  if (theme && THEMES[theme]) {
    themeState.name = theme;
  }
}
