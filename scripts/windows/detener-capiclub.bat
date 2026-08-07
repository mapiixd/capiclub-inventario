@echo off
setlocal

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
  echo Deteniendo proceso %%a en puerto 3000...
  taskkill /PID %%a /F
  echo Listo.
  pause
  exit /b 0
)

echo No se encontro un proceso escuchando en el puerto 3000.
pause
