@echo off
setlocal

set "APP_DIR=%~dp0"
if not exist "%APP_DIR%package.json" set "APP_DIR=%~dp0..\.."
cd /d "%APP_DIR%"

call scripts\windows\verificar-requisitos.bat
if errorlevel 1 (
  pause
  exit /b 1
)

call scripts\windows\actualizar-capiclub.bat
if errorlevel 1 (
  echo La actualizacion fallo. Revisa el mensaje anterior.
  pause
  exit /b 1
)

if not exist ".next" (
  echo No existe build de produccion. Ejecuta instalar.bat primero.
  pause
  exit /b 1
)

echo Iniciando CapiClub Inventario en http://localhost:3000
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000'"
call npm run start
