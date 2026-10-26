# TODO

## Next Steps
- [x] Integrate the fishbowl intro into the main `index.html`, preserving i18n, analytics, SEO, project modal and contact sections.
- [ ] Improve project descriptions, skills and contact content after the integration.
- [ ] Review the remaining projects (Genetic Algorithm, Loan Calculator, Call Rating System, Last.fm Visualizer) for professional alignment.
- [x] Choose and apply a new hero slogan (English and Spanish).
- [ ] Consider promoting `intro-galaxy/js/galaxy-core.js` and `intro-galaxy/js/galaxy.js` to root-level production files so the main site no longer depends on the prototype folder.
- [x] Remove `index_legacy.html` after validating the integrated site in production.
- [x] Normalize the palette to black and neutral grays.
- [x] Add temporary hero background and thumbnail videos.
- [x] Add light collision resolution between floating cards.
- [x] Validate production response headers:
  - [x] Content-Security-Policy: none is currently sent by the host, so no blank-page risk from CSP.
  - [x] Content-Type for HTML/JS assets: correct for HTML, CSS, JS, WebP, WebM and MP4.
  - [ ] Cache-Control: the host returns no explicit cache header; review to avoid stale files after a manual upload.
- If CSP is strict, explicitly allow required external origins:
  - https://cdn.tailwindcss.com
  - https://fonts.googleapis.com
  - https://fonts.gstatic.com
  - https://www.googletagmanager.com
  - https://www.clarity.ms
- Consider self-hosting critical assets (Tailwind build and fonts) to reduce third-party dependency.
- [x] Add a lightweight deploy checklist before future pushes (see README → Deployment).
- [x] Verify the live site on cPanel: `index.html` hash matches the repository and every critical asset returns HTTP 200.
