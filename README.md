# Hypercube | Portfolio

A minimalist, monochrome personal portfolio and project showcase built with modern web technologies.

## 🎨 Design Philosophy

- **Monochrome Aesthetic**: Strictly grayscale color palette (Black, White, Gray) to emphasize content and structure.
- **Glassmorphism**: Subtle transparency and blur effects for depth.
- **Responsive**: Fully adaptive layout using CSS Grid and Flexbox.

## ✅ Latest Update

- Integrated the fishbowl intro as the main hero, preserving bilingual copy, analytics, SEO, project cards, modal and contact sections.
- Added canonical, Open Graph, Twitter Cards and JSON-LD metadata.
- Added `?lang=en|es` and `?scroll=<section>` query helpers for testing and deep links.
- Updated the hero slogan to "Reliable systems for critical operations." / "Sistemas confiables para operaciones críticas.".
- Restored the original PNG favicon.
- Normalized the palette to black and neutral grays; replaced project emojis with monochrome labels.
- Added a temporary grayscale clouds video as the hero background and a temporary hexagon loop for the fishbowl thumbnails.
- Added optimized production videos in `img/` and ignored the original temporary source files.
- Added light collision resolution between floating cards: maximum overlap is configurable (12% by default) and cards bounce softly.
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

1.  **Interventor**: Web system for managing technical service interventions with digital client signature, PDF generation and Docker deployment.
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

## 🚀 Deployment

The site is deployed **manually through cPanel** (LiteSpeed host) and published at:

**https://hypercube.com.mx/**

There is no CI/CD pipeline and no GitHub Pages: after validating locally, upload the changed files to the web root (`public_html`).

### Files to upload

- `index.html`
- `index_es.html` (redirect shim that sets Spanish preference)
- `404.html`, `500.html`
- `main.js`
- `fishbowl.css`
- `img/` (favicon, logos, `clouds.*`, `hexagons.*`)
- `intro-galaxy/` — **required**: the hero loads `intro-galaxy/config.js`, `intro-galaxy/js/galaxy-core.js`, `intro-galaxy/js/galaxy.js` and `intro-galaxy/css/galaxy.css`

### Post-deploy checklist

```bash
# 1. The published index.html must match the repository
sha256sum index.html
curl -s https://hypercube.com.mx/ | sha256sum

# 2. Every critical asset must return HTTP 200
for p in /fishbowl.css /main.js /img/clouds.webm /img/hexagons.webm \
         /intro-galaxy/config.js /intro-galaxy/js/galaxy-core.js \
         /intro-galaxy/js/galaxy.js /intro-galaxy/css/galaxy.css; do
  curl -s -o /dev/null -w "$p -> %{http_code}\n" "https://hypercube.com.mx$p"
done
```

- Confirm the hero animation renders and both languages work (`?lang=es`, `?lang=en`).
- Confirm the project modal opens and the contact section is reachable.
- Purge the LiteSpeed cache from cPanel if a change is not visible immediately.

> The host currently sends no `Content-Security-Policy` header, so the Tailwind CDN, Google Fonts and analytics scripts load normally. If a CSP is added later, allow the origins listed in `TODO.md`.

## 📄 License

All rights reserved.
