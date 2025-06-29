const fa = require('../locales/fa');
const storage = require('../utils/storage');
const Transaction = require('../models/Transaction');
const { TRANSACTION_STATES, ACCOUNT_TYPES, LIMITS } = require('../config/constants');

// Start sale process
const startSale = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    // Check if user has too many active transactions
    const userTransactions = await storage.getUserTransactions(ctx.user.id);
    const activeTransactions = userTransactions.filter(t => 
      [TRANSACTION_STATES.INITIATED, TRANSACTION_STATES.ELIGIBILITY_CHECK, 
       TRANSACTION_STATES.PAYMENT_PENDING, TRANSACTION_STATES.PAYMENT_VERIFIED,
       TRANSACTION_STATES.ACCOUNT_TRANSFER, TRANSACTION_STATES.BUYER_VERIFICATION,
       TRANSACTION_STATES.FINAL_VERIFICATION].includes(t.state)
    );
    
    if (activeTransactions.length >= LIMITS.MAX_CONCURRENT_TRANSACTIONS_PER_USER) {
      await ctx.reply(fa.errors.maxTransactions);
      return;
    }
    
    await ctx.reply(fa.transaction.selectAccountType, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: fa.transaction.gmail, callback_data: 'account_type_gmail' },
            { text: fa.transaction.supercellId, callback_data: 'account_type_supercell_id' }
          ],
          [
            { text: fa.cancel, callback_data: 'main_menu' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Start sale error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Start purchase process
const startPurchase = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    // Get available transactions for purchase
    const allTransactions = await storage.getAllTransactions();
    const availableTransactions = allTransactions.filter(t => 
      t.state === TRANSACTION_STATES.PAYMENT_VERIFIED && 
      !t.buyerId &&
      t.sellerId !== ctx.user.id
    );
    
    if (availableTransactions.length === 0) {
      await ctx.reply('در حال حاضر اکانتی برای خرید موجود نیست.', {
        reply_markup: {
          inline_keyboard: [[
            { text: fa.back, callback_data: 'main_menu' }
          ]]
        }
      });
      return;
    }
    
    // Show available transactions
    const keyboard = [];
    
    for (const transaction of availableTransactions.slice(0, 10)) { // Show max 10
      const accountTypeText = transaction.accountType === ACCOUNT_TYPES.GMAIL ? 'Gmail' : 'Supercell ID';
      const buttonText = `${accountTypeText} - ${transaction.amount.toLocaleString()} تومان`;
      
      keyboard.push([{
        text: buttonText,
        callback_data: `purchase_${transaction.id}`
      }]);
    }
    
    keyboard.push([{ text: fa.back, callback_data: 'main_menu' }]);
    
    await ctx.reply('اکانت مورد نظر خود را انتخاب کنید:', {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    console.error('Start purchase error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Select account type for sale
const selectAccountType = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const accountType = ctx.match[1];
    
    // Validate account type
    if (!Object.values(ACCOUNT_TYPES).includes(accountType)) {
      await ctx.reply(fa.errors.invalidInput);
      return;
    }
    
    // Update session with account type
    await ctx.updateSession({
      state: 'entering_price',
      data: { accountType }
    });
    
    await ctx.reply(fa.transaction.enterPrice, {
      reply_markup: {
        inline_keyboard: [[
          { text: fa.cancel, callback_data: 'main_menu' }
        ]]
      }
    });
  } catch (error) {
    console.error('Select account type error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Handle price input
const handlePriceInput = async (ctx) => {
  try {
    const priceText = ctx.message.text.trim().replace(/[,\s]/g, '');
    const price = parseInt(priceText);
    
    // Validate price
    if (isNaN(price) || price <= 0) {
      await ctx.reply(fa.transaction.invalidPrice);
      return;
    }
    
    if (price < LIMITS.MIN_TRANSACTION_AMOUNT || price > LIMITS.MAX_TRANSACTION_AMOUNT) {
      await ctx.reply(fa.transaction.priceRange
        .replace('{min}', LIMITS.MIN_TRANSACTION_AMOUNT.toLocaleString())
        .replace('{max}', LIMITS.MAX_TRANSACTION_AMOUNT.toLocaleString())
      );
      return;
    }
    
    // Update session with price
    await ctx.updateSession({
      state: 'entering_description',
      data: { 
        ...ctx.session.data,
        price 
      }
    });
    
    await ctx.reply(fa.transaction.enterDescription, {
      reply_markup: {
        inline_keyboard: [[
          { text: fa.cancel, callback_data: 'main_menu' }
        ]]
      }
    });
  } catch (error) {
    console.error('Price input error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Handle description input
const handleDescriptionInput = async (ctx) => {
  try {
    const description = ctx.message.text.trim();
    
    // Validate description
    if (description.length < 10) {
      await ctx.reply('توضیحات باید حداقل 10 کاراکتر باشد.');
      return;
    }
    
    if (description.length > 500) {
      await ctx.reply('توضیحات نباید بیش از 500 کاراکتر باشد.');
      return;
    }
    
    const sessionData = ctx.session.data;
    
    // Create new transaction
    const transaction = new Transaction({
      sellerId: ctx.user.id,
      accountType: sessionData.accountType,
      amount: sessionData.price,
      description: description,
      state: TRANSACTION_STATES.INITIATED
    });
    
    // Validate transaction
    const validation = transaction.validate();
    if (!validation.isValid) {
      await ctx.reply(`خطا در ایجاد معامله: ${validation.errors.join(', ')}`);
      return;
    }
    
    // Save transaction
    await storage.saveTransaction(transaction);
    
    // Update user stats
    ctx.user.updateStats({ status: 'initiated' });
    await storage.saveUser(ctx.user);
    
    // Reset session
    await ctx.updateSession({
      state: 'idle',
      data: { currentTransactionId: transaction.id }
    });
    
    // Show transaction created message
    await ctx.reply(fa.transaction.created.replace('{id}', transaction.shortId), {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ ادامه فرآیند', callback_data: 'continue_eligibility_check' }
          ],
          [
            { text: fa.mainMenu, callback_data: 'main_menu' }
          ]
        ]
      }
    });
    
    // Notify admins about new transaction
    await notifyAdminsNewTransaction(ctx, transaction);
  } catch (error) {
    console.error('Description input error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Show user's transactions
const showMyTransactions = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const userTransactions = await storage.getUserTransactions(ctx.user.id);
    
    if (userTransactions.length === 0) {
      await ctx.reply('شما هیچ معامله‌ای ندارید.', {
        reply_markup: {
          inline_keyboard: [[
            { text: fa.back, callback_data: 'main_menu' }
          ]]
        }
      });
      return;
    }
    
    // Sort by creation date (newest first)
    userTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const keyboard = [];
    
    for (const transaction of userTransactions.slice(0, 10)) { // Show max 10
      const role = transaction.sellerId === ctx.user.id ? 'فروشنده' : 'خریدار';
      const statusText = fa.status[transaction.state] || transaction.state;
      const accountTypeText = transaction.accountType === ACCOUNT_TYPES.GMAIL ? 'Gmail' : 'Supercell ID';
      
      const buttonText = `${transaction.shortId} - ${role} - ${accountTypeText} - ${statusText}`;
      
      keyboard.push([{
        text: buttonText,
        callback_data: `view_transaction_${transaction.id}`
      }]);
    }
    
    keyboard.push([{ text: fa.back, callback_data: 'main_menu' }]);
    
    await ctx.reply('معاملات شما:', {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    console.error('Show transactions error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Notify admins about new transaction
const notifyAdminsNewTransaction = async (ctx, transaction) => {
  try {
    const config = require('../config');
    
    if (config.admin.userIds.length === 0) {
      return;
    }
    
    const seller = ctx.user;
    const accountTypeText = transaction.accountType === ACCOUNT_TYPES.GMAIL ? 'Gmail' : 'Supercell ID';
    
    const message = fa.admin.newTransaction
      .replace('{id}', transaction.shortId)
      .replace('{seller}', seller.getDisplayName())
      .replace('{buyer}', 'در انتظار')
      .replace('{price}', transaction.amount.toLocaleString());
    
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
  startSale,
  startPurchase,
  selectAccountType,
  handlePriceInput,
  handleDescriptionInput,
  showMyTransactions
};
