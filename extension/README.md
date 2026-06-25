# Browser Extension

A Chrome/Edge extension that logs job applications with one click while
you're actually on the posting page — no switching tabs to the dashboard
mid-application.

## How it works

- On **any page**, click the extension icon and fill in the form manually.
- On **LinkedIn, Naukri, Internshala, or Indeed job pages**, the popup
  auto-fills company, role, and a JD snippet by reading the page — you
  just confirm and hit Save.
- Saving talks directly to the FastAPI backend (`../backend`), so anything
  logged here shows up in the dashboard immediately. No separate database,
  no syncing step.

## Loading it in Chrome (unpacked, for local dev)

Extensions you write yourself don't go through the Chrome Web Store unless
you choose to publish them — for personal use, you "load unpacked" instead:

1. Make sure the backend is running first (`uvicorn main:app --reload --port 8000` from `../backend`)
2. Open `chrome://extensions` in Chrome
3. Turn on **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select this `extension/` folder
6. Pin the extension icon (puzzle-piece icon in the toolbar → pin "Job Tracker Capture")

That's it — no build step, no npm install. It's plain HTML/CSS/JS, so Chrome
reads the files directly.

## Using it

1. Go to a job posting (LinkedIn/Naukri/Internshala/Indeed, or anywhere else)
2. Click the extension icon
3. On supported sites, company/role/criteria auto-fill — look for the
   "Auto-filled" badge. Everywhere else, fill it in yourself.
4. Hit **Save application** — it's now in your dashboard.

## File-by-file

| File | What it does |
|---|---|
| `manifest.json` | The extension's "ID card" — declares permissions, which scripts run on which sites, and the popup entry point |
| `popup.html` / `popup.css` | The small window that opens when you click the icon |
| `popup.js` | Asks the content script for auto-fill data, then POSTs the form to the backend |
| `content-scripts/*.js` | One file per supported site. Each reads that site's specific page structure (different sites = different HTML, so different selectors) |
| `icons/` | Toolbar icon at 16/48/128px |

## A note on why content scripts can break

The site-specific scripts in `content-scripts/` work by looking for specific
HTML elements (e.g. "find the `<h1>` with this class name"). If LinkedIn,
Naukri, etc. redesign their pages, those exact class names can change and
auto-fill will silently stop working — you'd just see a blank form instead
of an error. This isn't a bug in our code breaking; it's the nature of
reading someone else's webpage instead of using an official API (these
sites don't offer one for this purpose). If this happens, the fix is
opening that site's content script, right-clicking the relevant element
on the page → Inspect, and updating the selector string.

## Known limitation

The manual capture button works everywhere, including sites we don't have
a content script for — it just won't auto-fill anything, you type it in
yourself. That's an intentional fallback, not a missing feature.
