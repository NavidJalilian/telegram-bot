#!/bin/bash

# Telegram Escrow Bot Deployment Script

echo "🚀 Deploying Telegram Escrow Bot..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Telegram Escrow Bot"
    git branch -M main
    
    echo "📋 Next steps:"
    echo "1. Create a GitHub repository"
    echo "2. Add remote: git remote add origin https://github.com/YOUR_USERNAME/telegram-escrow-bot.git"
    echo "3. Push: git push -u origin main"
    echo "4. Deploy to Railway/Heroku/Render"
else
    echo "📝 Updating repository..."
    git add .
    git commit -m "Update: $(date)"
    git push
    echo "✅ Code pushed to repository"
fi

echo ""
echo "🌐 Cloud Deployment Options:"
echo ""
echo "1️⃣ Railway (Recommended):"
echo "   • Go to https://railway.app"
echo "   • Connect GitHub repository"
echo "   • Add environment variables"
echo "   • Deploy automatically"
echo ""
echo "2️⃣ Heroku:"
echo "   • Install Heroku CLI"
echo "   • Run: heroku create your-bot-name"
echo "   • Set environment variables"
echo "   • Deploy: git push heroku main"
echo ""
echo "3️⃣ Render:"
echo "   • Go to https://render.com"
echo "   • Connect GitHub repository"
echo "   • Configure as Node.js service"
echo "   • Add environment variables"
echo ""
echo "📋 Required Environment Variables:"
echo "   BOT_TOKEN=7699906202:AAEMi08nxQYraqIEAsxsA4SlWJPgbOlqsQI"
echo "   ADMIN_USER_IDS=684084736"
echo "   NODE_ENV=production"
echo ""
echo "🎯 Your bot will be available at: https://t.me/sevenstarsACbot"
echo ""
echo "📚 For detailed instructions, see: CLOUD-DEPLOYMENT.md"
