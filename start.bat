@echo off
title Focus Fitness - Dev Server

echo Starting PostgreSQL...
docker-compose up -d postgres
timeout /t 3 /nobreak > nul

echo Starting Backend...
start "FF Backend" cmd /k "cd /d %~dp0backend && npx nodemon src/app.js"

echo Starting Frontend...
start "FF Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==========================================
echo  Focus Fitness is starting up!
echo  Frontend : http://localhost:3000
echo  Backend  : http://localhost:4000/health
echo  Login    : admin@focusfitness.lk
echo  Password : Admin@1234
echo ==========================================
echo.
pause
