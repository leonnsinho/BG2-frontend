@echo off
echo 🚀 Starting Partimap Deploy Process...

REM Check if dist folder exists
if not exist "dist" (
    echo 📦 Building project...
    npm run build
) else (
    echo ✅ Build folder found
)

REM Display build info
echo 📊 Build Statistics:
dir dist /s

echo.
echo 🌐 Deploy Options:
echo 1. Manual: Upload 'dist' folder to https://netlify.com/drop
echo 2. CLI: Run 'netlify deploy --prod --dir=dist'
echo 3. Git: Push to repository connected to Netlify
echo.
echo ✅ Project ready for deployment!
echo 🔗 Don't forget to configure environment variables in Netlify dashboard
pause
