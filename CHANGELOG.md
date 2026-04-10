# Changelog

All notable changes to this project are documented in this file.

## [2026-04-10]
### Fixed
- Resolved production blank-page issue caused by runtime dependence on inline JavaScript.
- Moved i18n and UI behavior from inline code in index.html to external main.js for better CSP compatibility.
- Added static fallback content in the HTML so the page is still readable when scripts are restricted.
- Replaced custom brand utility usage tied to inline Tailwind config with stable Tailwind classes.

### Docs
- Updated README with deployment hardening notes related to CSP-safe rendering.
