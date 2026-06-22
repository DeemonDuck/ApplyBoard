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
| **Browser Extension** | 🔜 Next | One-click capture while applying — auto-fills company/role/platform on known sites (LinkedIn, Naukri, Internshala, Indeed), manual capture button everywhere else. |
| **iPad / Mobile access** | 🔜 Later | I apply for jobs mostly from my iPad. Since Apple requires a Mac (or a cloud Mac build service) to ship anything to the App Store, the plan is to get this fully working on Windows first, then either (a) wrap it as a PWA so it installs straight from Safari with zero App Store involvement, or (b) cloud-build a real iOS app later if it's worth the extra step. |

---

## How the pieces fit together

```
┌─────────────────────┐       ┌──────────────────────┐
│  Browser Extension    │──────▶│                        │
│  (capture while        │       │   FastAPI Backend      │──────▶  SQLite
│   applying)             │       │   (localhost:8000)     │        (job_tracker.db)
└─────────────────────┘       │                        │
                                  │                        │◀──────
┌─────────────────────┐       └──────────────────────┘
│  React Dashboard       │◀─────────────┘
│  (review & manage)      │
└─────────────────────┘
```

Both the dashboard and the (future) extension talk to the same backend. One source of truth, no duplicated logic, no syncing headaches.

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
├── extension/            # (coming next) Chrome/Edge browser extension
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

---

## Roadmap

1. ~~Backend API~~ ✅
2. ~~React dashboard~~ ✅
3. Browser extension — manual capture button everywhere, smart auto-fill on LinkedIn/Naukri/Internshala/Indeed
4. PWA setup — so the dashboard installs cleanly on iPad home screen via Safari, no App Store needed
5. (Maybe) Cloud-built native iOS app, if the PWA route turns out to be limiting

---

## Author

Built by [Ridham Taneja](https://www.linkedin.com/in/ridham-taneja/) — final-year B.Tech CSE (AI/ML) student, building shipped, deployed projects instead of just theory.
GitHub: [@DeemonDuck](https://github.com/DeemonDuck)
