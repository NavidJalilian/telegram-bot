const fa = require('../locales/fa');
const storage = require('../utils/storage');
const Transaction = require('../models/Transaction');
const { TRANSACTION_STATES } = require('../config/constants');

// Start buyer verification process
const startBuyerVerification = async (ctx) => {
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
    
    // Check if user is the buyer
    if (transaction.buyerId !== ctx.user.id) {
      await ctx.reply(fa.errors.unauthorized);
      return;
    }
    
    // Check transaction state
    if (transaction.state !== TRANSACTION_STATES.BUYER_VERIFICATION) {
      await ctx.reply(fa.errors.invalidState);
      return;
    }
    
    await ctx.reply(fa.buyerVerification.title + '\n\n' + fa.buyerVerification.instruction, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.buyerVerification.satisfied, callback_data: 'buyer_satisfied' },
            { text: fa.buyerVerification.notSatisfied, callback_data: 'buyer_not_satisfied' }
          ],
          [
            { text: fa.cancel, callback_data: 'cancel_transaction' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Start buyer verification error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Buyer satisfied with account
const buyerSatisfied = async (ctx) => {
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
    
    // Check if user is the buyer
    if (transaction.buyerId !== ctx.user.id) {
      await ctx.reply(fa.errors.unauthorized);
      return;
    }
    
    // Check transaction state
    if (transaction.state !== TRANSACTION_STATES.BUYER_VERIFICATION) {
      await ctx.reply(fa.errors.invalidState);
      return;
    }
    
    // Update transaction data
    transaction.updateData('buyerVerification', {
      satisfied: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: ctx.user.id,
      feedback: 'satisfied'
    });
    
    // Move to final verification state
    transaction.setState(TRANSACTION_STATES.FINAL_VERIFICATION, 'Buyer satisfied with account', ctx.user.id);
    await storage.saveTransaction(transaction);
    
    // Reset session state
    await ctx.updateSession({
      state: 'idle',
      data: {}
    });
    
    await ctx.reply(fa.buyerVerification.approved, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.mainMenu, callback_data: 'main_menu' }
          ]
        ]
      }
    });
    
    // Notify seller to upload logout video
    await notifySellerFinalVerification(ctx, transaction);
    
    // Notify admins
    await notifyAdminsBuyerSatisfied(ctx, transaction);
  } catch (error) {
    console.error('Buyer satisfied error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Buyer not satisfied with account
const buyerNotSatisfied = async (ctx) => {
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
    
    // Check if user is the buyer
    if (transaction.buyerId !== ctx.user.id) {
      await ctx.reply(fa.errors.unauthorized);
      return;
    }
    
    // Check transaction state
    if (transaction.state !== TRANSACTION_STATES.BUYER_VERIFICATION) {
      await ctx.reply(fa.errors.invalidState);
      return;
    }
    
    await ctx.reply(fa.buyerVerification.enterIssue, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.cancel, callback_data: 'main_menu' }
          ]
        ]
      }
    });
    
    // Update session state
    await ctx.updateSession({
      state: 'entering_buyer_issue',
      data: { ...ctx.session.data }
    });
  } catch (error) {
    console.error('Buyer not satisfied error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Handle buyer issue input
const handleBuyerIssueInput = async (ctx) => {
  try {
    const issue = ctx.message.text.trim();
    
    // Validate issue description
    if (issue.length < 10) {
      await ctx.reply('لطفاً مشکل را با جزئیات بیشتری شرح دهید (حداقل 10 کاراکتر).');
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
    transaction.updateData('buyerVerification', {
      satisfied: false,
      verifiedAt: new Date().toISOString(),
      verifiedBy: ctx.user.id,
      feedback: 'not_satisfied',
      issue: issue
    });
    
    // Keep transaction in buyer verification state for admin review
    transaction.addAdminNote(`Buyer reported issue: ${issue}`, ctx.user.id);
    await storage.saveTransaction(transaction);
    
    // Reset session state
    await ctx.updateSession({
      state: 'idle',
      data: {}
    });
    
    await ctx.reply('مشکل شما ثبت شد و برای بررسی به ادمین ارسال شد. در اسرع وقت با شما تماس خواهیم گرفت.', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.mainMenu, callback_data: 'main_menu' }
          ]
        ]
      }
    });
    
    // Notify admins about the issue
    await notifyAdminsBuyerIssue(ctx, transaction, issue);
  } catch (error) {
    console.error('Buyer issue input error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Show buyer verification instructions
const showBuyerInstructions = async (ctx) => {
  try {
    const instructionsText = `
✅ **راهنمای تأیید اکانت برای خریدار**

پس از دریافت اکانت، لطفاً موارد زیر را بررسی کنید:

**بررسی دسترسی:**
• وارد اکانت شوید
• مطمئن شوید که رمز عبور تغییر کرده
• بررسی کنید که اکانت در دسترس شماست

**بررسی محتوای اکانت:**
• سطح اکانت مطابق توضیحات باشد
• آیتم‌ها و امکانات موجود باشند
• هیچ محدودیت یا مسدودیتی نداشته باشد

**در صورت مشکل:**
• مشکل را با جزئیات کامل گزارش دهید
• تصاویر یا مدارک مربوطه را ارسال کنید
• صبور باشید تا ادمین بررسی کند

⚠️ **نکته مهم:**
تأیید اکانت به معنای پایان فرآیند خرید است و امکان بازگشت وجه وجود نخواهد داشت.
    `;
    
    await ctx.reply(instructionsText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ متوجه شدم', callback_data: 'continue_buyer_verification' }
          ],
          [
            { text: fa.back, callback_data: 'main_menu' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Show buyer instructions error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Notify seller about final verification requirement
const notifySellerFinalVerification = async (ctx, transaction) => {
  try {
    const message = `✅ خریدار از اکانت راضی است!\n\nمعامله: #${transaction.shortId}\n\n🎥 حالا نوبت مرحله نهایی است. لطفاً ویدیویی از خروج کامل از اکانت ارسال کنید.\n\n⚠️ مهم: در ویدیو مطمئن شوید که گزینه "این اکانت را به خاطر بسپار" غیرفعال باشد.`;
    
    await ctx.telegram.sendMessage(transaction.sellerId, message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎥 ارسال ویدیو خروج', callback_data: `upload_logout_video_${transaction.id}` }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Seller notification error:', error);
  }
};

// Notify admins about buyer satisfaction
const notifyAdminsBuyerSatisfied = async (ctx, transaction) => {
  try {
    const config = require('../config');
    
    if (config.admin.userIds.length === 0) {
      return;
    }
    
    const message = `✅ خریدار از اکانت راضی است\n\nمعامله: #${transaction.shortId}\nخریدار: ${ctx.user.getDisplayName()}\n\n⏳ در انتظار ویدیو خروج از فروشنده`;
    
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

// Notify admins about buyer issue
const notifyAdminsBuyerIssue = async (ctx, transaction, issue) => {
  try {
    const config = require('../config');
    
    if (config.admin.userIds.length === 0) {
      return;
    }
    
    const message = `❌ خریدار مشکلی گزارش کرد\n\nمعامله: #${transaction.shortId}\nخریدار: ${ctx.user.getDisplayName()}\nمشکل: ${issue}\n\n🔍 نیاز به بررسی دارد`;
    
    for (const adminId of config.admin.userIds) {
      try {
        await ctx.telegram.sendMessage(adminId, message, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '👁️ مشاهده جزئیات', callback_data: `admin_transaction_${transaction.id}` }
              ],
              [
                { text: '📞 تماس با خریدار', url: `tg://user?id=${ctx.user.id}` },
                { text: '📞 تماس با فروشنده', url: `tg://user?id=${transaction.sellerId}` }
              ]
            ]
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
  startBuyerVerification,
  buyerSatisfied,
  buyerNotSatisfied,
  handleBuyerIssueInput,
  showBuyerInstructions
};
