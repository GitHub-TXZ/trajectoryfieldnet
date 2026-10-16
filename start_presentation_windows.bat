@echo off
setlocal
cd /d "%~dp0"
set "PORT=8766"
where py >nul 2>nul
if %errorlevel%==0 goto use_py
where python >nul 2>nul
if %errorlevel%==0 goto use_python
echo Python was not found.
echo Install Python 3 from https://www.python.org/downloads/windows/
pause
exit /b 1

:use_py
start "TrajectoryFieldNet Presentation" http://127.0.0.1:%PORT%/index.html
py -m http.server %PORT% --bind 127.0.0.1
goto done

:use_python
start "TrajectoryFieldNet Presentation" http://127.0.0.1:%PORT%/index.html
python -m http.server %PORT% --bind 127.0.0.1

:done
pause
