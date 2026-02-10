<<<<<<< HEAD
# Run the FastAPI backend. Tries port 8000, then 8001, then 8002.
# Set $env:PORT to force a specific port (e.g. $env:PORT=8002).

$ports = if ($env:PORT) { @([int]$env:PORT) } else { @(8000, 8001, 8002) }
foreach ($port in $ports) {
    $inUse = $false
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop
        if ($conn) { $inUse = $true }
    } catch {}
    if (-not $inUse) {
        Write-Host "Starting backend on http://127.0.0.1:$port --reload (Ctrl+C to stop)" -ForegroundColor Green
        python -m uvicorn app.main:app --host 127.0.0.1 --port $port --reload
        exit $LASTEXITCODE
    }
    Write-Host "Port $port is in use, trying next..." -ForegroundColor Yellow
}
Write-Host "All ports 8000, 8001, 8002 are in use. Stop an existing process or set PORT=8003" -ForegroundColor Red
exit 1
=======
# Run the FastAPI backend. Tries port 8000, then 8001, then 8002.
# Set $env:PORT to force a specific port (e.g. $env:PORT=8002).

$ports = if ($env:PORT) { @([int]$env:PORT) } else { @(8000, 8001, 8002) }
foreach ($port in $ports) {
    $inUse = $false
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop
        if ($conn) { $inUse = $true }
    } catch {}
    if (-not $inUse) {
        Write-Host "Starting backend on http://127.0.0.1:$port --reload (Ctrl+C to stop)" -ForegroundColor Green
        python -m uvicorn app.main:app --host 127.0.0.1 --port $port --reload
        exit $LASTEXITCODE
    }
    Write-Host "Port $port is in use, trying next..." -ForegroundColor Yellow
}
Write-Host "All ports 8000, 8001, 8002 are in use. Stop an existing process or set PORT=8003" -ForegroundColor Red
exit 1
>>>>>>> 9ea165a1704de24445771a5c551b07ef0ba8c933
