# dev.ps1 — boot the full planner stack for local development
#
# Usage:
#   .\dev.ps1            # start everything
#   .\dev.ps1 -Stop      # stop Postgres (backend/frontend you Ctrl+C in their tabs)
#   .\dev.ps1 -DbOnly    # only start Postgres
#
# First time? You may need:
#   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

param(
    [switch]$Stop,
    [switch]$DbOnly
)

# Always operate relative to this script's location, regardless of cwd
$Root = $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

function Write-Step($msg) {
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Write-Ok($msg) {
    Write-Host "    $msg" -ForegroundColor Green
}

function Write-Err($msg) {
    Write-Host "!!! $msg" -ForegroundColor Red
}

# ---------------------------------------------------------------------------
# Stop mode
# ---------------------------------------------------------------------------
if ($Stop) {
    Write-Step "Stopping Postgres..."
    docker compose -f (Join-Path $Root "docker-compose.yml") down
    Write-Ok "Done. Close the backend/frontend terminal tabs manually."
    exit 0
}

# ---------------------------------------------------------------------------
# Prerequisite checks
# ---------------------------------------------------------------------------
Write-Step "Checking prerequisites..."

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Err "Docker not found on PATH. Install Docker Desktop and restart your terminal."
    exit 1
}

# Is the Docker daemon actually running?
docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Err "Docker is installed but not running. Start Docker Desktop and try again."
    exit 1
}
Write-Ok "Docker is running."

if (-not (Test-Path $Backend)) { Write-Err "backend/ folder not found at $Backend"; exit 1 }
if (-not (Test-Path $Frontend) -and -not $DbOnly) { Write-Err "frontend/ folder not found at $Frontend"; exit 1 }

# ---------------------------------------------------------------------------
# 1. Postgres (detached — doesn't need its own terminal)
# ---------------------------------------------------------------------------
Write-Step "Starting Postgres..."
docker compose -f (Join-Path $Root "docker-compose.yml") up -d
if ($LASTEXITCODE -ne 0) { Write-Err "Postgres failed to start."; exit 1 }

# Wait until Postgres accepts connections
Write-Step "Waiting for Postgres to be ready..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    docker compose -f (Join-Path $Root "docker-compose.yml") exec -T db pg_isready -U planner 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Milliseconds 500
}
if (-not $ready) { Write-Err "Postgres did not become ready in 15s. Check 'docker compose logs db'."; exit 1 }
Write-Ok "Postgres is accepting connections on localhost:5432"

if ($DbOnly) {
    Write-Host ""
    Write-Ok "Postgres is up. Run '.\dev.ps1 -Stop' when you're done."
    exit 0
}

# ---------------------------------------------------------------------------
# 2 & 3. Backend + Frontend in separate terminal tabs
# ---------------------------------------------------------------------------
Write-Step "Launching backend and frontend..."

$wtAvailable = Get-Command wt -ErrorAction SilentlyContinue

if ($wtAvailable) {
    # Windows Terminal: one window, two tabs.
    # -d sets the starting directory; the backtick-semicolon (`;) escapes the ;
    # so PowerShell passes it through to wt as a literal tab separator.
    & wt `
        new-tab --title backend  -d $Backend  powershell -NoExit -Command "uv run uvicorn app.main:app --reload" `
        `; new-tab --title frontend -d $Frontend powershell -NoExit -Command "npm run dev"

    Write-Ok "Opened Windows Terminal with backend + frontend tabs."
} else {
    # Fallback: two separate PowerShell windows
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Backend'; uv run uvicorn app.main:app --reload"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Frontend'; npm run dev"
    Write-Ok "Opened two PowerShell windows (install Windows Terminal for tabbed UI)."
}

Write-Host ""
Write-Host "Stack is up:" -ForegroundColor Green
Write-Host "  Postgres:  localhost:5432"
Write-Host "  Backend:   http://localhost:8000  (docs: http://localhost:8000/docs)"
Write-Host "  Frontend:  http://localhost:5173"
Write-Host ""
Write-Host "To stop: Ctrl+C in each tab, then '.\dev.ps1 -Stop' to shut down Postgres."