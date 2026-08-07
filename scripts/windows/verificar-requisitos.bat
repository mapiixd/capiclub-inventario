@echo off
setlocal

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js no esta instalado o no esta en PATH.
  echo Instala Node.js LTS desde https://nodejs.org/
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm no esta instalado o no esta en PATH.
  echo Reinstala Node.js LTS incluyendo npm.
  exit /b 1
)

echo Node:
node --version
echo npm:
npm --version
echo Requisitos OK.
exit /b 0
