**English** · [Polski](README.pl.md)

# LifeOS

## What this project is

**LifeOS** is a personal dashboard for everyday life: **money** (expenses, income, categories, charts, recurring costs, wishlist), **productivity** (to-do, calendar, habits, goals), **learning** (hours, courses, books, certificates, projects), **notes**, and light **gamification** (achievements). The UI has a gaming / cyberpunk vibe; under the hood it’s meant for real daily use. The app will gain full **English** support over time; repository docs are bilingual from the start.

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

Stops common dev ports (e.g. 5173). If your backend uses a different port than the script, stop the process manually or adjust `package.json`.

---

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React, TypeScript, Tailwind CSS, Recharts, Framer Motion, TanStack Query |
| Backend  | Node.js, Express, Prisma |
| Database | PostgreSQL |
| Auth     | JWT |

Optional hosting: frontend on **Vercel**, backend on **Railway** / **Render** — out of scope for this README.

---

## Features (overview)

| Area | What’s in the app |
|------|-------------------|
| Money | Dashboard, expenses, income, categories, transactions, analytics, net worth, recurring, wishlist |
| Productivity | To-do, calendar, habits, goals |
| Learning | Overview, hours, courses, books, certificates, projects |
| Other | Notes, achievements |

---

## More docs

- **[Getting started — demo vs own account](docs/URUCHOMIENIE.en.md)** · [Polski](docs/URUCHOMIENIE.md)

## License

MIT
