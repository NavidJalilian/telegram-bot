const fa = require('../locales/fa');
const storage = require('../utils/storage');
const Transaction = require('../models/Transaction');
const { TRANSACTION_STATES } = require('../config/constants');

// Start eligibility check
const startEligibilityCheck = async (ctx) => {
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
    if (transaction.state !== TRANSACTION_STATES.INITIATED) {
      await ctx.reply(fa.errors.invalidState);
      return;
    }
    
    // Update transaction state
    transaction.setState(TRANSACTION_STATES.ELIGIBILITY_CHECK, 'Started eligibility check', ctx.user.id);
    await storage.saveTransaction(transaction);
    
    await ctx.reply(fa.eligibility.checkTitle + '\n\n' + fa.eligibility.instruction, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.eligibility.hasCapability, callback_data: 'eligibility_yes' },
            { text: fa.eligibility.noCapability, callback_data: 'eligibility_no' }
          ],
          [
            { text: fa.cancel, callback_data: 'cancel_transaction' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Start eligibility check error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Confirm eligibility
const confirmEligibility = async (ctx) => {
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
    if (transaction.state !== TRANSACTION_STATES.ELIGIBILITY_CHECK) {
      await ctx.reply(fa.errors.invalidState);
      return;
    }
    
    // Update transaction data
    transaction.updateData('eligibility', {
      hasCapability: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: ctx.user.id
    });
    
    // Move to payment pending state
    transaction.setState(TRANSACTION_STATES.PAYMENT_PENDING, 'Eligibility confirmed', ctx.user.id);
    await storage.saveTransaction(transaction);
    
    await ctx.reply(fa.eligibility.approved, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💳 ادامه به مرحله پرداخت', callback_data: 'continue_payment' }
          ],
          [
            { text: fa.mainMenu, callback_data: 'main_menu' }
          ]
        ]
      }
    });
    
    // Notify admins
    await notifyAdminsEligibilityConfirmed(ctx, transaction);
  } catch (error) {
    console.error('Confirm eligibility error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Reject eligibility
const rejectEligibility = async (ctx) => {
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
    if (transaction.state !== TRANSACTION_STATES.ELIGIBILITY_CHECK) {
      await ctx.reply(fa.errors.invalidState);
      return;
    }
    
    // Update transaction data
    transaction.updateData('eligibility', {
      hasCapability: false,
      rejectedAt: new Date().toISOString(),
      rejectedBy: ctx.user.id,
      reason: 'Account does not have change capability'
    });
    
    // Cancel transaction
    transaction.setState(TRANSACTION_STATES.CANCELLED, 'Eligibility rejected - no change capability', ctx.user.id);
    await storage.saveTransaction(transaction);
    
    // Reset session
    await ctx.updateSession({
      state: 'idle',
      data: {}
    });
    
    await ctx.reply(fa.eligibility.rejected, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.mainMenu, callback_data: 'main_menu' }
          ]
        ]
      }
    });
    
    // Update user stats
    ctx.user.updateStats({ status: 'cancelled' });
    await storage.saveUser(ctx.user);
    
    // Notify admins
    await notifyAdminsEligibilityRejected(ctx, transaction);
  } catch (error) {
    console.error('Reject eligibility error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Show eligibility instructions
const showEligibilityInstructions = async (ctx) => {
  try {
    const instructionsText = `
🔍 **راهنمای بررسی قابلیت تغییر اکانت**

برای اینکه اکانت شما قابلیت تغییر داشته باشد:

**Gmail:**
• آخرین بار که وارد اکانت Gmail شده‌اید باید بیش از 2 هفته پیش باشد
• اکانت نباید در دستگاه دیگری فعال باشد
• تنظیمات امنیتی اکانت نباید محدودیت داشته باشد

**Supercell ID:**
• آخرین بار که وارد بازی شده‌اید باید بیش از 2 هفته پیش باشد
• اکانت نباید در دستگاه دیگری متصل باشد
• باید امکان تغییر ایمیل در تنظیمات وجود داشته باشد

⚠️ **نکته مهم:**
اگر اکانت شما این شرایط را ندارد، معامله لغو خواهد شد و باید 2 هفته صبر کنید.

✅ **چگونه بررسی کنم؟**
1. وارد تنظیمات اکانت شوید
2. بخش "تغییر ایمیل" یا "Change Email" را بررسی کنید
3. اگر این گزینه فعال است، اکانت شما قابلیت تغییر دارد
    `;
    
    await ctx.reply(instructionsText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ متوجه شدم، ادامه', callback_data: 'continue_eligibility_check' }
          ],
          [
            { text: fa.back, callback_data: 'main_menu' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Show eligibility instructions error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Notify admins about eligibility confirmation
const notifyAdminsEligibilityConfirmed = async (ctx, transaction) => {
  try {
    const config = require('../config');
    
    if (config.admin.userIds.length === 0) {
      return;
    }
    
    const message = `✅ قابلیت تغییر اکانت تأیید شد\n\nمعامله: #${transaction.shortId}\nفروشنده: ${ctx.user.getDisplayName()}\nمبلغ: ${transaction.amount.toLocaleString()} تومان\n\n⏳ در انتظار تأیید پرداخت`;
    
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

// Notify admins about eligibility rejection
const notifyAdminsEligibilityRejected = async (ctx, transaction) => {
  try {
    const config = require('../config');
    
    if (config.admin.userIds.length === 0) {
      return;
    }
    
    const message = `❌ قابلیت تغییر اکانت رد شد\n\nمعامله: #${transaction.shortId}\nفروشنده: ${ctx.user.getDisplayName()}\nدلیل: عدم قابلیت تغییر اکانت\n\n🚫 معامله لغو شد`;
    
    for (const adminId of config.admin.userIds) {
      try {
        await ctx.telegram.sendMessage(adminId, message);
      } catch (error) {
        console.error(`Failed to notify admin ${adminId}:`, error);
      }
    }
  } catch (error) {
    console.error('Admin notification error:', error);
  }
};

module.exports = {
  startEligibilityCheck,
  confirmEligibility,
  rejectEligibility,
  showEligibilityInstructions
};
