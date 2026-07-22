@echo off
echo ==========================================
echo       Dilgorithm Project Launcher
echo ==========================================
echo.
echo Starting Backend (Django/Daphne) and Frontend (Vite) in separate windows...
echo.

:: Start Django backend in a new command window
start "Dilgorithm Backend" cmd /k "echo --- Starting Backend --- && cd backend && .\venv\Scripts\activate && python manage.py runserver"

:: Start React frontend in a new command window
start "Dilgorithm Frontend" cmd /k "echo --- Starting Frontend --- && cd frontend && npm run dev"

echo.
echo Launched! You can view:
echo   - Frontend: http://localhost:5174
echo   - Backend API: http://127.0.0.1:8000
echo.
pause
