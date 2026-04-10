# TODO

## Next Steps
- Validate production response headers with browser DevTools:
  - Content-Security-Policy
  - Content-Type for HTML/JS assets
  - Cache-Control
- If CSP is strict, explicitly allow required external origins:
  - https://cdn.tailwindcss.com
  - https://fonts.googleapis.com
  - https://fonts.gstatic.com
  - https://www.googletagmanager.com
  - https://www.clarity.ms
- Consider self-hosting critical assets (Tailwind build and fonts) to reduce third-party dependency.
- Add a lightweight deploy checklist before future pushes.
