param(
  [string]$OutputDir = "dist-local"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$out = Join-Path $root $OutputDir

if (Test-Path $out) {
  Remove-Item -LiteralPath $out -Recurse -Force
}

New-Item -ItemType Directory -Path $out | Out-Null

$items = @(
  "src",
  "prisma",
  "public",
  "docs",
  "scripts",
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "postcss.config.mjs",
  "tsconfig.json",
  "eslint.config.mjs",
  "middleware.ts",
  ".env.example",
  "README.md"
)

foreach ($item in $items) {
  $source = Join-Path $root $item
  if (Test-Path $source) {
    Copy-Item -LiteralPath $source -Destination $out -Recurse
  }
}

Copy-Item -LiteralPath (Join-Path $root "scripts\windows\instalar.bat") -Destination (Join-Path $out "instalar.bat")
Copy-Item -LiteralPath (Join-Path $root "scripts\windows\iniciar-capiclub.bat") -Destination (Join-Path $out "iniciar-capiclub.bat")
Copy-Item -LiteralPath (Join-Path $root "scripts\windows\detener-capiclub.bat") -Destination (Join-Path $out "detener-capiclub.bat")
Copy-Item -LiteralPath (Join-Path $root "scripts\windows\verificar-requisitos.bat") -Destination (Join-Path $out "verificar-requisitos.bat")

@"
CapiClub Inventario - Entrega local

1. Instala Node.js LTS desde https://nodejs.org/ si no esta instalado.
2. Ejecuta instalar.bat.
3. Ejecuta iniciar-capiclub.bat.
4. Abre http://localhost:3000 si el navegador no se abre solo.

Usuario inicial por defecto:
admin@capiclub.local
Cambiar.12345

IMPORTANTE: cambia la clave del administrador despues de la primera instalacion.
"@ | Set-Content -LiteralPath (Join-Path $out "LEEME-INSTALACION.txt") -Encoding UTF8

Write-Host "Entrega preparada en $out"
