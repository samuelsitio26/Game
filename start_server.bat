@echo off
echo Starting HTTP Server for Space Invaders Game...
echo.
echo Game will be available at: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
pause
