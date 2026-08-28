@echo off
setlocal
cd /d "%~dp0"
if not exist "backend\node_modules" (
  echo Instalando dependencias del backend...
  cd backend
  call npm install
  if errorlevel 1 pause & exit /b 1
  cd ..
)
if not exist "frontend\node_modules" (
  echo Instalando dependencias del frontend...
  cd frontend
  call npm install
  if errorlevel 1 pause & exit /b 1
  cd ..
)
start "Vet Nestor - Backend" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 4 /nobreak >nul
start "Vet Nestor - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 3 /nobreak >nul
start "" http://localhost:5173/
