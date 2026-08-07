@echo off
setlocal

set "APP_DIR=%~dp0"
if not exist "%APP_DIR%package.json" set "APP_DIR=%~dp0..\.."
cd /d "%APP_DIR%"

call scripts\windows\verificar-requisitos.bat
if errorlevel 1 exit /b 1

if not exist ".env" (
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
    echo Archivo .env creado desde .env.example.
  )
)

echo Instalando dependencias...
call npm install
if errorlevel 1 exit /b 1

echo Generando Prisma Client...
call npm run prisma:generate
if errorlevel 1 exit /b 1

echo Aplicando migraciones...
call npx prisma migrate deploy
if errorlevel 1 exit /b 1

echo Creando datos iniciales...
call npm run prisma:seed
if errorlevel 1 exit /b 1

echo Compilando aplicacion...
call npm run build
if errorlevel 1 exit /b 1

echo Instalacion completada.
echo Usa iniciar-capiclub.bat para abrir el sistema.
pause
