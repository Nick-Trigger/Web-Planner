# Web Planner

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A personal planning app — interactive calendar, task management, and daily notes. Built with FastAPI, React, and PostgreSQL.

## Features

- **Calendar** — Month/year navigation with a full calendar grid; click any day to open its detail view
- **Tasks** — Create tasks with due date/time and priority (normal / medium / high); mark done or delete; tasks appear on their calendar day
- **Daily notes** — Per-date freeform notes with auto-save
- **US holidays** — Fetched from nager.at and displayed on the calendar

## Tech stack

- **Backend** — Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic migrations, managed with [uv](https://github.com/astral-sh/uv)
- **Frontend** — React 19 + TypeScript + [React Compiler](https://react.dev/learn/react-compiler), built with Vite, styled with Tailwind CSS + daisyUI
- **Database** — PostgreSQL 16 (Docker)
- **One-command dev startup** — `dev.ps1` spins up Postgres and opens backend + frontend in Windows Terminal tabs

## Prerequisites

Install once, globally:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — for Postgres
- [Node.js 22 LTS](https://nodejs.org/) — for the frontend
- [uv](https://github.com/astral-sh/uv) — for the Python backend
  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```
- [Windows Terminal](https://aka.ms/terminal) (optional but recommended — `dev.ps1` uses it for tabbed output)

If PowerShell scripts won't run, enable them once per user:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## First-time setup

From the project root:

**1. Create your environment file**
```powershell
Copy-Item .env.example backend\.env
```
The defaults match `docker-compose.yml`, so no edits are needed for local dev.

**2. Install backend dependencies**
```powershell
cd backend
uv sync
cd ..
```

**3. Install frontend dependencies**
```powershell
cd frontend
npm install
cd ..
```

**4. Start Postgres and run the initial migration**
```powershell
.\dev.ps1 -DbOnly
cd backend
uv run alembic upgrade head
cd ..
```

## Daily workflow

One command boots everything:

```powershell
.\dev.ps1
```

This opens:
- **Postgres** on `localhost:5432` (detached, no terminal)
- **Backend** in a Windows Terminal tab — http://localhost:8000 (API docs at `/docs`)
- **Frontend** in a Windows Terminal tab — http://localhost:5173

Other modes:

```powershell
.\dev.ps1 -DbOnly    # just Postgres (useful when running backend tests)
.\dev.ps1 -Stop      # shut down Postgres
```

Stop the backend/frontend with `Ctrl+C` in their respective tabs.

## Project structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint
│   │   ├── config.py         # env-driven settings (pydantic-settings)
│   │   ├── database.py       # SQLAlchemy Base + session
│   │   ├── models.py         # ORM models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   └── routers/          # API endpoints
│   ├── alembic/              # database migrations
│   ├── tests/
│   ├── pyproject.toml
│   └── .env                  # local secrets (gitignored)
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml        # Postgres
├── dev.ps1                   # one-command dev startup
├── .env.example
└── README.md
```

## Common tasks

**Add a backend dependency**
```powershell
cd backend
uv add <package>
```

**Add a frontend dependency**
```powershell
cd frontend
npm install <package>
```

**Create a new database migration**

After editing a SQLAlchemy model:
```powershell
cd backend
uv run alembic revision --autogenerate -m "describe the change"
uv run alembic upgrade head
```

**Inspect the database directly**
```powershell
docker compose exec db psql -U planner -d planner
```

**Run backend tests**
```powershell
cd backend
uv run pytest
```

**Reset the database**
```powershell
docker compose down -v       # -v also deletes the volume
.\dev.ps1 -DbOnly
cd backend
uv run alembic upgrade head
```

## Architecture notes

A few decisions worth knowing about:

- **Alembic reads `DATABASE_URL` from `.env`, not `alembic.ini`.** The `sqlalchemy.url` field in `alembic.ini` is intentionally blank; `alembic/env.py` injects the URL via `config.set_main_option(...)` before any engine is created. This keeps credentials out of committed files.
- **`alembic/env.py` imports `app.models`** even though it looks unused. This forces every model class to register itself with `Base.metadata`, which is what autogenerate scans. Without that import, new tables would silently not appear in migrations.
- **CORS is wide open to `http://localhost:5173`** in dev. Lock this down before deploying to production.
- **`pydantic-settings` instantiation uses `# type: ignore[call-arg]`** because Pylance doesn't understand that fields are populated from environment variables. The runtime validation still catches missing variables loudly.
- **React Compiler is enabled by default.** Components are auto-memoized at build time. Just write idiomatic React and follow the Rules of React — the ESLint plugin will flag violations.

## Troubleshooting

**`uv run alembic ...` fails to parse the URL**
Make sure `backend/.env` exists and contains `DATABASE_URL=...`. Verify with:
```powershell
uv run python -c "from app.config import settings; print(settings.database_url)"
```

**`ModuleNotFoundError: No module named 'sqlalchemy'` (or similar)**
You ran bare `python` or `alembic` instead of going through `uv`. Prefix commands with `uv run`, or activate the venv with `.\.venv\Scripts\Activate.ps1`.

**`nvm` / `uv` / `docker` not recognized after install**
Windows PATH updates don't reach already-open processes. Fully quit VS Code (check the system tray) and reopen, or restart your terminal.

**VS Code's Pylance can't find the `app` module**
Open the workspace root, then `Ctrl+Shift+P` → "Python: Select Interpreter" → pick `backend\.venv\Scripts\python.exe`. If imports still show squiggles, add `"python.analysis.extraPaths": ["./backend"]` to `.vscode/settings.json`.

**`dev.ps1` opens Windows Terminal but tabs immediately error out**
Make sure you're on a recent version of Windows Terminal (1.18+). The script uses the `-d` flag for tab working directories, which older versions don't support.

**Postgres won't start**
Check that Docker Desktop is actually running (not just installed), then `docker compose logs db` to see what's failing. To start from scratch: `docker compose down -v`.

**`.env` file isn't being read**
Windows Explorer hides extensions by default, so Notepad may have saved your file as `.env.txt`. From `backend/`:
```powershell
dir .env*
```
If you see `.env.txt`, rename it: `Rename-Item .env.txt .env`.

## API documentation

With the backend running, interactive API docs are auto-generated by FastAPI:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## License

This project is licensed under the GNU General Public License v3.0 — see the [LICENSE](LICENSE) file for details.