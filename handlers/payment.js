const fa = require('../locales/fa');
const storage = require('../utils/storage');
const Transaction = require('../models/Transaction');
const { TRANSACTION_STATES } = require('../config/constants');

// Start payment process
const startPayment = async (ctx) => {
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
    if (transaction.state !== TRANSACTION_STATES.PAYMENT_PENDING) {
      await ctx.reply(fa.errors.invalidState);
      return;
    }
    
    await ctx.reply(fa.payment.title + '\n\n' + fa.payment.enterCardDetails, {
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
      state: 'entering_card_details',
      data: { ...ctx.session.data }
    });
  } catch (error) {
    console.error('Start payment error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Handle card details input
const handleCardDetailsInput = async (ctx) => {
  try {
    const cardDetails = ctx.message.text.trim();
    
    // Basic validation
    if (cardDetails.length < 20) {
      await ctx.reply(fa.payment.invalidCardDetails);
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
    transaction.updateData('payment', {
      cardDetails: cardDetails,
      submittedAt: new Date().toISOString(),
      submittedBy: ctx.user.id,
      status: 'pending_admin_approval'
    });
    
    await storage.saveTransaction(transaction);
    
    // Reset session state
    await ctx.updateSession({
      state: 'idle',
      data: { ...ctx.session.data }
    });
    
    await ctx.reply(fa.payment.waitingAdmin, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.mainMenu, callback_data: 'main_menu' }
          ]
        ]
      }
    });
    
    // Notify admins
    await notifyAdminsPaymentRequest(ctx, transaction);
  } catch (error) {
    console.error('Card details input error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Admin approve payment
const approvePayment = async (ctx) => {
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
    if (transaction.state !== TRANSACTION_STATES.PAYMENT_PENDING) {
      await ctx.reply(fa.errors.invalidState);
      return;
    }
    
    // Update transaction
    transaction.updateData('payment', {
      ...transaction.data.payment,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: ctx.user.id
    });
    
    transaction.setState(TRANSACTION_STATES.PAYMENT_VERIFIED, 'Payment approved by admin', ctx.user.id);
    await storage.saveTransaction(transaction);
    
    await ctx.reply(`✅ پرداخت معامله #${transaction.shortId} تأیید شد.`);
    
    // Notify seller
    await notifySellerPaymentApproved(ctx, transaction);
    
    // Make transaction available for buyers
    await notifyBuyersTransactionAvailable(ctx, transaction);
  } catch (error) {
    console.error('Approve payment error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Admin reject payment
const rejectPayment = async (ctx) => {
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
    if (transaction.state !== TRANSACTION_STATES.PAYMENT_PENDING) {
      await ctx.reply(fa.errors.invalidState);
      return;
    }
    
    // Update transaction
    transaction.updateData('payment', {
      ...transaction.data.payment,
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: ctx.user.id
    });
    
    transaction.setState(TRANSACTION_STATES.CANCELLED, 'Payment rejected by admin', ctx.user.id);
    await storage.saveTransaction(transaction);
    
    await ctx.reply(`❌ پرداخت معامله #${transaction.shortId} رد شد.`);
    
    // Notify seller
    await notifySellerPaymentRejected(ctx, transaction);
  } catch (error) {
    console.error('Reject payment error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Handle payment receipt upload
const handlePaymentReceiptUpload = async (ctx) => {
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
    
    // Get file info
    let fileId = null;
    let fileType = null;
    
    if (ctx.message.photo) {
      fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      fileType = 'photo';
    } else if (ctx.message.document) {
      fileId = ctx.message.document.file_id;
      fileType = 'document';
    }
    
    if (!fileId) {
      await ctx.reply('لطفاً تصویر یا فایل معتبری ارسال کنید.');
      return;
    }
    
    // Add file to transaction
    transaction.addFile({
      type: 'payment_receipt',
      fileId: fileId,
      fileType: fileType,
      uploadedBy: ctx.user.id
    });
    
    await storage.saveTransaction(transaction);
    
    await ctx.reply('✅ رسید پرداخت دریافت شد و برای بررسی ارسال شد.', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.mainMenu, callback_data: 'main_menu' }
          ]
        ]
      }
    });
    
    // Reset session state
    await ctx.updateSession({
      state: 'idle',
      data: { ...ctx.session.data }
    });
    
    // Notify admins
    await notifyAdminsPaymentReceiptUploaded(ctx, transaction);
  } catch (error) {
    console.error('Payment receipt upload error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Notify admins about payment request
const notifyAdminsPaymentRequest = async (ctx, transaction) => {
  try {
    const config = require('../config');
    
    if (config.admin.userIds.length === 0) {
      return;
    }
    
    const message = fa.admin.paymentRequest
      .replace('{id}', transaction.shortId)
      .replace('{amount}', transaction.amount.toLocaleString())
      .replace('{cardDetails}', transaction.data.payment.cardDetails);
    
    for (const adminId of config.admin.userIds) {
      try {
        await ctx.telegram.sendMessage(adminId, message, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: fa.admin.approvePayment, callback_data: `payment_approve_${transaction.id}` },
                { text: fa.admin.rejectPayment, callback_data: `payment_reject_${transaction.id}` }
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

// Notify seller about payment approval
const notifySellerPaymentApproved = async (ctx, transaction) => {
  try {
    await ctx.telegram.sendMessage(transaction.sellerId, fa.payment.approved, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👁️ مشاهده معامله', callback_data: `view_transaction_${transaction.id}` }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Seller notification error:', error);
  }
};

// Notify seller about payment rejection
const notifySellerPaymentRejected = async (ctx, transaction) => {
  try {
    await ctx.telegram.sendMessage(transaction.sellerId, fa.payment.rejected, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.mainMenu, callback_data: 'main_menu' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Seller notification error:', error);
  }
};

// Notify potential buyers about available transaction
const notifyBuyersTransactionAvailable = async (ctx, transaction) => {
  try {
    // This would typically involve a subscription system
    // For now, we'll just log that the transaction is available
    console.log(`Transaction ${transaction.shortId} is now available for purchase`);
  } catch (error) {
    console.error('Buyer notification error:', error);
  }
};

// Notify admins about payment receipt upload
const notifyAdminsPaymentReceiptUploaded = async (ctx, transaction) => {
  try {
    const config = require('../config');
    
    if (config.admin.userIds.length === 0) {
      return;
    }
    
    const message = `📄 رسید پرداخت آپلود شد\n\nمعامله: #${transaction.shortId}\nفروشنده: ${ctx.user.getDisplayName()}`;
    
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
  startPayment,
  handleCardDetailsInput,
  approvePayment,
  rejectPayment,
  handlePaymentReceiptUpload
};
