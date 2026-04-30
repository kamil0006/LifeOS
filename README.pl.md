[English](README.md) · **Polski**

# LifeOS

## Czym jest ten projekt

**LifeOS** to **osobisty panel** do codziennych spraw: **finanse**, **produktywność** (to-do, kalendarz, nawyki, cele), **nauka** i **notatki**. Interfejs ma klimat **gaming / cyberpunk**, ale celem jest realne używanie u siebie, a nie tylko „mock”.

Repozytorium jest **aktywnie rozwijane** (około wersji **0.1**). Interfejs jest **najpierw po polsku**; szersze tłumaczenie na angielski jest planowane. Dokumentacja jest dwujęzyczna tam, gdzie ma to sens (patrz niżej).

---

## Co naprawdę jest w projekcie (rzetelny zakres)

### Gdzie zapisywane są dane

| Obszar | Gdzie leżą dane (tryb bez demo, zalogowany użytkownik) |
|--------|---------------------------------------------------------|
| **Logowanie**, **finanse** (wydatki, przychody, kategorie, cykliczne / zaplanowane), **zachcianki**, **to-do**, **wydarzenia w kalendarzu**, **nawyki**, **cele** | **PostgreSQL** przez API Express |
| **Notatki** (inbox, pomysły, referencje, archiwum) | Wyłącznie **`localStorage` w przeglądarce** — na razie bez synchronizacji z bazą przez REST |
| **Nauka** (sesje, kursy, książki, projekty, certyfikaty, timer/Pomodoro itd.) | Też **`localStorage`** — to samo ograniczenie |

**Tryb demo** (`VITE_DEMO_MODE=true`): uruchamiasz **tylko frontend**. Przykładowe dane są w providerach „demo” i/lub pod dedykowanymi kluczami localStorage — wygodne do podglądu UI bez Postgresa.

### Główne widoki (routing)

- **Dashboard** — podsumowanie i skróty  
- **Finanse** — przegląd, transakcje, cykliczne, zachcianki, wartość netto, analityka (stare ścieżki `/expenses` / `/income` przekierowują do finansów)  
- **To-do** — zakładki (dziś / nadchodzące / wszystkie / zrobione), priorytety i obszary, termin i godzina, zwijane opcje, skróty języka naturalnego (`jutro`, `#tag`, `!` / `?` itd.), opcjonalne powiązanie z notatką (`noteId`)  
- **Kalendarz** — wydarzenia  
- **Nawyki** — nawyki i **cele** (cele są w tym module; przy pełnym backendzie idą na `/api/goals`)  
- **Nauka** — przegląd, czas, kursy, projekty, książki, certyfikaty  
- **Notatki** — typy notatek z obsługą markdown w UX  

Ponadto: **globalne wyszukiwanie**, **szybkie dodawanie** (np. zadanie / notatka), logowanie JWT przy włączonym backendzie.

### Dokumentacja w repozytorium

Szczegóły uruchomienia: **[URUCHOMIENIE](docs/URUCHOMIENIE.md)** · [English](docs/URUCHOMIENIE.en.md).

Pełny pakiet „jak w SaaS” (ARCHITECTURE, OpenAPI, DEPLOYMENT, SECURITY itd.) **nie jest** na razie utrzymywany w `docs/` — za punkt odniesienia dla współtwórców służy to README oraz URUCHOMIENIE.

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

Otwórz **http://localhost:5173** — zobaczysz przykładowe dane, bez logowania. Szczegóły: [PL](docs/URUCHOMIENIE.md) · [EN](docs/URUCHOMIENIE.en.md).

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

Zatrzymuje typowe porty dev (m.in. 5173, 3002). Jeśli backend nasłuchuje na innym porcie niż w skrypcie, zatrzymaj proces ręcznie lub dostosuj skrypt w `package.json`.

### Sprawdzenie jakości (opcjonalnie)

Z katalogu głównego:

```bash
npm run check
```

Uruchamia linter i build produkcyjny frontendu oraz build TypeScript backendu.

---

## Stack

| Warstwa   | Technologie |
|-----------|-------------|
| Frontend  | React, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, TanStack Query |
| Backend   | Node.js, Express, Prisma |
| Baza      | PostgreSQL |
| Auth      | JWT |

Wdrożenie docelowe (np. **Vercel** + **Railway** / **Render**) — na razie bez osobnego przewodnika w repozytorium.

---

## Licencja

MIT
