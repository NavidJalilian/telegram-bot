require('dotenv').config();

const config = {
  // Bot Configuration
  bot: {
    token: process.env.BOT_TOKEN,
    username: process.env.BOT_USERNAME,
    webhook: {
      url: process.env.WEBHOOK_URL,
      port: parseInt(process.env.WEBHOOK_PORT) || 8443,
      path: process.env.WEBHOOK_PATH || '/webhook'
    }
  },

  // Admin Configuration
  admin: {
    userIds: process.env.ADMIN_USER_IDS ?
      process.env.ADMIN_USER_IDS.split(',').map(id => parseInt(id.trim())) : [684084736],
    chatId: process.env.ADMIN_CHAT_ID
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0
  },

  // Application Configuration
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
    logLevel: process.env.LOG_LEVEL || 'info'
  },

  // Transaction Timeouts (in milliseconds)
  timeouts: {
    transaction: (parseInt(process.env.TRANSACTION_TIMEOUT_MINUTES) || 30) * 60 * 1000,
    paymentVerification: (parseInt(process.env.PAYMENT_VERIFICATION_TIMEOUT_HOURS) || 24) * 60 * 60 * 1000,
    accountTransfer: (parseInt(process.env.ACCOUNT_TRANSFER_TIMEOUT_MINUTES) || 15) * 60 * 1000,
    finalVerification: (parseInt(process.env.FINAL_VERIFICATION_TIMEOUT_HOURS) || 2) * 60 * 60 * 1000,
    session: (parseInt(process.env.SESSION_TIMEOUT_HOURS) || 24) * 60 * 60 * 1000
  },

  // Security Configuration
  security: {
    maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
    rateLimitRequestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE) || 10
  },

  // Storage Configuration
  storage: {
    type: process.env.STORAGE_TYPE || 'file',
    path: process.env.STORAGE_PATH || './data',
    backupIntervalHours: parseInt(process.env.BACKUP_INTERVAL_HOURS) || 6
  }
};

// Validation
if (!config.bot.token) {
  throw new Error('BOT_TOKEN is required in environment variables');
}

if (config.admin.userIds.length === 0) {
  console.warn('Warning: No admin user IDs configured');
}

module.exports = config;
