@echo off
:: Check if the bot is built
if not exist "dist\index.js" (
    echo Bot not built yet. Building now...
    npm run build
    if errorlevel 1 (
        echo Build failed! Exiting.
        pause
        exit /b 1
    )
    echo Build complete!
)
echo Starting bot...
npm run start
echo Bot has stopped. Press any key to close this window.
pause >nul