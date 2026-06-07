# Big Words

A minimal, full-screen text display tool. Type anything and it fills your entire screen — perfect for presentations, classrooms, live events, or anywhere you need to show text at a distance.

**[Try it live →](https://bigwords.maximusshurr.com/)**

![Big Words screenshot](public/BigWords.png)

## ✨ Features

- **Pixel-perfect scaling** — text always fills the screen edge-to-edge, no matter what you type
- **High-DPI support** — crisp rendering on Retina and other high-density displays
- **Auto fullscreen** — enters fullscreen on first interaction on desktop, no button needed
- **Mobile support** — tap anywhere to bring up the native keyboard on touch devices
- **Color themes** — three built-in themes, triggered by typing their name
- **Shareable URLs** — message and theme are encoded in the URL automatically
- **PWA** — installable on desktop and mobile for offline use
- **Accessible** — screen reader support via ARIA live regions and canvas labels
- **Live sync** — a host can broadcast text in real time to any number of viewers via Cloudflare Durable Objects

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

| Key | Action |
|---|---|
| Any key | Adds a character to the display |
| `Backspace` | Removes the last character |
| `Enter` | Clears the screen |

## 🔗 Sharing

The URL updates automatically as you type — just copy and share it. The recipient lands on the same message and theme, no setup needed. The default black theme is omitted from the URL to keep links clean.

Examples:
- `bigwords.maximusshurr.com/?m=Hello`
- `bigwords.maximusshurr.com/?m=Hello&t=white`

## 🎨 Themes

Type a theme name and it switches instantly — the text clears automatically. Typing the name of the theme you're already on does nothing (no accidental clears).

| Word | Theme |
|---|---|
| `black` | White text on black (default) |
| `white` | Black text on white |
| `rainbow` | Complementary cycling colors on both text and background |

These are intentionally undocumented in the app — consider them easter eggs.

## 📡 Live Sync

Big Words includes a real-time broadcasting feature backed by Cloudflare Durable Objects and WebSockets. A host types on one device and every viewer sees it instantly.

### How it works

Each session is identified by a **room ID**. The Durable Object for that room holds a single string in SQLite storage and manages all connected WebSocket clients.

| Route | Role |
|---|---|
| `/emit/[id]` | Host — claims the room lock and broadcasts keystrokes |
| `/listen/[id]` | Viewer — receives the current value on connect, then live updates |

**Lock behaviour:**
- Only one host can hold a room at a time.
- A second client hitting `/emit/[id]` is rejected and redirected to the corresponding `/listen/[id]` route automatically.
- When the host disconnects, all viewers receive a `status` message (`emitterActive: false`) and a "Become Host" button appears so anyone can race to claim the now-free room.
- When the last connection drops, storage is wiped back to zero.

### Message contract

All WebSocket messages are JSON.

| Direction | Payload | Meaning |
|---|---|---|
| Server → client | `{ type: "data", value: "..." }` | Current string value |
| Server → client | `{ type: "status", emitterActive: bool }` | Host presence changed |
| Server → client | `{ type: "error", message: "..." }` | Connection rejected |
| Client → server | `{ type: "data", value: "..." }` | New string from host |

### Test pages

During development, two minimal HTML pages are available for testing the pipeline end-to-end:

- `/emitter-test.html?room=<id>` — host UI
- `/listener.html?room=<id>` — viewer UI

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

- **More themes** — additional magic words
- **Named rooms** — shareable URLs that drop viewers directly into a live session

## 🤝 Contributing

Contributions are welcome. If you have an idea to make this faster, more accessible, or easier to use, feel free to fork and open a pull request.

1. Fork the project
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

## 📄 License

[MIT](LICENSE) — free to use, modify, and distribute.
