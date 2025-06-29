const fa = require('../locales/fa');
const storage = require('../utils/storage');
const textFilter = require('../utils/textFilter');
const { SESSION_STATES } = require('../config/constants');

// Start command handler
const start = async (ctx) => {
  try {
    await ctx.reply(fa.welcome);
    
    if (!ctx.user.isRegistered) {
      await showRegistrationPrompt(ctx);
    } else {
      await showMainMenu(ctx);
    }
  } catch (error) {
    console.error('Start handler error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Show registration prompt
const showRegistrationPrompt = async (ctx) => {
  try {
    await ctx.reply(fa.registration.welcome, {
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ شروع ثبت‌نام', callback_data: 'start_registration' }
        ]]
      }
    });
  } catch (error) {
    console.error('Registration prompt error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Show main menu
const showMainMenu = async (ctx) => {
  try {
    await ctx.answerCbQuery?.();
    
    const keyboard = [];
    
    if (ctx.user.isRegistered) {
      keyboard.push([
        { text: fa.startSale, callback_data: 'start_sale' },
        { text: fa.startPurchase, callback_data: 'start_purchase' }
      ]);
      
      keyboard.push([
        { text: fa.myTransactions, callback_data: 'my_transactions' }
      ]);
    }
    
    keyboard.push([
      { text: fa.help, callback_data: 'help' },
      { text: fa.support, url: 'https://t.me/support' }
    ]);
    
    // Add admin panel for admins
    if (ctx.user.isAdmin()) {
      keyboard.push([
        { text: '🔧 پنل مدیریت', callback_data: 'admin_panel' }
      ]);
    }

    const message = ctx.user.isRegistered 
      ? `سلام ${ctx.user.getDisplayName()}! 👋\n\n${fa.mainMenu}:`
      : fa.welcome;

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
    
    // Reset session to idle
    await ctx.updateSession({
      state: SESSION_STATES.IDLE,
      data: {}
    });
  } catch (error) {
    console.error('Main menu error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Start registration process
const startRegistration = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    await ctx.reply(fa.registration.enterName, {
      reply_markup: {
        inline_keyboard: [[
          { text: fa.cancel, callback_data: 'main_menu' }
        ]]
      }
    });
    
    // Update session state
    await ctx.updateSession({
      state: 'registering_name',
      data: {}
    });
  } catch (error) {
    console.error('Start registration error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Handle name input during registration
const handleNameInput = async (ctx) => {
  try {
    const name = ctx.message.text.trim();
    
    // Validate name
    if (!textFilter.isValidName(name)) {
      await ctx.reply(fa.registration.invalidName);
      return;
    }
    
    // Store name in session
    await ctx.updateSession({
      state: 'registering_phone',
      data: { name }
    });
    
    await ctx.reply(fa.registration.enterPhone, {
      reply_markup: {
        inline_keyboard: [[
          { text: fa.cancel, callback_data: 'main_menu' }
        ]]
      }
    });
  } catch (error) {
    console.error('Name input error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Handle phone input during registration
const handlePhoneInput = async (ctx) => {
  try {
    const phone = ctx.message.text.trim();
    
    // Validate phone
    if (!textFilter.isValidPhone(phone)) {
      await ctx.reply(fa.registration.invalidPhone);
      return;
    }
    
    const name = ctx.session.data.name;
    
    // Complete registration
    ctx.user.completeRegistration(name, phone);
    await storage.saveUser(ctx.user);
    
    await ctx.reply(fa.registration.success);
    
    // Show main menu
    await showMainMenu(ctx);
  } catch (error) {
    console.error('Phone input error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Show user profile
const showProfile = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const user = ctx.user;
    const stats = user.stats;
    
    const profileText = `
👤 **پروفایل شما**

📝 نام: ${user.name}
📱 شماره: ${user.phone}
🆔 شناسه: ${user.id}

📊 **آمار معاملات:**
• کل معاملات: ${stats.totalTransactions}
• معاملات موفق: ${stats.completedTransactions}
• معاملات لغو شده: ${stats.cancelledTransactions}
• حجم کل: ${stats.totalVolume.toLocaleString()} تومان
• امتیاز: ${stats.rating.toFixed(1)} (${stats.ratingCount} نظر)

📅 عضویت از: ${new Date(user.createdAt).toLocaleDateString('fa-IR')}
🕐 آخرین فعالیت: ${new Date(user.lastActivity).toLocaleDateString('fa-IR')}
    `;
    
    await ctx.reply(profileText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: fa.back, callback_data: 'main_menu' }]
        ]
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

// Show help information
const showHelp = async (ctx) => {
  try {
    await ctx.answerCbQuery();
    
    const helpText = `
❓ **راهنمای استفاده از ربات**

🎮 این ربات برای خرید و فروش امن اکانت‌های بازی طراحی شده است.

**مراحل فروش:**
1️⃣ شروع فرآیند فروش
2️⃣ بررسی قابلیت تغییر اکانت
3️⃣ تأیید پرداخت توسط ادمین
4️⃣ انتقال اکانت به خریدار
5️⃣ تأیید خریدار
6️⃣ ارسال ویدیو خروج از اکانت

**مراحل خرید:**
1️⃣ جستجو و انتخاب اکانت
2️⃣ پرداخت وجه
3️⃣ دریافت اکانت
4️⃣ تأیید صحت اکانت

**نکات مهم:**
⚠️ هرگز اطلاعات حساس خود را در چت عمومی ارسال نکنید
🔒 تمام اطلاعات از طریق ربات به صورت امن مدیریت می‌شود
📞 برای پشتیبانی با @support تماس بگیرید

**امنیت:**
✅ تمام معاملات توسط ادمین نظارت می‌شود
✅ سیستم escrow برای حفاظت از هر دو طرف
✅ فیلتر خودکار اطلاعات حساس
    `;
    
    await ctx.reply(helpText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: fa.back, callback_data: 'main_menu' }]
        ]
      }
    });
  } catch (error) {
    console.error('Help error:', error);
    await ctx.reply(fa.errors.systemError);
  }
};

module.exports = {
  start,
  showMainMenu,
  showRegistrationPrompt,
  startRegistration,
  handleNameInput,
  handlePhoneInput,
  showProfile,
  showHelp
};
