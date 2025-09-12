#!/bin/bash
# Deploy script for Netlify

echo "🚀 Starting Partimap Deploy Process..."

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "📦 Building project..."
    npm run build
else
    echo "✅ Build folder found"
fi

# Check build size
echo "📊 Build Statistics:"
du -sh dist/
echo "📁 Files in build:"
ls -la dist/

echo ""
echo "🌐 Deploy Options:"
echo "1. Manual: Upload 'dist' folder to https://netlify.com/drop"
echo "2. CLI: Run 'netlify deploy --prod --dir=dist'"
echo "3. Git: Push to repository connected to Netlify"
echo ""
echo "✅ Project ready for deployment!"
echo "🔗 Don't forget to configure environment variables in Netlify dashboard"
