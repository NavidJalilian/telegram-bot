#!/usr/bin/env node

// Simple bot test script
require('dotenv').config();
const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.log('❌ BOT_TOKEN not found in .env file');
  process.exit(1);
}

console.log('🔧 Testing bot connection...');
console.log(`Token: ${BOT_TOKEN.substring(0, 10)}...`);

const bot = new Telegraf(BOT_TOKEN);

// Simple test handler
bot.start((ctx) => {
  console.log('✅ Bot received /start command');
  ctx.reply('🎮 سلام! ربات امن خرید و فروش اکانت‌های بازی آماده است!\n\nبرای شروع /start را ارسال کنید.');
});

bot.help((ctx) => {
  ctx.reply('📚 راهنمای ربات:\n\n/start - شروع کار\n/help - راهنما');
});

bot.on('text', (ctx) => {
  console.log(`📨 Message from ${ctx.from.first_name}: ${ctx.message.text}`);
  ctx.reply('پیام شما دریافت شد! ربات در حال توسعه است.');
});

// Error handling
bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err);
});

// Test bot info
async function testBot() {
  try {
    console.log('🔍 Getting bot info...');
    const botInfo = await bot.telegram.getMe();
    console.log('✅ Bot info received:');
    console.log(`   Name: ${botInfo.first_name}`);
    console.log(`   Username: @${botInfo.username}`);
    console.log(`   ID: ${botInfo.id}`);
    
    console.log('\n🚀 Starting bot...');
    await bot.launch();
    console.log('✅ Bot started successfully!');
    console.log(`📱 Test your bot: https://t.me/${botInfo.username}`);
    console.log('\n💡 Send /start to your bot to test it');
    console.log('🛑 Press Ctrl+C to stop');
    
  } catch (error) {
    console.error('❌ Bot test failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n🔧 Token error - please check:');
      console.log('   1. Bot token is correct');
      console.log('   2. Bot is not deleted');
      console.log('   3. Token is properly set in .env file');
    } else if (error.message.includes('network')) {
      console.log('\n🌐 Network error - please check your internet connection');
    }
    
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n🛑 Stopping bot...');
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('\n🛑 Stopping bot...');
  bot.stop('SIGTERM');
  process.exit(0);
});

// Start the test
testBot();
