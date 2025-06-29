#!/usr/bin/env node

// Telegram bot with proxy support
require('dotenv').config();
const { Telegraf } = require('telegraf');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');

const config = require('./config');
const fa = require('./locales/fa');

class ProxyEscrowBot {
  constructor() {
    // Setup proxy agent if configured
    this.setupProxy();
    
    // Create bot with proxy agent
    const botOptions = {};
    if (this.agent) {
      botOptions.telegram = {
        agent: this.agent
      };
    }
    
    this.bot = new Telegraf(config.bot.token, botOptions);
    this.setupBasicHandlers();
  }

  setupProxy() {
    const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
    const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    const socksProxy = process.env.SOCKS_PROXY || process.env.socks_proxy;

    if (socksProxy) {
      console.log('🔧 Using SOCKS proxy:', socksProxy);
      this.agent = new SocksProxyAgent(socksProxy);
    } else if (httpsProxy) {
      console.log('🔧 Using HTTPS proxy:', httpsProxy);
      this.agent = new HttpsProxyAgent(httpsProxy);
    } else if (httpProxy) {
      console.log('🔧 Using HTTP proxy:', httpProxy);
      this.agent = new HttpsProxyAgent(httpProxy);
    } else {
      console.log('ℹ️ No proxy configured');
      this.agent = null;
    }
  }

  setupBasicHandlers() {
    // Start command
    this.bot.start(async (ctx) => {
      try {
        console.log(`✅ Bot received /start from ${ctx.from.first_name}`);
        
        await ctx.reply(fa.welcome, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🚀 شروع ثبت‌نام', callback_data: 'start_registration' }
              ],
              [
                { text: '❓ راهنما', callback_data: 'help' },
                { text: '🆘 پشتیبانی', url: 'https://t.me/support' }
              ]
            ]
          }
        });
      } catch (error) {
        console.error('Start handler error:', error);
        await ctx.reply('خطا در پردازش درخواست. لطفاً مجدداً تلاش کنید.');
      }
    });

    // Help command
    this.bot.help(async (ctx) => {
      await ctx.reply(`
📚 **راهنمای ربات امن خرید و فروش اکانت**

🎮 این ربات برای معاملات امن اکانت‌های بازی طراحی شده است.

**دستورات:**
/start - شروع کار با ربات
/help - نمایش این راهنما

**ویژگی‌ها:**
✅ سیستم escrow امن
✅ تأیید چندمرحله‌ای
✅ نظارت ادمین
✅ پشتیبانی کامل فارسی

**پشتیبانی:** @support
      `, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🔙 بازگشت', callback_data: 'main_menu' }
          ]]
        }
      });
    });

    // Callback query handlers
    this.bot.action('start_registration', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply('🎉 ثبت‌نام با موفقیت آغاز شد!\n\nاین نسخه آزمایشی ربات است. ویژگی‌های کامل به زودی اضافه خواهد شد.');
    });

    this.bot.action('help', async (ctx) => {
      await ctx.answerCbQuery();
      await this.bot.handleUpdate({ ...ctx.update, message: { ...ctx.update.callback_query.message, text: '/help' } });
    });

    this.bot.action('main_menu', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText('🏠 منوی اصلی', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🚀 شروع ثبت‌نام', callback_data: 'start_registration' }
            ],
            [
              { text: '❓ راهنما', callback_data: 'help' }
            ]
          ]
        }
      });
    });

    // Text message handler
    this.bot.on('text', async (ctx) => {
      console.log(`📨 Message from ${ctx.from.first_name}: ${ctx.message.text}`);
      
      if (ctx.message.text.includes('سلام') || ctx.message.text.includes('hello')) {
        await ctx.reply('سلام! 👋\n\nبرای شروع /start را ارسال کنید.');
      } else {
        await ctx.reply('پیام شما دریافت شد! 📨\n\nبرای استفاده از ربات /start را ارسال کنید.');
      }
    });

    // Error handling
    this.bot.catch((err, ctx) => {
      console.error('❌ Bot error:', err);
      if (ctx) {
        ctx.reply('خطایی رخ داده است. لطفاً مجدداً تلاش کنید.').catch(console.error);
      }
    });
  }

  async testConnection() {
    try {
      console.log('🔍 Testing bot connection...');
      const botInfo = await this.bot.telegram.getMe();
      console.log('✅ Bot connection successful!');
      console.log(`   Name: ${botInfo.first_name}`);
      console.log(`   Username: @${botInfo.username}`);
      console.log(`   ID: ${botInfo.id}`);
      return true;
    } catch (error) {
      console.error('❌ Bot connection failed:', error.message);
      return false;
    }
  }

  async start() {
    try {
      console.log('🚀 Starting Telegram Escrow Bot with Proxy Support...');
      
      // Test connection first
      const connected = await this.testConnection();
      if (!connected) {
        throw new Error('Failed to connect to Telegram API');
      }
      
      // Start bot
      await this.bot.launch();
      console.log('✅ Bot started successfully!');
      console.log('📱 Test your bot: https://t.me/' + config.bot.username);
      console.log('🛑 Press Ctrl+C to stop');
      
    } catch (error) {
      console.error('❌ Failed to start bot:', error.message);
      
      if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
        console.log('\n🔧 Network connectivity issue detected:');
        console.log('   1. Check if you need a VPN (if in restricted region)');
        console.log('   2. Configure proxy settings in .env file');
        console.log('   3. Try different network connection');
      }
      
      process.exit(1);
    }
  }

  stop() {
    console.log('🛑 Stopping bot...');
    this.bot.stop('SIGINT');
  }
}

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the bot
if (require.main === module) {
  const bot = new ProxyEscrowBot();
  bot.start();
}

module.exports = ProxyEscrowBot;
