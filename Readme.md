# ApplyBoard — Job Application Tracker

A tool I built for a problem every job-hunting fresher eventually hits: applying to 50+ jobs across LinkedIn, Naukri, Internshala, and random company portals, then getting a callback and going *"...wait, which one was this again? What did they even ask for?"*

This is that ledger. One place, every application, every platform, current status, and the actual criteria they asked for — so when a recruiter calls, you already know what you said yes to.

**Live app:** [apply-board-two.vercel.app](https://apply-board-two.vercel.app)

---

## Why this exists

If you've never juggled multiple job applications at once, here's what goes wrong without a tracker:

- You apply to the same role twice because you forgot you already did
- A recruiter calls about "the ML Engineer position" and you have three of those open
- You get rejected somewhere and have no idea what criteria you didn't meet, so you can't course-correct
- Weeks pass and an application just... sits there, no follow-up, because you forgot it existed

None of this is solved by a spreadsheet you forget to update. It's solved by making logging an application as close to *zero extra effort* as clicking Apply.

---

## What's built

| Layer | Status | What it does |
|---|---|---|
| **Backend (FastAPI + PostgreSQL)** | ✅ Deployed on Render | REST API — create/list/update/delete applications, filtering, stats. JWT-authenticated. |
| **Dashboard (React)** | ✅ Deployed on Vercel | Visual pipeline view by status. Sign in with Google, your data is yours alone. |
| **Browser Extension** | ✅ Done | One-click capture while applying — auto-fills from LinkedIn, Naukri, Internshala, Indeed. Works on any site via manual button. |
| **iPad / Mobile** | ✅ Done | Installable as a home-screen PWA on iPad via Safari. Works on the deployed URL directly — no local setup needed. |
| **Google Auth** | ✅ Done | Each user signs in with Google. All data is scoped to their account — no one else sees your applications. |

---

## Using the live app

No setup needed. Just:

1. Go to [apply-board-two.vercel.app](https://apply-board-two.vercel.app)
2. Click **Sign in with Google**
3. Start logging applications

Your data is private to your Google account. Sign out from the top-right when done.

**On iPad:** Open the link in Safari → tap the Share button → **Add to Home Screen**. It installs as a full-screen app.

---

## Deploy your own copy (recommended if you want full ownership)

If you'd rather have your own isolated instance with your own database — nothing shared with anyone — here's the full setup. Everything used here is free tier.

**What you'll need:**
- GitHub account (to fork the repo)
- Supabase account (free database + auth)
- Render account (free backend hosting)
- Vercel account (free frontend hosting)

**Step 1 — Fork the repo**

Fork [github.com/DeemonDuck/ApplyBoard](https://github.com/DeemonDuck/ApplyBoard) to your own GitHub account.

**Step 2 — Supabase (database + auth)**

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** → copy the **Session pooler** connection string
3. Go to **Authentication → Providers → Google** → enable it and add your Google OAuth credentials
4. Note your **Project URL** and **anon public key** from **Settings → API**

Update `dashboard/src/supabase.js` with your own project URL and anon key.

**Step 3 — Backend on Render**

1. Go to [render.com](https://render.com) → New → Web Service → connect your forked repo
2. Set Root Directory to `backend`, build command `pip install -r requirements.txt`, start command `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables:
   - `DATABASE_URL` = your Supabase session pooler connection string
   - `PYTHON_VERSION` = `3.11.0`
4. Deploy — note the URL Render gives you (e.g. `https://your-app.onrender.com`)

**Step 4 — Dashboard on Vercel**

1. Update `dashboard/src/api.js` → set `BASE_URL` to your Render backend URL
2. Go to [vercel.com](https://vercel.com) → New Project → import your forked repo
3. Set Root Directory to `dashboard` → Deploy

That's it. You now have a fully isolated instance — your own database, your own backend, your own frontend.

---

## Browser Extension

The extension lets you save a job with one click while you're on the posting page, instead of switching to the dashboard manually.

**Setup (Chrome / Edge):**
1. Download or clone this repo
2. Go to `chrome://extensions` → turn on **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder
4. Make sure you're signed into the dashboard first (the extension talks to the same backend using your session)

Supported sites with auto-fill: LinkedIn, Naukri, Internshala, Indeed. On any other site, use the **Manual capture** button in the popup.

---

## Running locally (for development)

If you want to run everything on your own machine instead of using the live app, this works fully **offline** — no Supabase, no Google sign-in, no cloud database. One signal controls it: if there's **no `backend/.env`**, the backend uses a local SQLite file and skips auth entirely (single local user), exactly like the original setup. A fresh clone has no `.env`, so it's offline by default. (When `backend/.env` *does* set a `DATABASE_URL` — e.g. on Render — it switches to Postgres + Supabase auth.)

**1. Clone the repo**
```bash
git clone https://github.com/DeemonDuck/ApplyBoard.git
cd ApplyBoard
```

**2. Backend** (no `.env` needed for offline — SQLite is used automatically)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Visit `http://127.0.0.1:8000/docs` for the interactive API explorer. A `job_tracker.db` SQLite file is created next to it on first run.

**3. Dashboard**
```bash
cd dashboard
npm install
npm run dev
```

Dashboard runs at `http://localhost:5173`. It auto-detects that it's on localhost, talks to the backend on port 8000, and skips the Google login screen — no code edits needed.

**4. Extension** — load `extension/` as an unpacked extension (see the Browser Extension section). The popup auto-detects a local backend on `http://127.0.0.1:8000` and uses it when it's running, falling back to the deployed backend otherwise.

> To run the local backend against the *cloud* database/auth instead, create `backend/.env` with `DATABASE_URL=your_supabase_connection_string`. That flips it into online mode.

---

## How the pieces fit together

```
Browser Extension
      │
      ▼
FastAPI Backend (Render) ──── Supabase PostgreSQL
      ▲
      │
React Dashboard (Vercel)
```

The extension and dashboard are both just clients of the same backend API. They never talk to each other or touch the database directly. This is why the extension didn't require any dashboard changes when it was added — they're independent.

**Auth flow:** User signs in via Google → Supabase issues a JWT → dashboard sends that token as a Bearer header on every API call → backend verifies the token and only returns that user's data.

### How the extension works internally

A browser extension has separate JS contexts that can't share memory — they communicate via message-passing:

1. **Content script** — injected into the job posting page. Reads the DOM but can't call our backend directly (browser security blocks it).
2. **Popup script** — runs when you click the toolbar icon. This is what calls the backend.

Flow: content script reads the page → popup requests that data via `chrome.tabs.sendMessage` → popup pre-fills the form → you confirm → popup posts to the backend.

---

## Project structure

```
ApplyBoard/
├── backend/
│   ├── main.py           # All API routes + JWT auth
│   ├── database.py       # SQLAlchemy model + DB setup
│   ├── schemas.py        # Pydantic request/response schemas
│   └── requirements.txt
│
├── dashboard/
│   ├── src/
│   │   ├── App.jsx               # Main pipeline view
│   │   ├── api.js                # fetch() wrapper — one place to change the backend URL
│   │   ├── supabase.js           # Supabase client (auth)
│   │   ├── constants.js          # Status pipeline + platform list
│   │   └── components/
│   │       ├── LoginPage.jsx          # Google sign-in screen
│   │       ├── ApplicationModal.jsx   # Add/edit form
│   │       ├── ApplicationRow.jsx
│   │       ├── StatsHeader.jsx
│   │       └── StatusSection.jsx
│   └── package.json
│
├── extension/
│   ├── manifest.json
│   ├── popup.html / popup.css / popup.js
│   ├── content-scripts/
│   │   ├── linkedin.js
│   │   ├── naukri.js
│   │   ├── internshala.js
│   │   └── indeed.js
│   └── icons/
│
└── render.yaml           # Render deployment config
```

---

## Data model

Every application is one row:

| Field | What it's for |
|---|---|
| `user_id` | Supabase user UUID — every row is owned by exactly one user |
| `company`, `role` | the basics |
| `platform` | LinkedIn, Naukri, Internshala, Indeed, Company Website, Referral, Other |
| `url` | link back to the original posting |
| `status` | Applied → Screening → Interview → Offer / Rejected |
| `criteria` | JD requirements / key asks — so when they call back, you remember what you claimed to meet |
| `notes` | referral names, follow-up reminders, salary conversations |
| `full_description` | full raw JD text, auto-captured by the extension |
| `date_applied`, `created_at`, `updated_at` | timestamps |

---

## Design decisions

- **Supabase (Postgres), not SQLite for production** — SQLite is still used for local dev (zero setup). Switching between them is one line in `database.py`.
- **JWT auth, not session cookies** — the extension and dashboard are separate clients; a token in the Authorization header works for both without needing shared cookie state.
- **`PATCH` not `PUT` for updates** — you can update just `status` without resending the whole record. Makes "move card to Interview" a tiny request.
- **Fixed status pipeline, not free text** — `Applied → Screening → Interview → Offer → Rejected`. A fixed set is what makes the column view possible and matches how hiring actually works.
- **CORS wide open** — fine for now since auth handles access control. Worth tightening to specific origins before any serious public launch.

---

## Roadmap

1. ~~Backend API~~ ✅
2. ~~React dashboard~~ ✅
3. ~~Browser extension~~ ✅
4. ~~PWA / iPad support~~ ✅
5. ~~Deploy backend (Render) + database (Supabase)~~ ✅
6. ~~Deploy frontend (Vercel)~~ ✅
7. ~~Google Auth — per-user data isolation~~ ✅
8. Rate limiting on the API

---

## Author

Built by [Ridham Taneja](https://www.linkedin.com/in/ridham-taneja/) — final-year B.Tech CSE (AI/ML) student, building shipped, deployed projects instead of just theory.
GitHub: [@DeemonDuck](https://github.com/DeemonDuck)
