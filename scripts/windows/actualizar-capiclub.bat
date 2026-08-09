@echo off
setlocal

set "APP_DIR=%~dp0"
if not exist "%APP_DIR%package.json" set "APP_DIR=%~dp0..\.."
cd /d "%APP_DIR%"

if not exist ".git" (
  echo Instalacion sin repositorio Git. Se omite busqueda de actualizaciones.
  exit /b 0
)

where git >nul 2>nul
if errorlevel 1 (
  echo Git no esta instalado o no esta en PATH. Se omite busqueda de actualizaciones.
  exit /b 0
)

for /f "tokens=*" %%i in ('git rev-parse HEAD 2^>nul') do set "BEFORE=%%i"
if not defined BEFORE (
  echo No se pudo leer el estado Git local. Se omite actualizacion.
  exit /b 0
)

echo Buscando actualizaciones...
git fetch origin main
if errorlevel 1 (
  echo No se pudo conectar al repositorio. Se inicia con la version local.
  exit /b 0
)

for /f "tokens=*" %%i in ('git rev-parse origin/main 2^>nul') do set "REMOTE=%%i"
if not defined REMOTE (
  echo No se pudo leer origin/main. Se inicia con la version local.
  exit /b 0
)

if "%BEFORE%"=="%REMOTE%" (
  echo CapiClub ya esta actualizado.
  exit /b 0
)

git diff --quiet
if errorlevel 1 (
  echo Hay cambios locales sin guardar. No se aplicaran actualizaciones automaticas.
  echo Revisa los cambios manualmente antes de actualizar.
  exit /b 0
)

git pull --ff-only origin main
if errorlevel 1 (
  echo No se pudo aplicar la actualizacion automaticamente.
  echo Se inicia con la version local.
  exit /b 0
)

echo Actualizacion descargada. Preparando aplicacion...

git diff --name-only "%BEFORE%" HEAD | findstr /i /c:"package-lock.json" /c:"package.json" >nul
if not errorlevel 1 (
  echo Dependencias modificadas. Ejecutando npm install...
  call npm install
  if errorlevel 1 exit /b 1
)

echo Generando Prisma Client...
call npm run prisma:generate
if errorlevel 1 exit /b 1

echo Aplicando migraciones...
call npx prisma migrate deploy
if errorlevel 1 exit /b 1

echo Compilando aplicacion actualizada...
call npm run build
if errorlevel 1 exit /b 1

echo Actualizacion aplicada correctamente.
exit /b 0
