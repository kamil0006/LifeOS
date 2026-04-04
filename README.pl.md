[English](README.md) · **Polski**

# LifeOS

## Czym jest ten projekt

**LifeOS** to osobisty panel do ogarnięcia życia w jednym miejscu: **finanse** (wydatki, przychody, kategorie, wykresy, zaplanowane koszty, zachcianki), **produktywność** (to-do, kalendarz, nawyki, cele), **naukę** (śledzenie godzin, kursów, książek, certyfikatów, projektów), **notatki** oraz lekka **gamifikacja** (osiągnięcia). Interfejs ma charakter gamingowy / cyberpunkowy — funkcjonalnie to jednak narzędzie do codziennego użytku u siebie. Aplikacja w przyszłości będzie też po angielsku; dokumentacja w repozytorium jest już dwujęzyczna.

---

## Jak uruchomić u siebie

### Wymagania

- **Node.js** 18 lub nowszy  
- **PostgreSQL** — tylko jeśli chcesz **własne konto i dane w bazie** (tryb bez demo). W trybie demo wystarczy sam frontend.

### 1. Sklonuj repozytorium i zainstaluj zależności

```bash
git clone <url-repozytorium>
cd LifeOS
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

Skrypt `npm run dev` z katalogu głównego uruchamia frontend i backend naraz — potrzebujesz zainstalowanych paczek we **wszystkich trzech** miejscach (root, `frontend`, `backend`).

### 2. Zmienne środowiskowe

W repozytorium są szablony **bez sekretów**. Skopiuj je i edytuj lokalnie:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Na Windows (PowerShell):

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

- **`backend/.env`**: ustaw `DATABASE_URL` (PostgreSQL), `JWT_SECRET`, opcjonalnie `PORT` (domyślnie w szablonie **3002**), `FRONTEND_URL` (np. `http://localhost:5173`).  
- **`frontend/.env`**: `VITE_DEMO_MODE` oraz `VITE_API_PORT` — **ten sam numer portu**, co `PORT` w backendzie (proxy Vite kieruje `/api` na `http://localhost:<VITE_API_PORT>`).

Plików `.env` nie commitujemy — są w `.gitignore`.

### 3. Wybierz tryb

#### A) Szybki podgląd (demo, bez bazy i backendu)

W `frontend/.env` ustaw:

```env
VITE_DEMO_MODE=true
```

Uruchom **tylko** frontend:

```bash
cd frontend
npm run dev
```

Otwórz **http://localhost:5173** — zobaczysz przykładowe dane, bez logowania. Zmiany są głównie w pamięci sesji (szczegóły: [PL](docs/URUCHOMIENIE.md) · [EN](docs/URUCHOMIENIE.en.md)).

#### B) Pełna aplikacja (własne konto, PostgreSQL)

1. Uruchom PostgreSQL i utwórz bazę (np. `lifeos`), wpisz poprawny `DATABASE_URL` w `backend/.env`.  
2. W `frontend/.env` ustaw `VITE_DEMO_MODE=false` (lub usuń wartość demo) i dopasuj `VITE_API_PORT` do `PORT` backendu.  
3. Migracje i start:

```bash
cd backend
npx prisma migrate dev
cd ..
npm run dev
```

- **Frontend:** http://localhost:5173  
- **API (bezpośrednio):** `http://localhost:<PORT>` — zgodnie z `backend/.env` (w szablonie **3002**). Żądania z przeglądarki idą przez proxy Vite pod `/api`.

**Rejestracja / logowanie:** pierwsze konto tworzysz przez rejestrację w aplikacji (tryb nie-demo).

### Port zajęty?

Z katalogu głównego:

```bash
npm run kill:ports
```

Zatrzymuje typowe porty dev (m.in. 5173). Jeśli backend nasłuchuje na innym porcie niż w skrypcie, zatrzymaj proces ręcznie lub dostosuj skrypt w `package.json`.

---

## Stack

| Warstwa   | Technologie |
|-----------|-------------|
| Frontend  | React, TypeScript, Tailwind CSS, Recharts, Framer Motion, TanStack Query |
| Backend   | Node.js, Express, Prisma |
| Baza      | PostgreSQL |
| Auth      | JWT |

Wdrożenie docelowe (opcjonalnie): frontend np. **Vercel**, backend **Railway** / **Render** — szczegóły poza zakresem tego README.

---

## Moduły (skrót)

| Obszar | Co robi aplikacja |
|--------|-------------------|
| Finanse | Dashboard, wydatki, przychody, kategorie, transakcje, analityka, wartość netto, wydatki cykliczne, zachcianki |
| Produktywność | To-do, kalendarz, nawyki, cele |
| Rozwój | Nauka: przegląd, godziny, kursy, książki, certyfikaty, projekty |
| Inne | Notatki, osiągnięcia |

---

## Więcej dokumentacji

- **[Jak uruchomić (tryby demo vs własne konto, szczegóły)](docs/URUCHOMIENIE.md)** · [English](docs/URUCHOMIENIE.en.md)

## Licencja

MIT
