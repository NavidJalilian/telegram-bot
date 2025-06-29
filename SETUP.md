# Telegram Escrow Bot Setup Guide

This guide will help you set up and run the Telegram Escrow Bot for gaming account transactions.

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js 16.0.0 or higher** - [Download here](https://nodejs.org/)
- **Telegram Bot Token** - Get from [@BotFather](https://t.me/botfather)
- **Your Telegram User ID** - Get from [@userinfobot](https://t.me/userinfobot)

### 2. Installation

```bash
# Clone or download the project
cd telegram-escrow-bot

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Test configuration
node test-config.js
```

### 3. Create Your Telegram Bot

1. **Message [@BotFather](https://t.me/botfather)** on Telegram
2. **Send `/newbot`** command
3. **Choose a name** for your bot (e.g., "Gaming Escrow Bot")
4. **Choose a username** (e.g., "gaming_escrow_bot")
5. **Copy the bot token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 4. Get Your User ID

1. **Message [@userinfobot](https://t.me/userinfobot)** on Telegram
2. **Copy your user ID** (a number like: `123456789`)

### 5. Configure Environment Variables

Edit the `.env` file with your settings:

```env
# Required Settings
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
ADMIN_USER_IDS=123456789

# Optional Settings (defaults are fine for testing)
NODE_ENV=development
STORAGE_TYPE=file
STORAGE_PATH=./data
LOG_LEVEL=info
```

### 6. Test Configuration

```bash
node test-config.js
```

If all checks pass, you're ready to start!

### 7. Start the Bot

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## 🔧 Configuration Options

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BOT_TOKEN` | Your Telegram bot token | `123456789:ABC...` |
| `ADMIN_USER_IDS` | Comma-separated admin user IDs | `123456789,987654321` |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `STORAGE_TYPE` | `file` | Storage type (file/redis) |
| `STORAGE_PATH` | `./data` | Data storage directory |
| `LOG_LEVEL` | `info` | Logging level |
| `TRANSACTION_TIMEOUT_MINUTES` | `30` | Transaction timeout |
| `PAYMENT_VERIFICATION_TIMEOUT_HOURS` | `24` | Payment verification timeout |
| `ACCOUNT_TRANSFER_TIMEOUT_MINUTES` | `15` | Account transfer timeout |
| `FINAL_VERIFICATION_TIMEOUT_HOURS` | `2` | Final verification timeout |
| `MAX_RETRY_ATTEMPTS` | `3` | Maximum retry attempts |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | `10` | Rate limiting |

## 🛡️ Security Setup

### 1. Admin Configuration

Add your Telegram user ID to `ADMIN_USER_IDS`:

```env
ADMIN_USER_IDS=123456789,987654321
```

### 2. Content Filtering

The bot automatically filters sensitive content:
- Email addresses
- Passwords
- Account IDs
- Phone numbers
- Card numbers

### 3. Rate Limiting

Built-in protection against spam and abuse:
- Maximum 10 requests per minute per user
- Automatic timeout management
- Session expiration

## 📁 File Structure

```
telegram-escrow-bot/
├── app.js                 # Main application entry
├── bot.js                 # Bot initialization
├── config/                # Configuration files
├── handlers/              # Message handlers
├── middleware/            # Security middleware
├── models/                # Data models
├── utils/                 # Utility functions
├── locales/               # Language files
├── data/                  # Data storage (created automatically)
└── README.md              # Documentation
```

## 🔄 Bot Workflow

### For Sellers:
1. **Start Sale** → Select account type and price
2. **Eligibility Check** → Confirm account can be changed
3. **Payment Details** → Provide card information
4. **Wait for Approval** → Admin verifies payment
5. **Account Transfer** → Transfer to buyer's email
6. **Final Video** → Upload logout video proof

### For Buyers:
1. **Browse Available** → See verified accounts
2. **Purchase** → Select and buy account
3. **Receive Account** → Get transferred account
4. **Verify** → Confirm account works correctly

### For Admins:
1. **Monitor Transactions** → View pending transactions
2. **Verify Payments** → Approve/reject payments
3. **Review Videos** → Approve logout videos
4. **Manage Users** → Handle disputes and issues

## 🚨 Troubleshooting

### Bot Not Starting

1. **Check bot token**: Make sure it's correct and active
2. **Check permissions**: Ensure bot can send messages
3. **Check logs**: Look for error messages in console

### Configuration Errors

```bash
# Test your configuration
node test-config.js

# Check environment variables
cat .env
```

### Storage Issues

```bash
# Check data directory permissions
ls -la data/

# Create directory manually if needed
mkdir -p data/{users,transactions,sessions,logs,backups}
```

### Common Error Messages

| Error | Solution |
|-------|----------|
| `BOT_TOKEN is required` | Add valid bot token to `.env` |
| `Failed to start bot` | Check token and internet connection |
| `Storage initialization failed` | Check file permissions |
| `Admin user IDs not configured` | Add your user ID to `ADMIN_USER_IDS` |

## 📊 Monitoring

### Logs

The bot creates detailed logs in:
- Console output (real-time)
- `data/logs/` directory (daily files)

### Backups

Automatic backups are created:
- Every 6 hours
- Stored in `data/backups/`
- Includes all user and transaction data

### Admin Panel

Access admin features through the bot:
- View system statistics
- Monitor active transactions
- Manage users and disputes
- Create manual backups

## 🔧 Advanced Configuration

### Redis Storage (Optional)

For better performance with many users:

```env
STORAGE_TYPE=redis
REDIS_URL=redis://localhost:6379
```

### Webhook Mode (Production)

For production deployment:

```env
WEBHOOK_URL=https://yourdomain.com
WEBHOOK_PORT=8443
WEBHOOK_PATH=/webhook
```

### Custom Timeouts

Adjust timeouts for your needs:

```env
TRANSACTION_TIMEOUT_MINUTES=60
PAYMENT_VERIFICATION_TIMEOUT_HOURS=48
```

## 🆘 Support

### Getting Help

1. **Check this guide** for common issues
2. **Run test script**: `node test-config.js`
3. **Check logs** for error messages
4. **Create an issue** with details

### Reporting Issues

Include this information:
- Operating system
- Node.js version
- Error messages
- Configuration (without sensitive data)

### Contact

- **Documentation**: README.md
- **Issues**: Create a GitHub issue
- **Security**: Report privately

---

**⚠️ Important**: This bot handles financial transactions. Always test thoroughly before production use and ensure compliance with local laws.
