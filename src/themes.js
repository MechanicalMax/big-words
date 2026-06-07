import { render } from './renderer.js';

export const THEMES = {
  black:   { bg: '#000000', fg: '#ffffff', rainbow: false },
  white:   { bg: '#ffffff', fg: '#000000', rainbow: false },
  rainbow: { bg: '#000000', fg: null,      rainbow: true  },
};

export const themeState = {
  current: THEMES.black,
  name: 'black',
  rainbowHue: 0,
  rafId: null,
};

function animateRainbow() {
  themeState.rainbowHue = (themeState.rainbowHue + 1) % 360;
  render();
  themeState.rafId = requestAnimationFrame(animateRainbow);
}

export function applyTheme(name) {
  const theme = THEMES[name];
  if (!theme) return;

  if (themeState.rafId !== null) {
    cancelAnimationFrame(themeState.rafId);
    themeState.rafId = null;
  }

  themeState.current = theme;
  themeState.name = name;

  document.documentElement.style.setProperty('background-color', theme.bg);
  document.body.style.backgroundColor = theme.bg;

  // Rainbow cycles too fast to track, so fall back to black for the meta color.
  const themeColor = theme.rainbow ? '#000000' : theme.bg;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor);

  if (theme.rainbow) {
    animateRainbow();
  } else {
    render();
  }
}
