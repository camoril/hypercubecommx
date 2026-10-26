# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]
### Changed
- Rewrote the About Me copy in English and Spanish with a more professional, evidence-based tone.
- Updated the meta description and Spanish hero subtitle for consistency with the new positioning.
- Integrated the fishbowl intro into the main `index.html` hero, preserving i18n, analytics, SEO, project cards, modal and contact sections.
- Added `fishbowl.css`, canonical/Open Graph/Twitter metadata and JSON-LD (Person + WebSite).
- Added `?lang=en|es` and `?scroll=<section>` query helpers for testing and deep links.
- Changed the projects grid to 4 columns on large screens with rectangular cards, uniform heights and clamped descriptions.
- Simplified the About Me copy to remove the project enumeration and focus on approach, criteria and values.
- Updated the hero slogan to "Reliable systems for critical operations." / "Sistemas confiables para operaciones críticas."
- Restored the original PNG favicon and removed the extra SVG favicon link.
- Replaced GW2 Roster Manager with Interventor in the project showcase, the fishbowl and the bilingual project data.
- Normalized the palette to black and neutral grays, removing slate/cool gray tones and colorful emojis from the project cards.
- Added a temporary grayscale clouds background video to the hero and a temporary hexagon loop for the fishbowl thumbnails.
- Optimized production videos live in `img/`; original temporary source videos are ignored.
- Added light collision resolution between floating cards with configurable maximum overlap and a subtle bounce.
- Removed the legacy index backup and temporary source videos; optimized assets live in `img/` and `intro-galaxy/assets/`.

### Docs
- Documented the manual cPanel deployment flow, the files to upload and a post-deploy verification checklist in `README.md`.
- Verified production at https://hypercube.com.mx/: `index.html` hash matches the repository and all critical assets (including `intro-galaxy/`) return HTTP 200.

## [2026-04-10]
### Fixed
- Resolved production blank-page issue caused by runtime dependence on inline JavaScript.
- Moved i18n and UI behavior from inline code in index.html to external main.js for better CSP compatibility.
- Added static fallback content in the HTML so the page is still readable when scripts are restricted.
- Replaced custom brand utility usage tied to inline Tailwind config with stable Tailwind classes.

### Docs
- Updated README with deployment hardening notes related to CSP-safe rendering.
