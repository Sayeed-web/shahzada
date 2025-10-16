@echo off
echo Fixing database configuration...
echo.
echo Step 1: Stopping dev server if running...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Regenerating Prisma client...
call npx prisma generate

echo Step 3: Checking database...
if exist "prisma\dev.db" (
    echo Database exists!
) else (
    echo Creating database...
    call npx prisma db push
)

echo.
echo Done! Now restart your dev server with: npm run dev
pause
