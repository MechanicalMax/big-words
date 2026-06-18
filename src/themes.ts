import { render } from './renderer.js';
import { VALID_THEMES, type Theme } from './protocol';

// --- THEME REGISTRY ---
// Add new themes here. VALID_THEMES in protocol.ts must be updated to match.

interface ThemeConfig {
  bg: string;
  fg: string | null;
  rainbow: boolean;
}

export const THEMES: Record<Theme, ThemeConfig> = {
  black:   { bg: '#000000', fg: '#ffffff', rainbow: false },
  white:   { bg: '#ffffff', fg: '#000000', rainbow: false },
  rainbow: { bg: '#000000', fg: null,      rainbow: true  },
};

// Compile-time check: every entry in VALID_THEMES has a corresponding THEMES record.
// If you add a theme to VALID_THEMES without adding it here, TypeScript will error.
VALID_THEMES.forEach((name) => {
  if (!THEMES[name]) throw new Error(`Missing theme config for "${name}"`);
});

// --- STATE ---

export const themeState = {
  current: THEMES.black as ThemeConfig,
  name:    'black' as Theme,
  rainbowHue: 0,
  rafId: null as number | null,
};

// --- ANIMATION ---

function animateRainbow() {
  themeState.rainbowHue = (themeState.rainbowHue + 1) % 360;
  render();
  themeState.rafId = requestAnimationFrame(animateRainbow);
}

// --- APPLY ---

export function applyTheme(name: Theme): void {
  const theme = THEMES[name];
  if (!theme) return;

  if (themeState.rafId !== null) {
    cancelAnimationFrame(themeState.rafId);
    themeState.rafId = null;
  }

  themeState.current = theme;
  themeState.name    = name;

  document.documentElement.style.setProperty('background-color', theme.bg);
  document.body.style.backgroundColor = theme.bg;

  // Rainbow cycles too fast to track, so fall back to black for the meta color.
  const themeColor = theme.rainbow ? '#000000' : theme.bg;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);

  if (theme.rainbow) {
    animateRainbow();
  } else {
    render();
  }
}
