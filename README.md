# Hypercube | Portfolio

A minimalist, monochrome personal portfolio and project showcase built with modern web technologies.

## 🎨 Design Philosophy

- **Monochrome Aesthetic**: Strictly grayscale color palette (Black, White, Gray) to emphasize content and structure.
- **Glassmorphism**: Subtle transparency and blur effects for depth.
- **Responsive**: Fully adaptive layout using CSS Grid and Flexbox.

## ✅ Latest Update

- Added a mobile navigation menu (hamburger toggle) in `index.html` to expose section links and language switch on small screens.
- Migrated EN/ES to a single-page i18n flow in `index.html` (language toggle + localStorage persistence).
- Converted `index_es.html` into a redirect shim that sets Spanish preference and forwards to `index.html`.
- Hardened production rendering by moving i18n logic from inline JS to external `main.js`, reducing CSP-related blank-page failures on shared hosting.
- Added static fallback content in `index.html` so core sections remain visible even if JavaScript is restricted.

## 🛠️ Tech Stack

- **Core**: HTML5
- **Styling**: Tailwind CSS (via CDN)
- **Typography**: Inter (Google Fonts)
- **Icons**: Emoji & SVG

## 🚀 Featured Projects

The portfolio currently showcases the following projects:

1.  **GW2 Roster Manager**: Squad management tool for Guild Wars 2.
2.  **Subnet Calculator**: Visual IPv4 subnetting tool.
3.  **GlobalIncom SPA**: Corporate Single Page Application.
4.  **Genetic Algorithm**: Interactive AI evolution demonstration in PHP.
5.  **Loan Calculator**: Financial amortization tool.
6.  **Call Rating System**: CDR auditing and reporting system.
7.  **Last.fm Visualizer**: Real-time music dashboard with API integration.

## 📦 Development

To run the project locally:

```bash
# Clone the repository
git clone https://github.com/camoril/hypercubecommx.git

# Navigate to directory
cd hypercubecommx

# Start a local server (Python 3)
python3 -m http.server
```

Open `http://localhost:8000` in your browser.

## 📄 License

All rights reserved.
