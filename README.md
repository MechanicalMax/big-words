# Big Words

A minimal, full-screen text display tool. Type anything and it fills your entire screen — perfect for presentations, classrooms, live events, or anywhere you need to show text at a distance.

**[Try it live →](https://yourusername.github.io/big-words)**

![Big Words screenshot](BigWords.png)

## ✨ Features

- **Pixel-perfect scaling** — text always fills the screen edge-to-edge, no matter what you type
- **High-DPI support** — crisp rendering on Retina and other high-density displays
- **Zero dependencies** — just a canvas, some math, and a keyboard
- **Fullscreen mode** — one click to go distraction-free

## 🚀 Getting Started

1. Clone the repo:
```bash
git clone https://github.com/yourusername/big-words.git
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

| Key | Action |
|---|---|
| Any key | Adds a character to the display |
| `Backspace` | Removes the last character |
| `Enter` | Clears the screen |
| Fullscreen button | Toggles fullscreen (fades while typing) |

## 🏗️ Building for Production

```bash
npm run build
```

The output goes to `dist/` and can be deployed to any static host (GitHub Pages, Netlify, Vercel, etc.).

## 🗺️ Roadmap

- **Keyboard shortcuts** — quick toggles for color themes and fullscreen
- **Accessibility** — screen-reader support and ARIA labels
- **PWA support** — installable for offline use on mobile
- **URL state** — encode the current message in the URL for easy sharing

## 🤝 Contributing

Contributions are welcome. If you have an idea to make this faster, more accessible, or easier to use, feel free to fork and open a pull request.

1. Fork the project
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

## 📄 License

MIT — free to use, modify, and distribute.
