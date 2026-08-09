param(
  [string]$OutputPath = "CapiClub Inventario.exe"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$sourcePath = Join-Path $PSScriptRoot "launcher\CapiClubInventarioLauncher.cs"
$resolvedOutputPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) {
  $OutputPath
} else {
  Join-Path $root $OutputPath
}

if (-not (Test-Path $sourcePath)) {
  throw "No se encontro el codigo fuente del lanzador: $sourcePath"
}

$outputDirectory = Split-Path -Parent $resolvedOutputPath
if ($outputDirectory -and -not (Test-Path $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

if (Test-Path $resolvedOutputPath) {
  Remove-Item -LiteralPath $resolvedOutputPath -Force
}

$source = Get-Content -LiteralPath $sourcePath -Raw
Add-Type `
  -TypeDefinition $source `
  -OutputAssembly $resolvedOutputPath `
  -OutputType ConsoleApplication `
  -ReferencedAssemblies @("System.dll", "System.Core.dll")

Write-Host "Ejecutable creado en $resolvedOutputPath"
