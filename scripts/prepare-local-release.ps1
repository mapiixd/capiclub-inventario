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

$launcherPath = Join-Path $root "CapiClub Inventario.exe"
try {
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "scripts\windows\crear-ejecutable.ps1") -OutputPath $launcherPath
} catch {
  Write-Warning "No se pudo crear el ejecutable. La entrega seguira usando los scripts .bat. Detalle: $_"
}

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
Copy-Item -LiteralPath (Join-Path $root "scripts\windows\actualizar-capiclub.bat") -Destination (Join-Path $out "actualizar-capiclub.bat")
Copy-Item -LiteralPath (Join-Path $root "scripts\windows\detener-capiclub.bat") -Destination (Join-Path $out "detener-capiclub.bat")
Copy-Item -LiteralPath (Join-Path $root "scripts\windows\verificar-requisitos.bat") -Destination (Join-Path $out "verificar-requisitos.bat")

if (Test-Path $launcherPath) {
  Copy-Item -LiteralPath $launcherPath -Destination (Join-Path $out "CapiClub Inventario.exe")
}

@"
CapiClub Inventario - Entrega local

1. Instala Node.js LTS desde https://nodejs.org/ si no esta instalado.
2. Ejecuta instalar.bat.
3. Ejecuta CapiClub Inventario.exe.
4. Abre http://localhost:3000 si el navegador no se abre solo.

Si esta carpeta fue instalada con Git, CapiClub Inventario.exe buscara actualizaciones
del repositorio antes de abrir el sistema.

Usuario inicial por defecto:
admin@capiclub.local
Cambiar.12345

IMPORTANTE: cambia la clave del administrador despues de la primera instalacion.
"@ | Set-Content -LiteralPath (Join-Path $out "LEEME-INSTALACION.txt") -Encoding UTF8

Write-Host "Entrega preparada en $out"
