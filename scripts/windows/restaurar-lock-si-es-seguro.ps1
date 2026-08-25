$ErrorActionPreference = "Stop"

$changes = @(git status --porcelain --untracked-files=no)

if ($changes.Count -eq 0) {
  exit 0
}

$otherChanges = @($changes | Where-Object { $_ -notmatch "^.. package-lock\.json$" })

if ($otherChanges.Count -gt 0) {
  exit 2
}

Write-Host "Se detecto solo package-lock.json modificado. Restaurando version oficial antes de actualizar..."
git restore --staged package-lock.json 2>$null
git restore package-lock.json
exit $LASTEXITCODE
