# Job Tracker

A small tool I built for a problem every job-hunting fresher eventually hits: applying to 50+ jobs across LinkedIn, Naukri, Internshala, and random company portals, then getting a callback and going *"...wait, which one was this again? What did they even ask for?"*

This is that ledger. One place, every application, every platform, current status, and the actual criteria they asked for — so when a recruiter calls, I already know what I said yes to.

---

## Why this exists (the actual problem)

If you've never juggled multiple job applications at once, here's what goes wrong without a tracker:

- You apply to the same role twice because you forgot you already did
- A recruiter calls about "the ML Engineer position" and you have three of those open
- You get rejected somewhere and have no idea what criteria you didn't meet, so you can't course-correct
- Weeks pass and an application just... sits there, no follow-up, because you forgot it existed

None of this is solved by a spreadsheet you forget to update. It's solved by making logging an application as close to *zero extra effort* as clicking Apply. That's the actual design goal here — not "build a CRUD app," but "build something I'll actually keep using on day 40 of the job hunt."

---

## What's built so far

This project is being built in stages, on purpose — get one layer solid before adding the next.

| Layer | Status | What it does |
|---|---|---|
| **Backend (FastAPI + SQLite)** | ✅ Done, tested | Stores every application: company, role, platform, URL, status, criteria, notes. Full CRUD + filtering + stats. |
| **Dashboard (React)** | ✅ Done | A visual pipeline view — columns by status (Applied → Screening → Interview → Offer/Rejected), click any card to edit. |
| **Browser Extension** | ✅ Done, tested | One-click capture while applying — auto-fills company/role/platform on LinkedIn, Naukri, Internshala, Indeed. Manual capture button works on any other site. |
| **iPad / Mobile access** | ✅ Done | Installable as a home-screen app on iPad via Safari — manifest, icons, and Apple-specific meta tags all wired in. Offline support (service worker) is deferred since it needs HTTPS, which isn't set up yet. |

---

## How the pieces fit together

**Browser Extension** → saves to → **FastAPI Backend** (`localhost:8000`) → reads/writes → **SQLite** (`job_tracker.db`)

**React Dashboard** → reads/writes → same **FastAPI Backend**

In plain words: the extension and the dashboard never talk to each other
directly, and neither one touches the database file directly either.
Everything goes through the one backend, which is the only thing that
knows how to read/write `job_tracker.db`. This is why adding the extension
later didn't require touching a single line of dashboard code — they're
both just separate "clients" of the same API.

### How the extension itself works (briefly)

A browser extension has separate JavaScript contexts that don't share memory
directly — they only talk to each other through message-passing:

1. **Content script** — JS injected into the actual job posting page. It can
   read that page's HTML but can't directly call our backend (browser
   security model blocks that).
2. **Popup script** — runs when you click the toolbar icon. This is what
   actually calls the FastAPI backend.

So the flow for an auto-filled save is: content script reads the page →
popup asks it for that data via `chrome.tabs.sendMessage` → popup pre-fills
the form → you confirm → popup `fetch()`s the backend directly. Full
breakdown and load-it-yourself instructions are in `extension/README.md`.

---

## Project structure

```
job-tracker/
├── backend/              # FastAPI + SQLite API
│   ├── main.py           # All API routes (create/list/update/delete/stats)
│   ├── database.py       # SQLAlchemy model + DB setup
│   ├── schemas.py        # Request/response validation (Pydantic)
│   └── requirements.txt
│
├── dashboard/            # React (Vite) frontend
│   ├── src/
│   │   ├── App.jsx               # Main pipeline view
│   │   ├── api.js                # Talks to the backend
│   │   ├── constants.js          # Status pipeline + platform list (single source of truth)
│   │   └── components/
│   │       ├── ApplicationCard.jsx
│   │       ├── ApplicationModal.jsx   # Add/edit form
│   │       ├── PipelineColumn.jsx
│   │       ├── StatsHeader.jsx
│   │       └── StatusBadge.jsx
│   └── package.json
│
├── extension/            # Chrome/Edge browser extension
│   ├── manifest.json      # permissions, content script targets, popup config
│   ├── popup.html/css/js  # the UI that opens on icon click + save logic
│   ├── content-scripts/   # one per supported site (DOM scraping)
│   │   ├── linkedin.js
│   │   ├── naukri.js
│   │   ├── internshala.js
│   │   └── indeed.js
│   └── icons/
│
└── docs/                 # supporting notes
```

---

## Running it locally

You'll need two terminals — one for the backend, one for the dashboard.

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
This starts the API at `http://127.0.0.1:8000`. Visit `http://127.0.0.1:8000/docs` for the auto-generated, interactive API explorer — handy for testing endpoints without writing curl commands.

**Dashboard:**
```bash
cd dashboard
npm install
npm run dev
```
This starts the dashboard at `http://localhost:5173`. It expects the backend to already be running on port 8000.

> The backend creates a `job_tracker.db` SQLite file automatically on first run — no manual database setup needed.

**Browser Extension (optional, Chrome/Edge):**
With the backend running, go to `chrome://extensions`, turn on Developer
mode, click **Load unpacked**, and select the `extension/` folder. Full
instructions and how it works in `extension/README.md`.

---

## Using it on iPad

The dashboard installs as a home-screen app on iPad, but it still needs to
reach the FastAPI backend somewhere — and "localhost" on an iPad means the
iPad itself, not your laptop. So for now, this only works while both
devices are on the same WiFi:

1. On your laptop, find its local network IP (Windows: `ipconfig`, look
   for "IPv4 Address" under your WiFi adapter — something like `192.168.1.42`)
2. Start the backend so it listens on the network, not just localhost:
   ```bash
   uvicorn main:app --reload --port 8000 --host 0.0.0.0
   ```
3. On the iPad, open Safari and go to `http://192.168.1.42:5173` (your
   laptop's IP, dashboard's port) — you'll need `dashboard/src/api.js`'s
   `BASE_URL` updated to that same IP too, since right now it points at
   `127.0.0.1`, which only means "this device," wherever it runs.
4. Tap the **Share** button → **Add to Home Screen**

This only works while you're on the same WiFi as your laptop. The
permanent fix is deploying the backend somewhere reachable from anywhere
(Railway, like UPI Sentinel) — deferred for now by design, see Roadmap.

**Why there's no offline support yet:** the part of a PWA that makes it
work without internet (a "service worker") requires the page to be loaded
over HTTPS — plain `http://192.168.x.x` doesn't qualify on iOS Safari. We
skipped this deliberately for now rather than set up certificates just to
test on a local network; it'll make more sense once the backend is
actually deployed to a real HTTPS domain anyway.

---

## The data model

Every application is one record with:

| Field | What it's for |
|---|---|
| `company`, `role` | the basics |
| `platform` | LinkedIn, Naukri, Internshala, Indeed, Company Website, Referral, Other |
| `url` | link back to the original posting |
| `status` | Applied → Screening → Interview → Offer / Rejected |
| `criteria` | the JD requirements or key asks — so when they call back, I remember what I claimed to meet |
| `notes` | referral names, follow-up reminders, salary conversations — anything free-text |
| `date_applied`, `created_at`, `updated_at` | timestamps, mostly to power the "X days since applied" indicator on each card |

Why a fixed 5-stage pipeline instead of letting status be any free text? Because a small, fixed set of stages is what makes the dashboard's column view possible — it's also just how the actual hiring process works almost everywhere I've applied.

---

## Design notes (for anyone reading the code)

A few decisions that might look like "why didn't you just do X" if you're skimming:

- **SQLite, not Postgres** — this is a single-user, local-first tool. SQLite is zero-setup and the whole "database" is one file. If this ever needs multi-user/cloud deployment, swapping to Postgres later is a one-line change to `DATABASE_URL` in `database.py` — the SQLAlchemy models don't change.
- **CORS wide open (`allow_origins=["*"]`)** — fine for now since this only runs on localhost talking to itself. Will get tightened once/if this is ever deployed publicly.
- **Status is a plain string, not a strict Enum at the DB level** — validated at the API layer instead. This means adding a new stage later (like "Withdrawn") is a one-file change in `constants.js` / `schemas.py`, not a database migration.
- **`PATCH`, not `PUT`, for updates** — you can update just the `status` field without resending the whole application. This is what makes "drag a card to a new status" type interactions cheap.
- **Fixed-width pipeline columns, not flexible ones** — on a wide desktop screen all 5 status columns fit, but on iPad width they don't. Letting columns flex/shrink to fit would hide that fact (everything just gets cramped); fixed-width columns plus a horizontal scroll plus a fade-edge hint on the right makes it obvious there's more to scroll to, instead of silently cutting content off.

---

## Roadmap

1. ~~Backend API~~ ✅
2. ~~React dashboard~~ ✅
3. ~~Browser extension~~ ✅
4. ~~PWA setup for iPad~~ ✅
5. Get the backend reachable from the iPad (local network IP today, real deployment later) — see "Using it on iPad" below
6. (Maybe) Cloud-built native iOS app, if the PWA route turns out to be limiting

---

## Author

Built by [Ridham Taneja](https://www.linkedin.com/in/ridham-taneja/) — final-year B.Tech CSE (AI/ML) student, building shipped, deployed projects instead of just theory.
GitHub: [@DeemonDuck](https://github.com/DeemonDuck)
