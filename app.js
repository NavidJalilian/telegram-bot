#!/usr/bin/env node

const EscrowBot = require('./bot');
const config = require('./config');
const storage = require('./utils/storage');
const cron = require('node-cron');

// Create bot instance
const bot = new EscrowBot();

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  try {
    // Stop the bot
    await bot.stop();
    
    // Create final backup
    console.log('Creating final backup...');
    await storage.createBackup();
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Setup signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Setup scheduled tasks
const setupScheduledTasks = () => {
  // Backup every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('Creating scheduled backup...');
      const backupPath = await storage.createBackup();
      console.log(`Backup created: ${backupPath}`);
      
      // Cleanup old backups
      await storage.cleanupOldBackups(30);
    } catch (error) {
      console.error('Scheduled backup failed:', error);
    }
  });

  // Cleanup expired sessions every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Cleaning up expired sessions...');
      // Implementation would go here
    } catch (error) {
      console.error('Session cleanup failed:', error);
    }
  });

  // Check for transaction timeouts every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('Checking transaction timeouts...');
      // Implementation would go here
    } catch (error) {
      console.error('Timeout check failed:', error);
    }
  });

  console.log('Scheduled tasks configured');
};

// Main application startup
const main = async () => {
  try {
    console.log('='.repeat(50));
    console.log('🤖 Telegram Escrow Bot');
    console.log('='.repeat(50));
    
    // Validate configuration
    console.log('Validating configuration...');
    if (!config.bot.token) {
      throw new Error('BOT_TOKEN is required');
    }
    
    // Initialize storage
    console.log('Initializing storage...');
    await storage.initializeStorage();
    
    // Create initial backup
    console.log('Creating initial backup...');
    await storage.createBackup();
    
    // Setup scheduled tasks
    console.log('Setting up scheduled tasks...');
    setupScheduledTasks();
    
    // Start the bot
    console.log('Starting bot...');
    await bot.start();
    
    console.log('='.repeat(50));
    console.log('✅ Bot is running successfully!');
    console.log(`📊 Environment: ${config.app.env}`);
    console.log(`🔧 Admin users: ${config.admin.userIds.length}`);
    console.log(`💾 Storage: ${config.storage.type} (${config.storage.path})`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
};

// Start the application
if (require.main === module) {
  main();
}

module.exports = { bot, main };
