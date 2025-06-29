# Cloud Deployment Guide for Telegram Escrow Bot

This guide will help you deploy your Telegram bot to the cloud, bypassing local network restrictions.

## 🚀 **Recommended: Railway Deployment**

Railway is the easiest and most reliable option for Node.js bots.

### **Step 1: Prepare Your Code**

1. **Create GitHub Repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Telegram Escrow Bot"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/telegram-escrow-bot.git
   git push -u origin main
   ```

### **Step 2: Deploy to Railway**

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up with GitHub**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository**
6. **Railway will auto-detect Node.js and deploy**

### **Step 3: Configure Environment Variables**

In Railway dashboard:
1. **Go to your project**
2. **Click "Variables" tab**
3. **Add these variables:**
   ```
   BOT_TOKEN=7699906202:AAEMi08nxQYraqIEAsxsA4SlWJPgbOlqsQI
   ADMIN_USER_IDS=684084736
   NODE_ENV=production
   STORAGE_TYPE=file
   ```

### **Step 4: Test Your Bot**

1. **Check deployment logs** in Railway dashboard
2. **Test your bot:** https://t.me/sevenstarsACbot
3. **Send `/start` to verify it works**

---

## 🔧 **Alternative: Heroku Deployment**

### **Step 1: Install Heroku CLI**
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Or download from: https://devcenter.heroku.com/articles/heroku-cli
```

### **Step 2: Deploy to Heroku**
```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create your-bot-name

# Set environment variables
heroku config:set BOT_TOKEN=7699906202:AAEMi08nxQYraqIEAsxsA4SlWJPgbOlqsQI
heroku config:set ADMIN_USER_IDS=684084736
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

---

## 🌐 **Alternative: Render Deployment**

### **Step 1: Connect GitHub**
1. **Go to [Render.com](https://render.com)**
2. **Sign up with GitHub**
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repository**

### **Step 2: Configure Service**
- **Name:** telegram-escrow-bot
- **Environment:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### **Step 3: Add Environment Variables**
```
BOT_TOKEN=7699906202:AAEMi08nxQYraqIEAsxsA4SlWJPgbOlqsQI
ADMIN_USER_IDS=684084736
NODE_ENV=production
```

---

## 🔧 **Alternative: DigitalOcean App Platform**

### **Step 1: Create App**
1. **Go to [DigitalOcean](https://cloud.digitalocean.com/apps)**
2. **Click "Create App"**
3. **Connect GitHub repository**

### **Step 2: Configure**
- **Source:** GitHub repository
- **Branch:** main
- **Autodeploy:** Yes
- **Build Command:** `npm install`
- **Run Command:** `npm start`

### **Step 3: Environment Variables**
Add the same environment variables as above.

---

## 🎯 **Quick Start: Railway (Recommended)**

**Why Railway?**
- ✅ **Free tier:** 500 hours/month (enough for bot)
- ✅ **Auto-deployment:** Push to GitHub = auto deploy
- ✅ **Easy setup:** No complex configuration
- ✅ **Good performance:** Fast deployment and runtime
- ✅ **Built-in monitoring:** Logs and metrics included

**5-Minute Setup:**
1. Push code to GitHub
2. Connect Railway to GitHub
3. Add environment variables
4. Deploy automatically
5. Test bot immediately

---

## 🔍 **Troubleshooting**

### **Common Issues:**

**1. Bot not responding:**
- Check deployment logs
- Verify environment variables
- Ensure BOT_TOKEN is correct

**2. Build failures:**
- Check Node.js version compatibility
- Verify package.json is correct
- Check for missing dependencies

**3. Runtime errors:**
- Check application logs
- Verify all environment variables are set
- Test locally first if possible

### **Checking Logs:**

**Railway:**
- Go to project dashboard
- Click "Deployments" tab
- View real-time logs

**Heroku:**
```bash
heroku logs --tail
```

**Render:**
- Go to service dashboard
- Click "Logs" tab

---

## 🎉 **Benefits of Cloud Deployment**

1. **Bypasses Network Restrictions:** Cloud servers have unrestricted access to Telegram API
2. **24/7 Uptime:** Your bot runs continuously
3. **Automatic Scaling:** Handles multiple users simultaneously
4. **Easy Updates:** Push to GitHub = automatic deployment
5. **Professional Setup:** Production-ready environment
6. **Free Tiers Available:** Most platforms offer free hosting for small bots

---

## 📝 **Next Steps After Deployment**

1. **Test all bot features**
2. **Set up monitoring and alerts**
3. **Configure custom domain (optional)**
4. **Set up database for production use**
5. **Implement proper logging and analytics**

Your bot will be accessible worldwide once deployed to the cloud! 🌍
