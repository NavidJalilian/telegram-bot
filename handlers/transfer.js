const fa = require('../locales/fa');
const storage = require('../utils/storage');
const Transaction = require('../models/Transaction');
const textFilter = require('../utils/textFilter');
const { TRANSACTION_STATES } = require('../config/constants');

// Start account transfer process
const startAccountTransfer = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const transactionId = ctx.session?.data?.currentTransactionId;
    if (!transactionId) {
      await ctx.reply(fa.errors.transactionNotFound);
      return;
    }
    
    const transactionData = await storage.getTransaction(transactionId);
    if (!transactionData) {
      await ctx.reply(fa.errors.transactionNotFound);
      return;
    }
    
    const transaction = Transaction.fromJSON(transactionData);
    
    // Check if user is the seller
    if (transaction.sellerId !== ctx.user.id) {
      await ctx.reply(fa.errors.unauthorized);
      return;
    }
    
    // Check transaction state
    if (transaction.state !== TRANSACTION_STATES.PAYMENT_VERIFIED) {
      await ctx.reply(fa.errors.invalidState);
      return;
    }
    
    // Update transaction state
    transaction.setState(TRANSACTION_STATES.ACCOUNT_TRANSFER, 'Started account transfer', ctx.user.id);
    await storage.saveTransaction(transaction);
    
    await ctx.reply(fa.transfer.title + '\n\n' + fa.transfer.enterNewEmail, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.cancel, callback_data: 'cancel_transaction' }
          ]
        ]
      }
    });
    
    // Update session state
    await ctx.updateSession({
      state: 'entering_new_email',
      data: { ...ctx.session.data }
    });
  } catch (error) {
    console.error('Start account transfer error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Handle new email input
const handleNewEmailInput = async (ctx) => {
  try {
    const newEmail = ctx.message.text.trim();
    
    // Validate email
    if (!textFilter.isValidEmail(newEmail)) {
      await ctx.reply(fa.transfer.invalidEmail);
      return;
    }
    
    const transactionId = ctx.session?.data?.currentTransactionId;
    if (!transactionId) {
      await ctx.reply(fa.errors.transactionNotFound);
      return;
    }
    
    const transactionData = await storage.getTransaction(transactionId);
    if (!transactionData) {
      await ctx.reply(fa.errors.transactionNotFound);
      return;
    }
    
    const transaction = Transaction.fromJSON(transactionData);
    
    // Update transaction data
    transaction.updateData('transfer', {
      newEmail: newEmail,
      emailSubmittedAt: new Date().toISOString(),
      emailSubmittedBy: ctx.user.id
    });
    
    await storage.saveTransaction(transaction);
    
    await ctx.reply(fa.transfer.requestCode + '\n\n' + fa.transfer.codeInstructions, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📧 درخواست کد تأیید', callback_data: 'request_transfer_code' }
          ],
          [
            { text: fa.cancel, callback_data: 'cancel_transaction' }
          ]
        ]
      }
    });
    
    // Update session state
    await ctx.updateSession({
      state: 'waiting_transfer_code_request',
      data: { ...ctx.session.data }
    });
  } catch (error) {
    console.error('New email input error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Request transfer code
const requestTransferCode = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const transactionId = ctx.session?.data?.currentTransactionId;
    if (!transactionId) {
      await ctx.reply(fa.errors.transactionNotFound);
      return;
    }
    
    const transactionData = await storage.getTransaction(transactionId);
    if (!transactionData) {
      await ctx.reply(fa.errors.transactionNotFound);
      return;
    }
    
    const transaction = Transaction.fromJSON(transactionData);
    
    // Update transaction data
    transaction.updateData('transfer', {
      ...transaction.data.transfer,
      codeRequestedAt: new Date().toISOString(),
      codeRequestedBy: ctx.user.id
    });
    
    await storage.saveTransaction(transaction);
    
    await ctx.reply('✅ درخواست کد تأیید ارسال شد.\n\nحالا کد تأیید ارسال شده به ایمیل قدیمی را وارد کنید:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄 درخواست مجدد کد', callback_data: 'request_transfer_code' }
          ],
          [
            { text: fa.cancel, callback_data: 'cancel_transaction' }
          ]
        ]
      }
    });
    
    // Update session state
    await ctx.updateSession({
      state: 'entering_transfer_code',
      data: { ...ctx.session.data }
    });
    
    // Set timeout for code entry
    setTimeout(async () => {
      try {
        const currentSession = await storage.getSession(ctx.user.id);
        if (currentSession?.state === 'entering_transfer_code') {
          await ctx.telegram.sendMessage(ctx.user.id, '⏰ زمان وارد کردن کد تأیید تمام شد. لطفاً مجدداً تلاش کنید.');
          
          await storage.saveSession(ctx.user.id, {
            ...currentSession,
            state: 'idle'
          });
        }
      } catch (error) {
        console.error('Transfer code timeout error:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes timeout
  } catch (error) {
    console.error('Request transfer code error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Handle transfer code input
const handleTransferCodeInput = async (ctx) => {
  try {
    const transferCode = ctx.message.text.trim();
    
    // Basic validation
    if (transferCode.length < 4 || transferCode.length > 10) {
      await ctx.reply(fa.transfer.invalidCode);
      return;
    }
    
    const transactionId = ctx.session?.data?.currentTransactionId;
    if (!transactionId) {
      await ctx.reply(fa.errors.transactionNotFound);
      return;
    }
    
    const transactionData = await storage.getTransaction(transactionId);
    if (!transactionData) {
      await ctx.reply(fa.errors.transactionNotFound);
      return;
    }
    
    const transaction = Transaction.fromJSON(transactionData);
    
    // Update transaction data
    transaction.updateData('transfer', {
      ...transaction.data.transfer,
      verificationCode: transferCode,
      codeSubmittedAt: new Date().toISOString(),
      codeSubmittedBy: ctx.user.id,
      status: 'code_submitted'
    });
    
    await storage.saveTransaction(transaction);
    
    // In a real implementation, you would verify the code with the email service
    // For this demo, we'll simulate successful verification
    await simulateCodeVerification(ctx, transaction);
  } catch (error) {
    console.error('Transfer code input error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Simulate code verification (in real implementation, this would verify with email service)
const simulateCodeVerification = async (ctx, transaction) => {
  try {
    // Simulate verification delay
    await ctx.reply('🔄 در حال تأیید کد...');
    
    setTimeout(async () => {
      try {
        // Update transaction data
        transaction.updateData('transfer', {
          ...transaction.data.transfer,
          status: 'verified',
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'system'
        });
        
        // Move to buyer verification state
        transaction.setState(TRANSACTION_STATES.BUYER_VERIFICATION, 'Account transfer completed', ctx.user.id);
        await storage.saveTransaction(transaction);
        
        // Reset session state
        await ctx.updateSession({
          state: 'idle',
          data: { ...ctx.session.data }
        });
        
        await ctx.telegram.sendMessage(ctx.user.id, fa.transfer.success + '\n\n' + fa.transfer.multiDeviceOption, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ ادامه به مرحله تأیید خریدار', callback_data: 'continue_buyer_verification' }
              ],
              [
                { text: fa.mainMenu, callback_data: 'main_menu' }
              ]
            ]
          }
        });
        
        // Notify buyer if exists
        if (transaction.buyerId) {
          await notifyBuyerAccountTransferred(ctx, transaction);
        }
        
        // Notify admins
        await notifyAdminsAccountTransferred(ctx, transaction);
      } catch (error) {
        console.error('Code verification simulation error:', error);
      }
    }, 3000); // 3 second delay
  } catch (error) {
    console.error('Simulate code verification error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Retry transfer
const retryTransfer = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const transactionId = ctx.session?.data?.currentTransactionId;
    if (!transactionId) {
      await ctx.reply(fa.errors.transactionNotFound);
      return;
    }
    
    const transactionData = await storage.getTransaction(transactionId);
    if (!transactionData) {
      await ctx.reply(fa.errors.transactionNotFound);
      return;
    }
    
    const transaction = Transaction.fromJSON(transactionData);
    
    // Check retry attempts
    const retryCount = transaction.getRetryCount('transfer');
    if (retryCount >= 3) {
      await ctx.reply('حداکثر تعداد تلاش‌های مجاز تمام شده است. لطفاً با پشتیبانی تماس بگیرید.');
      return;
    }
    
    // Increment retry count
    transaction.incrementRetry('transfer');
    await storage.saveTransaction(transaction);
    
    // Restart transfer process
    await startAccountTransfer(ctx);
  } catch (error) {
    console.error('Retry transfer error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Notify buyer about account transfer
const notifyBuyerAccountTransferred = async (ctx, transaction) => {
  try {
    const message = `✅ اکانت با موفقیت منتقل شد!\n\nمعامله: #${transaction.shortId}\nایمیل جدید: ${transaction.data.transfer.newEmail}\n\nلطفاً وارد اکانت شوید و صحت آن را تأیید کنید.`;
    
    await ctx.telegram.sendMessage(transaction.buyerId, message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ تأیید اکانت', callback_data: `verify_account_${transaction.id}` }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Buyer notification error:', error);
  }
};

// Notify admins about account transfer
const notifyAdminsAccountTransferred = async (ctx, transaction) => {
  try {
    const config = require('../config');
    
    if (config.admin.userIds.length === 0) {
      return;
    }
    
    const message = `🔄 انتقال اکانت تکمیل شد\n\nمعامله: #${transaction.shortId}\nفروشنده: ${ctx.user.getDisplayName()}\nایمیل جدید: ${transaction.data.transfer.newEmail}\n\n⏳ در انتظار تأیید خریدار`;
    
    for (const adminId of config.admin.userIds) {
      try {
        await ctx.telegram.sendMessage(adminId, message, {
          reply_markup: {
            inline_keyboard: [[
              { text: '👁️ مشاهده جزئیات', callback_data: `admin_transaction_${transaction.id}` }
            ]]
          }
        });
      } catch (error) {
        console.error(`Failed to notify admin ${adminId}:`, error);
      }
    }
  } catch (error) {
    console.error('Admin notification error:', error);
  }
};

module.exports = {
  startAccountTransfer,
  handleNewEmailInput,
  requestTransferCode,
  handleTransferCodeInput,
  retryTransfer
};
