# Deployment Guide

This guide covers deploying the Telegram Escrow Bot to production environments.

## 🚀 Production Deployment

### 1. Server Requirements

**Minimum Requirements:**
- **CPU**: 1 vCPU
- **RAM**: 512 MB
- **Storage**: 5 GB SSD
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Node.js**: 16.0.0+

**Recommended for High Traffic:**
- **CPU**: 2+ vCPU
- **RAM**: 2+ GB
- **Storage**: 20+ GB SSD
- **Redis**: For session storage
- **Load Balancer**: For multiple instances

### 2. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Redis (optional but recommended)
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Create application user
sudo useradd -m -s /bin/bash escrowbot
sudo usermod -aG sudo escrowbot
```

### 3. Application Deployment

```bash
# Switch to application user
sudo su - escrowbot

# Clone/upload your application
git clone <your-repo-url> telegram-escrow-bot
cd telegram-escrow-bot

# Install dependencies
npm ci --production

# Copy and configure environment
cp .env.example .env
nano .env  # Configure production settings

# Test configuration
node test-config.js

# Create data directories
mkdir -p data/{users,transactions,sessions,logs,backups}
chmod 755 data
```

### 4. Production Configuration

Create production `.env` file:

```env
# Production Settings
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn

# Bot Configuration
BOT_TOKEN=your_production_bot_token
ADMIN_USER_IDS=your_admin_user_ids

# Storage (Redis recommended for production)
STORAGE_TYPE=redis
REDIS_URL=redis://localhost:6379

# Security
SESSION_TIMEOUT_HOURS=12
RATE_LIMIT_REQUESTS_PER_MINUTE=5

# Webhook (recommended for production)
WEBHOOK_URL=https://yourdomain.com
WEBHOOK_PORT=8443
WEBHOOK_PATH=/webhook

# Timeouts (adjust based on your needs)
TRANSACTION_TIMEOUT_MINUTES=60
PAYMENT_VERIFICATION_TIMEOUT_HOURS=48
```

### 5. Process Management with PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'telegram-escrow-bot',
    script: 'app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Start with PM2:

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u escrowbot --hp /home/escrowbot

# Monitor the application
pm2 monit
```

### 6. Nginx Reverse Proxy (for Webhooks)

Install and configure Nginx:

```bash
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/escrowbot
```

Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /webhook {
        proxy_pass http://localhost:8443;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/escrowbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 8. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

## 📊 Monitoring and Maintenance

### 1. Log Management

```bash
# View PM2 logs
pm2 logs telegram-escrow-bot

# View application logs
tail -f data/logs/$(date +%Y-%m-%d).log

# Rotate logs (add to crontab)
0 0 * * * find /home/escrowbot/telegram-escrow-bot/data/logs -name "*.log" -mtime +30 -delete
```

### 2. Backup Strategy

```bash
# Create backup script
nano backup.sh
```

Backup script:

```bash
#!/bin/bash
BACKUP_DIR="/home/escrowbot/backups"
APP_DIR="/home/escrowbot/telegram-escrow-bot"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application data
tar -czf $BACKUP_DIR/escrowbot_$DATE.tar.gz -C $APP_DIR data/

# Keep only last 30 days of backups
find $BACKUP_DIR -name "escrowbot_*.tar.gz" -mtime +30 -delete

echo "Backup completed: escrowbot_$DATE.tar.gz"
```

Add to crontab:

```bash
chmod +x backup.sh
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /home/escrowbot/backup.sh
```

### 3. Health Monitoring

Create health check script:

```bash
nano health-check.sh
```

```bash
#!/bin/bash
# Check if bot is running
if pm2 list | grep -q "telegram-escrow-bot.*online"; then
    echo "Bot is running"
    exit 0
else
    echo "Bot is not running, restarting..."
    pm2 restart telegram-escrow-bot
    exit 1
fi
```

### 4. Performance Monitoring

```bash
# Monitor system resources
htop

# Monitor PM2 processes
pm2 monit

# Check Redis status (if using)
redis-cli ping

# Check disk usage
df -h

# Check memory usage
free -h
```

## 🔧 Scaling and Optimization

### 1. Database Optimization

For high-traffic deployments, consider:

- **PostgreSQL**: For complex queries and ACID compliance
- **MongoDB**: For flexible document storage
- **Redis Cluster**: For distributed caching

### 2. Load Balancing

For multiple instances:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'telegram-escrow-bot',
    script: 'app.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    // ... other options
  }]
};
```

### 3. CDN and Caching

- Use CDN for static assets
- Implement Redis caching for frequent queries
- Enable Nginx caching for API responses

## 🚨 Security Hardening

### 1. System Security

```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Setup fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban

# Regular security updates
sudo apt install unattended-upgrades -y
```

### 2. Application Security

- Use environment variables for secrets
- Implement rate limiting
- Regular dependency updates
- Security headers in Nginx
- Regular security audits

### 3. Monitoring and Alerts

Set up monitoring for:
- Application uptime
- Error rates
- Response times
- Resource usage
- Security events

## 📞 Support and Troubleshooting

### Common Issues

1. **Bot not responding**: Check PM2 status and logs
2. **High memory usage**: Monitor for memory leaks
3. **Webhook failures**: Check SSL certificate and Nginx config
4. **Database errors**: Check Redis/database connectivity

### Getting Help

- Check application logs
- Monitor system resources
- Review configuration
- Test with development environment

---

**⚠️ Important**: Always test deployments in a staging environment before production!
