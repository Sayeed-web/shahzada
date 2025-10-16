@echo off
REM Automated Database Backup Script
REM Run this daily via Windows Task Scheduler

echo Starting automated backup...

cd /d "%~dp0.."

REM Create backups directory if not exists
if not exist "backups" mkdir backups

REM Create timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set timestamp=%datetime:~0,8%-%datetime:~8,6%

REM Copy database
copy "prisma\dev.db" "backups\backup-%timestamp%.db"

echo Backup completed: backup-%timestamp%.db

REM Keep only last 7 backups
for /f "skip=7 delims=" %%F in ('dir /b /o-d backups\backup-*.db') do (
    del "backups\%%F"
    echo Removed old backup: %%F
)

echo Backup process finished!
