@echo off

echo Updating the bot from GitHub...
git pull origin main
if errorlevel 1 (
    echo Git pull failed! Please check your internet connection and repository setup.
    pause
    exit /b 1
)
echo Bot updated successfully!

echo Installing dependencies...
npm install
if errorlevel 1 (
    echo Dependency installation failed! Please check the errors above.
    pause
    exit /b 1
)
echo Dependencies installed successfully!

pause
