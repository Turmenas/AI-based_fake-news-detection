@echo off
rem Paleidzia Headline Checker serveri atskirame lange ir atidaro narsykle, kai modeliai uzsikrauna
cd /d "%~dp0"
start "FACT server" .venv\Scripts\python -m uvicorn app.main:app
echo Loading the models, the browser opens when they are ready...
set /a tries=0
:wait
ping -n 3 127.0.0.1 >nul
curl -s -o nul http://127.0.0.1:8000/api/assets && goto open
set /a tries+=1
rem ~3 min laukimo, kol modeliai uzsikrauna; po to tikriausiai klaida serverio lange
if %tries% lss 90 goto wait
echo The server did not start. Check the "FACT server" window for the error.
pause
exit /b 1
:open
start "" http://127.0.0.1:8000
