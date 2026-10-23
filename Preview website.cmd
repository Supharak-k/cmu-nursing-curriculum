@echo off
python "%~dp0scripts\preview_server.py" --open
if errorlevel 1 pause
