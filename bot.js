const { Telegraf } = require('telegraf');
const config = require('./config');
const fa = require('./locales/fa');

// Middleware
const { 
  authenticate, 
  requireRegistration, 
  requireAdmin, 
  checkBlocked, 
  sessionManager, 
  checkTimeout, 
  logActivity 
} = require('./middleware/auth');

const { 
  contentFilter, 
  rateLimit, 
  securityHeaders, 
  errorHandler 
} = require('./middleware/filtering');

// Handlers
const startHandler = require('./handlers/start');
const initiateHandler = require('./handlers/initiate');
const verificationHandler = require('./handlers/verification');
const paymentHandler = require('./handlers/payment');
const transferHandler = require('./handlers/transfer');
const buyerVerificationHandler = require('./handlers/buyerVerification');
const finalVerificationHandler = require('./handlers/finalVerification');
const communicationHandler = require('./handlers/communication');
const adminHandler = require('./handlers/admin');

class EscrowBot {
  constructor() {
    this.bot = new Telegraf(config.bot.token);
    this.setupMiddleware();
    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Global middleware (order matters)
    this.bot.use(errorHandler());
    this.bot.use(securityHeaders());
    this.bot.use(rateLimit());
    this.bot.use(contentFilter());
    this.bot.use(authenticate());
    this.bot.use(sessionManager());
    this.bot.use(checkTimeout());
    this.bot.use(logActivity());
    this.bot.use(checkBlocked());
  }

  setupHandlers() {
    // Start command
    this.bot.start(startHandler.start);
    
    // Help command
    this.bot.help(async (ctx) => {
      await ctx.reply(fa.help.content, {
        reply_markup: {
          inline_keyboard: [[
            { text: fa.back, callback_data: 'main_menu' }
          ]]
        }
      });
    });

    // Main menu callbacks
    this.bot.action('main_menu', startHandler.showMainMenu);
    this.bot.action('start_registration', startHandler.startRegistration);
    this.bot.action('select_buyer_role', async (ctx) => {
      await startHandler.handleRoleSelection(ctx, 'buyer');
    });
    this.bot.action('select_seller_role', async (ctx) => {
      await startHandler.handleRoleSelection(ctx, 'seller');
    });
    this.bot.action('back_to_menu', startHandler.showMainMenu);

    // Transaction initiation
    this.bot.action('start_sale', requireRegistration(), initiateHandler.startSale);
    this.bot.action('start_purchase', requireRegistration(), initiateHandler.startPurchase);
    this.bot.action('my_transactions', requireRegistration(), initiateHandler.showMyTransactions);

    // Communication system
    this.bot.action('communication_menu', requireRegistration(), communicationHandler.showCommunicationMenu);
    this.bot.action('join_chat', communicationHandler.startJoinChat);
    this.bot.action('create_chat', communicationHandler.createNewChat);
    this.bot.action('my_chats', communicationHandler.showMyChats);
    this.bot.action('send_message', communicationHandler.startSendMessage);
    this.bot.action(/^open_chat_(.+)$/, this.openSpecificChat.bind(this));
    this.bot.action('back_to_chat', this.backToCurrentChat.bind(this));
    this.bot.action('refresh_chat', this.refreshCurrentChat.bind(this));
    this.bot.action('leave_chat', this.leaveCurrentChat.bind(this));

    // Account type selection
    this.bot.action(/^account_type_(.+)$/, initiateHandler.selectAccountType);

    // Eligibility verification
    this.bot.action('continue_eligibility_check', verificationHandler.startEligibilityCheck);
    this.bot.action('eligibility_yes', verificationHandler.confirmEligibility);
    this.bot.action('eligibility_no', verificationHandler.rejectEligibility);

    // Payment handling
    this.bot.action('continue_payment', paymentHandler.startPayment);
    this.bot.action(/^payment_approve_(.+)$/, requireAdmin(), paymentHandler.approvePayment);
    this.bot.action(/^payment_reject_(.+)$/, requireAdmin(), paymentHandler.rejectPayment);

    // Account transfer
    this.bot.action('continue_account_transfer', transferHandler.startAccountTransfer);
    this.bot.action('request_transfer_code', transferHandler.requestTransferCode);
    this.bot.action('retry_transfer', transferHandler.retryTransfer);

    // Buyer verification
    this.bot.action('continue_buyer_verification', buyerVerificationHandler.startBuyerVerification);
    this.bot.action('buyer_satisfied', buyerVerificationHandler.buyerSatisfied);
    this.bot.action('buyer_not_satisfied', buyerVerificationHandler.buyerNotSatisfied);

    // Final verification
    this.bot.action('continue_final_verification', finalVerificationHandler.startFinalVerification);
    this.bot.action('upload_logout_video', finalVerificationHandler.startFinalVerification);
    this.bot.action(/^final_approve_(.+)$/, requireAdmin(), finalVerificationHandler.approveVideo);
    this.bot.action(/^final_reject_(.+)$/, requireAdmin(), finalVerificationHandler.rejectVideo);

    // Admin panel
    this.bot.action('admin_panel', requireAdmin(), adminHandler.showAdminPanel);
    this.bot.action('admin_pending_transactions', requireAdmin(), adminHandler.showPendingTransactions);
    this.bot.action(/^admin_transaction_(.+)$/, requireAdmin(), adminHandler.showTransactionDetails);

    // Cancel operations
    this.bot.action('cancel_transaction', this.cancelTransaction.bind(this));
    this.bot.action('cancel_operation', this.cancelOperation.bind(this));

    // Text message handlers based on session state
    this.bot.on('text', this.handleTextMessage.bind(this));
    
    // File handlers
    this.bot.on(['photo', 'video', 'document'], this.handleFileMessage.bind(this));

    // Callback query fallback
    this.bot.on('callback_query', async (ctx) => {
      await ctx.answerCbQuery('عملیات نامعتبر');
    });
  }

  async handleTextMessage(ctx) {
    try {
      const state = ctx.session?.state;

      switch (state) {
        case 'registering_post_id':
          await startHandler.handlePostIdInput(ctx);
          break;
          
        case 'entering_price':
          await initiateHandler.handlePriceInput(ctx);
          break;
          
        case 'entering_description':
          await initiateHandler.handleDescriptionInput(ctx);
          break;
          
        case 'entering_card_details':
          await paymentHandler.handleCardDetailsInput(ctx);
          break;
          
        case 'entering_new_email':
          await transferHandler.handleNewEmailInput(ctx);
          break;
          
        case 'entering_transfer_code':
          await transferHandler.handleTransferCodeInput(ctx);
          break;
          
        case 'entering_buyer_issue':
          await buyerVerificationHandler.handleBuyerIssueInput(ctx);
          break;

        case 'entering_post_id':
          await communicationHandler.handlePostIdInput(ctx);
          break;

        case 'sending_message':
          await communicationHandler.handleMessageInput(ctx);
          break;

        default:
          // Default response for unhandled text
          await ctx.reply('لطفاً از منوی ارائه شده استفاده کنید.', {
            reply_markup: {
              inline_keyboard: [[
                { text: fa.mainMenu, callback_data: 'main_menu' }
              ]]
            }
          });
      }
    } catch (error) {
      console.error('Text message handling error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  }

  async handleFileMessage(ctx) {
    try {
      const state = ctx.session?.state;

      switch (state) {
        case 'uploading_payment_receipt':
          await paymentHandler.handlePaymentReceiptUpload(ctx);
          break;
          
        case 'uploading_logout_video':
          await finalVerificationHandler.handleLogoutVideoUpload(ctx);
          break;
          
        default:
          await ctx.reply('در حال حاضر امکان آپلود فایل وجود ندارد.');
      }
    } catch (error) {
      console.error('File message handling error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  }

  async cancelTransaction(ctx) {
    try {
      await ctx.answerCbQuery();
      
      // Show confirmation
      await ctx.reply('آیا مطمئن هستید که می‌خواهید معامله را لغو کنید؟', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ بله، لغو کن', callback_data: 'confirm_cancel_transaction' },
              { text: '❌ خیر', callback_data: 'main_menu' }
            ]
          ]
        }
      });
    } catch (error) {
      console.error('Cancel transaction error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  }

  async cancelOperation(ctx) {
    try {
      await ctx.answerCbQuery();

      // Reset session to idle
      await ctx.updateSession({
        state: 'idle',
        data: {}
      });

      await startHandler.showMainMenu(ctx);
    } catch (error) {
      console.error('Cancel operation error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  }

  // Communication helper methods
  async openSpecificChat(ctx) {
    try {
      await ctx.answerCbQuery();

      const chatId = ctx.match[1];
      const storage = require('./utils/storage');
      const ChatRoom = require('./models/ChatRoom');

      const chatRoomData = await storage.getChatRoom(chatId);
      if (!chatRoomData) {
        await ctx.reply('❌ گفتگو یافت نشد.');
        return;
      }

      const room = ChatRoom.fromJSON(chatRoomData);

      // Update session
      await ctx.updateSession({
        state: 'in_chat',
        data: {
          currentChatId: room.id,
          postId: room.postId
        }
      });

      await communicationHandler.showChatInterface(ctx, room);
    } catch (error) {
      console.error('Open specific chat error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  }

  async backToCurrentChat(ctx) {
    try {
      await ctx.answerCbQuery();

      const chatId = ctx.session?.data?.currentChatId;
      if (!chatId) {
        await ctx.reply('❌ گفتگو یافت نشد.');
        return;
      }

      const storage = require('./utils/storage');
      const ChatRoom = require('./models/ChatRoom');

      const chatRoomData = await storage.getChatRoom(chatId);
      if (!chatRoomData) {
        await ctx.reply('❌ گفتگو یافت نشد.');
        return;
      }

      const room = ChatRoom.fromJSON(chatRoomData);
      await communicationHandler.showChatInterface(ctx, room);
    } catch (error) {
      console.error('Back to current chat error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  }

  async refreshCurrentChat(ctx) {
    try {
      await ctx.answerCbQuery('🔄 بروزرسانی...');
      await this.backToCurrentChat(ctx);
    } catch (error) {
      console.error('Refresh current chat error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  }

  async leaveCurrentChat(ctx) {
    try {
      await ctx.answerCbQuery();

      const chatId = ctx.session?.data?.currentChatId;
      if (!chatId) {
        await ctx.reply('❌ گفتگو یافت نشد.');
        return;
      }

      const storage = require('./utils/storage');
      const ChatRoom = require('./models/ChatRoom');

      const chatRoomData = await storage.getChatRoom(chatId);
      if (!chatRoomData) {
        await ctx.reply('❌ گفتگو یافت نشد.');
        return;
      }

      const room = ChatRoom.fromJSON(chatRoomData);
      const result = room.removeParticipant(ctx.user.id);

      if (result.success) {
        await storage.saveChatRoom(room);

        // Reset session
        await ctx.updateSession({
          state: 'idle',
          data: {}
        });

        await ctx.reply('✅ از گفتگو خارج شدید.', {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔙 بازگشت به منو', callback_data: 'communication_menu' }
              ]
            ]
          }
        });
      } else {
        await ctx.reply('❌ خطا در خروج از گفتگو.');
      }
    } catch (error) {
      console.error('Leave current chat error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  }

  setupErrorHandling() {
    // Handle bot errors
    this.bot.catch((err, ctx) => {
      console.error('Bot error:', err);
      
      if (ctx) {
        ctx.reply(fa.errors.systemError).catch(console.error);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  }

  async start() {
    try {
      console.log('Starting Telegram Escrow Bot...');
      
      // Start bot
      if (config.bot.webhook.url) {
        // Webhook mode
        await this.bot.telegram.setWebhook(config.bot.webhook.url + config.bot.webhook.path);
        this.bot.startWebhook(config.bot.webhook.path, null, config.bot.webhook.port);
        console.log(`Bot started in webhook mode on port ${config.bot.webhook.port}`);
      } else {
        // Polling mode
        await this.bot.launch();
        console.log('Bot started in polling mode');
      }

      console.log('Telegram Escrow Bot is running!');
    } catch (error) {
      console.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  async stop() {
    try {
      console.log('Stopping bot...');
      this.bot.stop();
      console.log('Bot stopped');
    } catch (error) {
      console.error('Error stopping bot:', error);
    }
  }
}

module.exports = EscrowBot;
