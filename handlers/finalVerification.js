const fa = require('../locales/fa');
const storage = require('../utils/storage');
const Transaction = require('../models/Transaction');
const { TRANSACTION_STATES } = require('../config/constants');

// Start final verification process
const startFinalVerification = async (ctx) => {
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
    if (transaction.state !== TRANSACTION_STATES.FINAL_VERIFICATION) {
      await ctx.reply(fa.errors.invalidState);
      return;
    }
    
    await ctx.reply(fa.finalVerification.title + '\n\n' + fa.finalVerification.instruction, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.finalVerification.uploadVideo, callback_data: 'upload_logout_video' }
          ],
          [
            { text: '❓ راهنمای ضبط ویدیو', callback_data: 'video_instructions' }
          ],
          [
            { text: fa.cancel, callback_data: 'cancel_transaction' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Start final verification error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Handle logout video upload
const handleLogoutVideoUpload = async (ctx) => {
  try {
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
    
    // Validate video
    if (!ctx.message.video) {
      await ctx.reply(fa.finalVerification.invalidVideo);
      return;
    }
    
    const video = ctx.message.video;
    
    // Check video duration (should be reasonable)
    if (video.duration > 300) { // 5 minutes max
      await ctx.reply('ویدیو نباید بیش از 5 دقیقه باشد.');
      return;
    }
    
    if (video.duration < 10) { // 10 seconds min
      await ctx.reply('ویدیو باید حداقل 10 ثانیه باشد.');
      return;
    }
    
    // Add video to transaction
    transaction.addFile({
      type: 'logout_video',
      fileId: video.file_id,
      fileType: 'video',
      duration: video.duration,
      fileSize: video.file_size,
      uploadedBy: ctx.user.id
    });
    
    // Update transaction data
    transaction.updateData('finalVerification', {
      videoUploaded: true,
      videoUploadedAt: new Date().toISOString(),
      videoUploadedBy: ctx.user.id,
      status: 'pending_admin_review'
    });
    
    await storage.saveTransaction(transaction);
    
    // Reset session state
    await ctx.updateSession({
      state: 'idle',
      data: { ...ctx.session.data }
    });
    
    await ctx.reply(fa.finalVerification.videoReceived, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.mainMenu, callback_data: 'main_menu' }
          ]
        ]
      }
    });
    
    // Notify admins for video review
    await notifyAdminsVideoReview(ctx, transaction);
  } catch (error) {
    console.error('Logout video upload error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Admin approve video
const approveVideo = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    // Extract transaction ID from callback data
    const callbackData = ctx.callbackQuery.data;
    const transactionId = callbackData.split('_').pop();
    
    const transactionData = await storage.getTransaction(transactionId);
    if (!transactionData) {
      await ctx.reply(fa.errors.transactionNotFound);
      return;
    }
    
    const transaction = Transaction.fromJSON(transactionData);
    
    // Check transaction state
    if (transaction.state !== TRANSACTION_STATES.FINAL_VERIFICATION) {
      await ctx.reply(fa.errors.invalidState);
      return;
    }
    
    // Update transaction data
    transaction.updateData('finalVerification', {
      ...transaction.data.finalVerification,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: ctx.user.id
    });
    
    // Complete transaction
    transaction.setState(TRANSACTION_STATES.COMPLETED, 'Final verification approved - transaction completed', ctx.user.id);
    await storage.saveTransaction(transaction);
    
    await ctx.reply(`✅ ویدیو معامله #${transaction.shortId} تأیید شد. معامله با موفقیت تکمیل شد!`);
    
    // Notify both parties
    await notifyTransactionCompleted(ctx, transaction);
    
    // Update user statistics
    await updateUserStats(transaction);
  } catch (error) {
    console.error('Approve video error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Admin reject video
const rejectVideo = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    // Extract transaction ID from callback data
    const callbackData = ctx.callbackQuery.data;
    const transactionId = callbackData.split('_').pop();
    
    const transactionData = await storage.getTransaction(transactionId);
    if (!transactionData) {
      await ctx.reply(fa.errors.transactionNotFound);
      return;
    }
    
    const transaction = Transaction.fromJSON(transactionData);
    
    // Check transaction state
    if (transaction.state !== TRANSACTION_STATES.FINAL_VERIFICATION) {
      await ctx.reply(fa.errors.invalidState);
      return;
    }
    
    // Update transaction data
    transaction.updateData('finalVerification', {
      ...transaction.data.finalVerification,
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: ctx.user.id
    });
    
    await storage.saveTransaction(transaction);
    
    await ctx.reply(`❌ ویدیو معامله #${transaction.shortId} رد شد. فروشنده باید ویدیو جدیدی ارسال کند.`);
    
    // Notify seller to upload new video
    await notifySellerVideoRejected(ctx, transaction);
  } catch (error) {
    console.error('Reject video error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Show video recording instructions
const showVideoInstructions = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const instructionsText = `
🎥 **راهنمای ضبط ویدیو خروج از اکانت**

برای ضبط ویدیو مناسب، مراحل زیر را دنبال کنید:

**مراحل ضبط:**
1️⃣ ضبط صفحه خود را شروع کنید
2️⃣ وارد اکانت شوید (Gmail یا بازی)
3️⃣ به تنظیمات اکانت بروید
4️⃣ گزینه خروج (Sign Out/Logout) را انتخاب کنید
5️⃣ مطمئن شوید گزینه "Remember Account" غیرفعال است
6️⃣ خروج را تأیید کنید
7️⃣ نشان دهید که از اکانت خارج شده‌اید

**نکات مهم:**
⚠️ ویدیو باید واضح و قابل فهم باشد
⚠️ تمام مراحل خروج باید نمایش داده شود
⚠️ گزینه "Remember Account" حتماً غیرفعال باشد
⚠️ حداکثر مدت ویدیو: 5 دقیقه
⚠️ حداقل مدت ویدیو: 10 ثانیه

**در صورت رد شدن:**
اگر ویدیو شما رد شد، مجدداً با رعایت نکات بالا ویدیو ضبط کنید.
    `;
    
    await ctx.reply(instructionsText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ متوجه شدم، ضبط می‌کنم', callback_data: 'upload_logout_video' }
          ],
          [
            { text: fa.back, callback_data: 'continue_final_verification' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Show video instructions error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Notify admins for video review
const notifyAdminsVideoReview = async (ctx, transaction) => {
  try {
    const config = require('../config');
    
    if (config.admin.userIds.length === 0) {
      return;
    }
    
    const message = `🎥 ویدیو خروج از اکانت آپلود شد\n\nمعامله: #${transaction.shortId}\nفروشنده: ${ctx.user.getDisplayName()}\n\n🔍 نیاز به بررسی و تأیید دارد`;
    
    for (const adminId of config.admin.userIds) {
      try {
        await ctx.telegram.sendMessage(adminId, message, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ تأیید ویدیو', callback_data: `final_approve_${transaction.id}` },
                { text: '❌ رد ویدیو', callback_data: `final_reject_${transaction.id}` }
              ],
              [
                { text: '👁️ مشاهده جزئیات', callback_data: `admin_transaction_${transaction.id}` }
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

// Notify both parties about transaction completion
const notifyTransactionCompleted = async (ctx, transaction) => {
  try {
    const completionMessage = `🎉 معامله با موفقیت تکمیل شد!\n\nمعامله: #${transaction.shortId}\nمبلغ: ${transaction.amount.toLocaleString()} تومان\n\nتشکر از استفاده از خدمات ما!`;
    
    // Notify seller
    await ctx.telegram.sendMessage(transaction.sellerId, completionMessage + '\n\n💰 وجه به حساب شما واریز خواهد شد.');
    
    // Notify buyer
    if (transaction.buyerId) {
      await ctx.telegram.sendMessage(transaction.buyerId, completionMessage + '\n\n🎮 اکانت به طور کامل در اختیار شماست.');
    }
  } catch (error) {
    console.error('Transaction completion notification error:', error);
  }
};

// Notify seller about video rejection
const notifySellerVideoRejected = async (ctx, transaction) => {
  try {
    const message = `❌ ویدیو خروج از اکانت رد شد\n\nمعامله: #${transaction.shortId}\n\nلطفاً ویدیو جدیدی با رعایت نکات زیر ارسال کنید:\n• تمام مراحل خروج نمایش داده شود\n• گزینه "Remember Account" غیرفعال باشد\n• ویدیو واضح و قابل فهم باشد`;
    
    await ctx.telegram.sendMessage(transaction.sellerId, message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎥 ارسال ویدیو جدید', callback_data: `upload_logout_video_${transaction.id}` }
          ],
          [
            { text: '❓ راهنمای ضبط', callback_data: 'video_instructions' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Seller notification error:', error);
  }
};

// Update user statistics after transaction completion
const updateUserStats = async (transaction) => {
  try {
    // Update seller stats
    const sellerData = await storage.getUser(transaction.sellerId);
    if (sellerData) {
      const seller = require('../models/User').fromJSON(sellerData);
      seller.updateStats({ status: 'completed', amount: transaction.amount });
      await storage.saveUser(seller);
    }
    
    // Update buyer stats
    if (transaction.buyerId) {
      const buyerData = await storage.getUser(transaction.buyerId);
      if (buyerData) {
        const buyer = require('../models/User').fromJSON(buyerData);
        buyer.updateStats({ status: 'completed', amount: transaction.amount });
        await storage.saveUser(buyer);
      }
    }
  } catch (error) {
    console.error('Update user stats error:', error);
  }
};

module.exports = {
  startFinalVerification,
  handleLogoutVideoUpload,
  approveVideo,
  rejectVideo,
  showVideoInstructions
};
