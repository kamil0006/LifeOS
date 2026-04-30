**English** · [Polski](README.pl.md)

# LifeOS

## What this project is

**LifeOS** is a **personal dashboard** for day-to-day life: **money**, **productivity** (to-do, calendar, habits, goals), **learning**, and **notes**. The UI follows a **gaming / cyberpunk** style; the intent is serious daily use, not only a mock-up.

The codebase is **actively developed** (≈ v0.1). The interface is **Polish-first**; broader English UI is planned over time. Repository docs are bilingual where it matters (see below).

---

## What actually ships today (honest scope)

### Persistence

| Area | Where data lives (non-demo, logged-in) |
|------|----------------------------------------|
| **Auth**, **finances** (expenses, income, categories, recurring / scheduled expenses), **wishes**, **to-dos**, **calendar events**, **habits**, **goals** | **PostgreSQL** via the Express API |
| **Notes** (inbox, ideas, references, archive) | **Browser `localStorage` only** — no REST sync to the database yet |
| **Learning** (sessions, courses, books, projects, certificates, Pomodoro-style flows, etc.) | **Browser `localStorage` only** — same limitation |

**Demo mode** (`VITE_DEMO_MODE=true`): run **frontend only**. Sample data lives in memory/session-style providers and/or localStorage keys scoped for demo — useful for UI review without Postgres.

### App routes (high level)

- **Dashboard** — overview and shortcuts  
- **Finances** — overview, transactions, recurring, wishes, net worth, analytics (legacy `/expenses` / `/income` redirect into finances)  
- **To-do** — tabs (today / upcoming / all / done), priorities & areas, due date/time, compact options panel, natural-language shortcuts (`jutro`, `#tag`, `!` / `?`, etc.), optional link to a note (`noteId`)  
- **Calendar** — events  
- **Habits** — habits and **goals** (goals are edited here; backed by `/api/goals` when not in demo)  
- **Learning** — overview, time tracking, courses, projects, books, certificates  
- **Notes** — typed notes with markdown-oriented UX  

Cross-cutting: **global search**, **quick add** hooks (e.g. todo / note), JWT auth when backend is enabled.

### Documentation in this repo

Detailed runbooks: **[Getting started — demo vs own account](docs/URUCHOMIENIE.en.md)** · [Polski](docs/URUCHOMIENIE.md).

Full SaaS-style packs (architecture, OpenAPI, deployment, security user guide, etc.) are **not** maintained in `docs/` yet — treat this README + URUCHOMIENIE as the source of truth for contributors.

---

## Run it locally

### Requirements

- **Node.js** 18+
- **PostgreSQL** — only if you use **your own account and database** (non-demo mode). Demo mode needs the frontend only.

### 1. Clone and install

```bash
git clone <your-repo-url>
cd LifeOS
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

`npm run dev` from the repo root runs frontend and backend together — dependencies must be installed in **root**, `frontend`, and `backend`.

### 2. Environment variables

Only **templates** (no secrets) are in git. Copy and edit locally:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Windows (PowerShell):

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

- **`backend/.env`**: set `DATABASE_URL`, `JWT_SECRET`, optional `PORT` (example default **3002**), `FRONTEND_URL` (e.g. `http://localhost:5173`).
- **`frontend/.env`**: `VITE_DEMO_MODE` and `VITE_API_PORT` — **same port number** as backend `PORT` (Vite proxies `/api` to `http://localhost:<VITE_API_PORT>`).

Do not commit `.env` files — they are listed in `.gitignore`.

### 3. Choose a mode

#### A) Quick preview (demo — no database or backend)

In `frontend/.env`:

```env
VITE_DEMO_MODE=true
```

Run **frontend only**:

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** — sample data, no login. Details: [Getting started (EN)](docs/URUCHOMIENIE.en.md) · [Uruchomienie (PL)](docs/URUCHOMIENIE.md).

#### B) Full app (your account, PostgreSQL)

1. Start PostgreSQL and create a database (e.g. `lifeos`), set `DATABASE_URL` in `backend/.env`.
2. In `frontend/.env`, set `VITE_DEMO_MODE=false` (or unset demo) and match `VITE_API_PORT` to the backend `PORT`.
3. Migrate and start:

```bash
cd backend
npx prisma migrate dev
cd ..
npm run dev
```

- **Frontend:** http://localhost:5173  
- **API (direct):** `http://localhost:<PORT>` per `backend/.env` (example **3002**). The browser talks to `/api` via the Vite dev proxy.

**Sign-up / login:** create the first account in the app (non-demo mode).

### Busy ports?

From the repo root:

```bash
npm run kill:ports
```

Stops common dev ports (e.g. 5173, 3002). If your backend uses a different port than the script, stop the process manually or adjust `package.json`.

### Quality check (optional)

From the repo root:

```bash
npm run check
```

Runs frontend lint + production build and backend TypeScript build.

---

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, TanStack Query |
| Backend  | Node.js, Express, Prisma |
| Database | PostgreSQL |
| Auth     | JWT |

Optional hosting: frontend on **Vercel**, backend on **Railway** / **Render** — not documented step-by-step here yet.

---

## License

MIT
