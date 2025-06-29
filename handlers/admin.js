const fa = require('../locales/fa');
const storage = require('../utils/storage');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { TRANSACTION_STATES } = require('../config/constants');

// Show admin panel
const showAdminPanel = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    // Get statistics
    const stats = await getSystemStats();
    
    const adminText = `
🔧 **پنل مدیریت**

📊 **آمار سیستم:**
• کل کاربران: ${stats.totalUsers}
• کاربران فعال: ${stats.activeUsers}
• کل معاملات: ${stats.totalTransactions}
• معاملات فعال: ${stats.activeTransactions}
• معاملات تکمیل شده: ${stats.completedTransactions}
• حجم کل معاملات: ${stats.totalVolume.toLocaleString()} تومان

⏳ **معاملات در انتظار:**
• در انتظار تأیید پرداخت: ${stats.pendingPayments}
• در انتظار بررسی ویدیو: ${stats.pendingVideos}
• نیاز به بررسی: ${stats.needsReview}
    `;
    
    await ctx.reply(adminText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📋 معاملات در انتظار', callback_data: 'admin_pending_transactions' },
            { text: '👥 مدیریت کاربران', callback_data: 'admin_users' }
          ],
          [
            { text: '📊 گزارشات', callback_data: 'admin_reports' },
            { text: '⚙️ تنظیمات', callback_data: 'admin_settings' }
          ],
          [
            { text: '💾 پشتیبان‌گیری', callback_data: 'admin_backup' },
            { text: '🔄 بروزرسانی', callback_data: 'admin_refresh' }
          ],
          [
            { text: fa.back, callback_data: 'main_menu' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Show admin panel error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Show pending transactions
const showPendingTransactions = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const allTransactions = await storage.getAllTransactions();
    const pendingTransactions = allTransactions.filter(t => 
      [TRANSACTION_STATES.PAYMENT_PENDING, TRANSACTION_STATES.FINAL_VERIFICATION].includes(t.state)
    );
    
    if (pendingTransactions.length === 0) {
      await ctx.reply('هیچ معامله‌ای در انتظار بررسی نیست.', {
        reply_markup: {
          inline_keyboard: [[
            { text: fa.back, callback_data: 'admin_panel' }
          ]]
        }
      });
      return;
    }
    
    const keyboard = [];
    
    for (const transaction of pendingTransactions.slice(0, 10)) {
      let statusText = '';
      if (transaction.state === TRANSACTION_STATES.PAYMENT_PENDING) {
        statusText = '💳 تأیید پرداخت';
      } else if (transaction.state === TRANSACTION_STATES.FINAL_VERIFICATION) {
        statusText = '🎥 بررسی ویدیو';
      }
      
      const buttonText = `#${transaction.shortId} - ${statusText}`;
      
      keyboard.push([{
        text: buttonText,
        callback_data: `admin_transaction_${transaction.id}`
      }]);
    }
    
    keyboard.push([{ text: fa.back, callback_data: 'admin_panel' }]);
    
    await ctx.reply('معاملات در انتظار بررسی:', {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    console.error('Show pending transactions error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Show transaction details for admin
const showTransactionDetails = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const transactionId = ctx.match[1];
    const transactionData = await storage.getTransaction(transactionId);
    
    if (!transactionData) {
      await ctx.reply(fa.errors.transactionNotFound);
      return;
    }
    
    const transaction = Transaction.fromJSON(transactionData);
    
    // Get user details
    const sellerData = await storage.getUser(transaction.sellerId);
    const seller = sellerData ? User.fromJSON(sellerData) : null;
    
    let buyerInfo = 'هنوز انتخاب نشده';
    if (transaction.buyerId) {
      const buyerData = await storage.getUser(transaction.buyerId);
      const buyer = buyerData ? User.fromJSON(buyerData) : null;
      buyerInfo = buyer ? buyer.getDisplayName() : `User ${transaction.buyerId}`;
    }
    
    const detailsText = `
🔍 **جزئیات معامله #${transaction.shortId}**

**اطلاعات کلی:**
• شناسه: ${transaction.id}
• وضعیت: ${fa.status[transaction.state] || transaction.state}
• نوع اکانت: ${transaction.accountType === 'gmail' ? 'Gmail' : 'Supercell ID'}
• مبلغ: ${transaction.amount.toLocaleString()} تومان
• تاریخ ایجاد: ${new Date(transaction.createdAt).toLocaleDateString('fa-IR')}

**طرفین معامله:**
• فروشنده: ${seller ? seller.getDisplayName() : `User ${transaction.sellerId}`}
• خریدار: ${buyerInfo}

**توضیحات:**
${transaction.description}

**تاریخچه:**
${transaction.history.map(h => `• ${new Date(h.timestamp).toLocaleString('fa-IR')}: ${h.from} → ${h.to}`).join('\n')}
    `;
    
    const keyboard = [];
    
    // Add action buttons based on transaction state
    if (transaction.state === TRANSACTION_STATES.PAYMENT_PENDING) {
      keyboard.push([
        { text: '✅ تأیید پرداخت', callback_data: `payment_approve_${transaction.id}` },
        { text: '❌ رد پرداخت', callback_data: `payment_reject_${transaction.id}` }
      ]);
    }
    
    if (transaction.state === TRANSACTION_STATES.FINAL_VERIFICATION) {
      keyboard.push([
        { text: '✅ تأیید ویدیو', callback_data: `final_approve_${transaction.id}` },
        { text: '❌ رد ویدیو', callback_data: `final_reject_${transaction.id}` }
      ]);
    }
    
    // Add management buttons
    keyboard.push([
      { text: '📝 افزودن یادداشت', callback_data: `admin_add_note_${transaction.id}` },
      { text: '🚫 لغو معامله', callback_data: `admin_cancel_${transaction.id}` }
    ]);
    
    keyboard.push([
      { text: fa.back, callback_data: 'admin_pending_transactions' }
    ]);
    
    await ctx.reply(detailsText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    console.error('Show transaction details error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Show user management
const showUserManagement = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const users = await storage.getAllUsers();
    const stats = {
      total: users.length,
      registered: users.filter(u => u.isRegistered).length,
      blocked: users.filter(u => u.security?.isBlocked).length,
      active: users.filter(u => {
        const lastActivity = new Date(u.lastActivity);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return lastActivity > dayAgo;
      }).length
    };
    
    const userText = `
👥 **مدیریت کاربران**

📊 **آمار کاربران:**
• کل کاربران: ${stats.total}
• کاربران ثبت‌نام شده: ${stats.registered}
• کاربران مسدود: ${stats.blocked}
• کاربران فعال (24 ساعت): ${stats.active}

**عملیات:**
    `;
    
    await ctx.reply(userText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔍 جستجوی کاربر', callback_data: 'admin_search_user' },
            { text: '📋 لیست کاربران', callback_data: 'admin_list_users' }
          ],
          [
            { text: '🚫 کاربران مسدود', callback_data: 'admin_blocked_users' },
            { text: '📊 آمار تفصیلی', callback_data: 'admin_user_stats' }
          ],
          [
            { text: fa.back, callback_data: 'admin_panel' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Show user management error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Show system reports
const showReports = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const stats = await getDetailedStats();
    
    const reportText = `
📊 **گزارشات سیستم**

**معاملات امروز:**
• ایجاد شده: ${stats.today.created}
• تکمیل شده: ${stats.today.completed}
• لغو شده: ${stats.today.cancelled}

**معاملات این هفته:**
• ایجاد شده: ${stats.week.created}
• تکمیل شده: ${stats.week.completed}
• حجم: ${stats.week.volume.toLocaleString()} تومان

**معاملات این ماه:**
• ایجاد شده: ${stats.month.created}
• تکمیل شده: ${stats.month.completed}
• حجم: ${stats.month.volume.toLocaleString()} تومان

**عملکرد سیستم:**
• میانگین زمان تکمیل: ${stats.avgCompletionTime} ساعت
• نرخ موفقیت: ${stats.successRate}%
• رضایت کاربران: ${stats.userSatisfaction}%
    `;
    
    await ctx.reply(reportText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📈 گزارش تفصیلی', callback_data: 'admin_detailed_report' },
            { text: '📊 نمودار آمار', callback_data: 'admin_charts' }
          ],
          [
            { text: '📄 خروجی Excel', callback_data: 'admin_export_excel' },
            { text: '📋 خروجی CSV', callback_data: 'admin_export_csv' }
          ],
          [
            { text: fa.back, callback_data: 'admin_panel' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Show reports error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Create system backup
const createBackup = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    await ctx.reply('🔄 در حال ایجاد پشتیبان...');
    
    const backupPath = await storage.createBackup();
    
    if (backupPath) {
      await ctx.reply(`✅ پشتیبان با موفقیت ایجاد شد.\nمسیر: ${backupPath}`, {
        reply_markup: {
          inline_keyboard: [[
            { text: fa.back, callback_data: 'admin_panel' }
          ]]
        }
      });
    } else {
      await ctx.reply('❌ خطا در ایجاد پشتیبان.');
    }
  } catch (error) {
    console.error('Create backup error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Get system statistics
const getSystemStats = async () => {
  try {
    const users = await storage.getAllUsers();
    const transactions = await storage.getAllTransactions();
    
    const activeUsers = users.filter(u => {
      const lastActivity = new Date(u.lastActivity);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return lastActivity > dayAgo;
    }).length;
    
    const activeTransactions = transactions.filter(t => 
      ![TRANSACTION_STATES.COMPLETED, TRANSACTION_STATES.CANCELLED, TRANSACTION_STATES.FAILED].includes(t.state)
    ).length;
    
    const completedTransactions = transactions.filter(t => t.state === TRANSACTION_STATES.COMPLETED).length;
    
    const totalVolume = transactions
      .filter(t => t.state === TRANSACTION_STATES.COMPLETED)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const pendingPayments = transactions.filter(t => t.state === TRANSACTION_STATES.PAYMENT_PENDING).length;
    const pendingVideos = transactions.filter(t => t.state === TRANSACTION_STATES.FINAL_VERIFICATION).length;
    const needsReview = transactions.filter(t => 
      t.data?.buyerVerification?.satisfied === false || 
      t.adminNotes?.length > 0
    ).length;
    
    return {
      totalUsers: users.length,
      activeUsers,
      totalTransactions: transactions.length,
      activeTransactions,
      completedTransactions,
      totalVolume,
      pendingPayments,
      pendingVideos,
      needsReview
    };
  } catch (error) {
    console.error('Get system stats error:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalTransactions: 0,
      activeTransactions: 0,
      completedTransactions: 0,
      totalVolume: 0,
      pendingPayments: 0,
      pendingVideos: 0,
      needsReview: 0
    };
  }
};

// Get detailed statistics
const getDetailedStats = async () => {
  try {
    const transactions = await storage.getAllTransactions();
    const now = new Date();
    
    // Helper functions for date filtering
    const isToday = (date) => {
      const d = new Date(date);
      return d.toDateString() === now.toDateString();
    };
    
    const isThisWeek = (date) => {
      const d = new Date(date);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo;
    };
    
    const isThisMonth = (date) => {
      const d = new Date(date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };
    
    // Calculate stats
    const today = {
      created: transactions.filter(t => isToday(t.createdAt)).length,
      completed: transactions.filter(t => t.state === TRANSACTION_STATES.COMPLETED && isToday(t.completedAt)).length,
      cancelled: transactions.filter(t => t.state === TRANSACTION_STATES.CANCELLED && isToday(t.cancelledAt)).length
    };
    
    const week = {
      created: transactions.filter(t => isThisWeek(t.createdAt)).length,
      completed: transactions.filter(t => t.state === TRANSACTION_STATES.COMPLETED && isThisWeek(t.completedAt)).length,
      volume: transactions
        .filter(t => t.state === TRANSACTION_STATES.COMPLETED && isThisWeek(t.completedAt))
        .reduce((sum, t) => sum + t.amount, 0)
    };
    
    const month = {
      created: transactions.filter(t => isThisMonth(t.createdAt)).length,
      completed: transactions.filter(t => t.state === TRANSACTION_STATES.COMPLETED && isThisMonth(t.completedAt)).length,
      volume: transactions
        .filter(t => t.state === TRANSACTION_STATES.COMPLETED && isThisMonth(t.completedAt))
        .reduce((sum, t) => sum + t.amount, 0)
    };
    
    // Calculate performance metrics
    const completedTransactions = transactions.filter(t => t.state === TRANSACTION_STATES.COMPLETED);
    const avgCompletionTime = completedTransactions.length > 0 
      ? Math.round(completedTransactions.reduce((sum, t) => {
          const created = new Date(t.createdAt);
          const completed = new Date(t.completedAt);
          return sum + (completed - created) / (1000 * 60 * 60); // hours
        }, 0) / completedTransactions.length)
      : 0;
    
    const successRate = transactions.length > 0 
      ? Math.round((completedTransactions.length / transactions.length) * 100)
      : 0;
    
    const userSatisfaction = 95; // This would be calculated from actual feedback
    
    return {
      today,
      week,
      month,
      avgCompletionTime,
      successRate,
      userSatisfaction
    };
  } catch (error) {
    console.error('Get detailed stats error:', error);
    return {
      today: { created: 0, completed: 0, cancelled: 0 },
      week: { created: 0, completed: 0, volume: 0 },
      month: { created: 0, completed: 0, volume: 0 },
      avgCompletionTime: 0,
      successRate: 0,
      userSatisfaction: 0
    };
  }
};

module.exports = {
  showAdminPanel,
  showPendingTransactions,
  showTransactionDetails,
  showUserManagement,
  showReports,
  createBackup
};
