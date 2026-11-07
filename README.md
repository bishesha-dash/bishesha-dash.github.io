# bishesha-dash.github.io

A small website for Bishesha. Static HTML/CSS/JS, no build step, works on GitHub Pages.

- `index.html`: the apology popup, then the one-page site
- `css/love.css`: all styling
- `js/love.js`: behaviour (the runaway "No" button, the typed unlock, letters, coupons, feedback)
- `js/config.js`: **edit this one**: photos, "together since" date, WhatsApp number / email
- `assets/images/her/`, `assets/images/us/`: drop photos here, then list them in `js/config.js`

Run locally: `python3 -m http.server 8000`, then open http://127.0.0.1:8000

Unlocking is remembered for the browser tab. Add `?again` to the URL to see the apology from the start.

The old portfolio pages (`projects/`, `css/style.css`, the project SVGs in `assets/`) are no longer linked from the homepage.
