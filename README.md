# Big Words

A minimal, full-screen text display tool. Type anything and it fills your entire screen — perfect for presentations, classrooms, live events, or anywhere you need to show text at a distance.

**[Try it live →](https://bigwords.maximusshurr.com/)**

![Big Words screenshot](public/BigWords.png)

## ✨ Features

- **Pixel-perfect scaling** — text always fills the screen edge-to-edge, no matter what you type
- **High-DPI support** — crisp rendering on Retina and other high-density displays
- **Auto fullscreen** — enters fullscreen on first interaction on desktop, no button needed
- **Mobile support** — tap anywhere to bring up the native keyboard on touch devices
- **Color themes** — three built-in themes, switchable via `/theme [name]`
- **Shareable URLs** — message and theme are encoded in the URL automatically
- **PWA** — installable on desktop and mobile for offline use
- **Accessible** — screen reader support via ARIA live regions and canvas labels
- **Live sync** — join a shared room with `/room [id]` to broadcast text and theme in real time to any number of viewers via Cloudflare Durable Objects
- **Command system** — type `/` on a blank screen to open the command HUD

## 🚀 Getting Started

1. Clone the repo:
```bash
git clone https://github.com/MechanicalMax/big-words
cd big-words
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the provided `localhost` URL.

## ⌨️ Usage

**Desktop:** just start typing — no click needed.

**Mobile:** tap anywhere to open the native keyboard. Tap "Done" to dismiss it.

| Key / Input | Action |
|---|---|
| Any printable key | Adds a character to the display |
| `Backspace` | Removes the last character |
| `Enter` | Clears the screen |
| `/` on a blank screen | Opens the command HUD |
| `Escape` or `Backspace` to empty | Closes the command HUD without executing |
| `Enter` in HUD | Executes the typed command |

## 🔗 Sharing

The URL updates automatically as you type — just copy and share it. The recipient lands on the same message and theme, no setup needed. The default black theme and empty text are omitted from the URL to keep links clean.

Examples:
- `bigwords.maximusshurr.com/?m=Hello`
- `bigwords.maximusshurr.com/?m=Hello&t=white`
- `bigwords.maximusshurr.com/?room=my-room` — joins a live sync room directly

When in a room, `?m=` and `?t=` are dropped — the URL is just `/?room=[id]`. Text and theme are owned by the room.

## 🎨 Themes

Use `/theme [name]` to switch themes. Outside of a room, the active theme is saved in the URL so shared links preserve it. Inside a room, the host's theme is broadcast to all viewers instantly.

| Name | Theme |
|---|---|
| `black` | White text on black (default) |
| `white` | Black text on white |
| `rainbow` | Complementary cycling colors on both text and background |

> Theme switching is command-only. Typing `rainbow` just displays the word.

## ⌨️ Commands

Typing `/` when the screen is blank opens the **command HUD** — a full-screen overlay with a command input at the top and a scrollable reference list of all available commands below it.

Press **Enter** to execute, **Escape** or **Backspace** (back to empty) to dismiss without executing.

| Command | Action |
|---|---|
| `/theme [name]` | Switch to the named theme (`black`, `white`, `rainbow`) |
| `/room [id]` | Join a live sync room with the given ID |
| `/exit` | Leave the current room and return to solo mode |

The HUD is available in all app states — solo mode, host, and viewer. A viewer's canvas keypresses are blocked, but `/` always reaches the hidden input and opens the HUD, so they can always type `/exit` to leave.

## 📡 Live Sync

Big Words includes a real-time broadcasting feature backed by Cloudflare Durable Objects and WebSockets. A host types on one device and every viewer sees the same text and theme instantly.

### How it works

Everything runs through the single-page app at `/`. There are no separate routes for hosts or viewers.

Joining a room is done with the `/room [id]` command or by navigating directly to `/?room=[id]`. The URL becomes `/?room=[id]` when you join and returns to `/` when you exit.

Each room is identified by its **room ID**. The Durable Object for that room stores the current text and theme in SQLite and manages all connected WebSocket clients.

**Role assignment:**
- The first WebSocket connection to a room becomes the **host** and can type freely. Their text and theme changes are broadcast to all viewers in real time.
- All subsequent connections join as **viewers**. They receive the current text and theme immediately on connect, then receive live updates. Viewer canvas keypresses are blocked, but fullscreen is still requested on any key or tap, and the command HUD is always accessible via `/`.
- The client only transitions to `connected` state after receiving its role message from the server — there is no window where role is unknown but input is processed.

**Host handoff:**
- When the host disconnects, all viewers are immediately notified via `alert()` and prompted to refresh the page.
- The first client to reconnect to the room claims the host role.
- When the last connection drops, room storage is wiped back to zero.

**Exiting a room:**
- Running `/exit` closes the WebSocket, clears the URL back to `/`, and navigates home — returning the app to a blank screen in solo mode.

### WebSocket connection

The SPA is served as a standard static asset. The worker intercepts only WebSocket upgrade requests at a single endpoint.

| Route | Description |
|---|---|
| `GET /` (HTTP) | Serves the SPA |
| `GET /room/[id]` (WebSocket upgrade only) | Connects the client to the Durable Object for that room |

### Message contract

All WebSocket messages are JSON.

| Direction | Payload | Meaning |
|---|---|---|
| Server → client | `{ type: "data", text: "...", theme: "..." }` | Room state — sent on connect and on every host update |
| Server → client | `{ type: "role", role: "host"\|"viewer" }` | Role assigned on connect |
| Server → client | `{ type: "status", hostActive: false }` | Host has disconnected |
| Client → server | `{ type: "data", text: "...", theme: "..." }` | New state from host |

## 🏗️ Architecture

The codebase is a single-page Vite app with a Cloudflare Worker backend. All source is TypeScript.

```
src/
  protocol.ts     — shared message types, theme constants, command parser, wire helpers
  themes.ts       — theme registry and applyTheme(); imports Theme type from protocol.ts
  state.ts        — shared mutable { text } object
  renderer.ts     — canvas scaling and paint
  announcer.ts    — debounced screen reader announcements
  notify.ts       — non-blocking toast overlay for system messages
  input.ts        — keyboard capture, focus/fullscreen, HUD trigger, viewer gating
  hud.ts          — command HUD overlay, focus management, keydown handling
  commands.ts     — command executor, bridges HUD output to app actions
  room.ts         — WebSocket lifecycle, role state, broadcast, join/leave
  url.ts          — URL read/write, room-aware param handling
  app.ts          — app entry point, init sequence, callback wiring, URL-based auto-join

worker/
  index.ts        — Cloudflare Worker router + Room Durable Object
```

**Callback wiring:** modules that would otherwise create circular imports expose setter functions (`setRenderHandler`, `setFocusHandler`, `setCommandHandler`, `setHUDStateProvider`). `app.ts` registers all callbacks at startup — it sits at the top of the dependency graph and imports everything.

**Source of truth for themes:** `VALID_THEMES` in `protocol.ts` defines the valid set. `themes.ts` imports it and uses `Record<Theme, ThemeConfig>` so TypeScript errors at compile time if a theme is added to one without the other. The worker uses `isValidTheme()` from `protocol.ts` to validate all inbound host messages and storage reads before broadcasting.

**Adding a new theme:** add the name to `VALID_THEMES` in `protocol.ts`, add the config entry to `THEMES` in `themes.ts`. TypeScript will surface any mismatch. The HUD reference list in `index.html` should also be updated.

## 🏗️ Deployment

This project runs on [Cloudflare Workers](https://workers.cloudflare.com/) with static assets served via the Workers Assets binding. Pushes to `main` trigger an automatic build and deploy.

To deploy your own fork:

1. Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/):
```bash
npm install -g wrangler
wrangler login
```

2. Deploy:
```bash
npm run deploy
```

To build locally without deploying:
```bash
npm run build
```

## 🗺️ Roadmap

- **More themes** — additional `/theme` options

## 🤝 Contributing

Contributions are welcome. If you have an idea to make this faster, more accessible, or easier to use, feel free to fork and open a pull request.

1. Fork the project
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

## 📄 License

[MIT](LICENSE) — free to use, modify, and distribute.
