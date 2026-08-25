param(
  [string]$AppDirectory = (Get-Location).Path,
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$resolvedAppDirectory = (Resolve-Path -LiteralPath $AppDirectory).Path.TrimEnd("\")
$normalizedAppDirectory = $resolvedAppDirectory.ToLowerInvariant()
$connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

if (-not $connections) {
  Write-Host "Puerto $Port disponible."
  exit 0
}

$stoppedAny = $false
$blockedByOther = $false

foreach ($processId in ($connections | Select-Object -ExpandProperty OwningProcess -Unique)) {
  $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
  $processName = if ($processInfo) { $processInfo.Name } else { "PID $processId" }
  $commandLine = if ($processInfo -and $processInfo.CommandLine) { $processInfo.CommandLine } else { "" }
  $normalizedCommandLine = $commandLine.ToLowerInvariant()

  if ($normalizedCommandLine.Contains($normalizedAppDirectory)) {
    Write-Host "Cerrando instancia anterior de CapiClub en puerto $Port (PID $processId)..."
    Stop-Process -Id $processId -Force
    $stoppedAny = $true
    continue
  }

  Write-Host "El puerto $Port esta ocupado por $processName (PID $processId), pero no parece ser esta instalacion de CapiClub."
  $blockedByOther = $true
}

if ($blockedByOther -and -not $stoppedAny) {
  Write-Host "Cierra ese proceso o cambia el puerto antes de iniciar CapiClub."
  exit 2
}

Start-Sleep -Seconds 1
exit 0
