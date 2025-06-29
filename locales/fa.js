// Persian/Farsi language strings
const fa = {
  // Welcome and Main Menu
  welcome: '🎮 به ربات امن خرید و فروش اکانت‌های بازی خوش آمدید!\n\nاین ربات برای تضمین امنیت معاملات شما طراحی شده است.',
  mainMenu: 'منوی اصلی',
  
  // Menu Options
  startSale: '🛒 شروع فرآیند فروش',
  startPurchase: '💰 شروع فرآیند خرید',
  myTransactions: '📋 معاملات من',
  communication: '💬 ارتباط مستقیم',
  help: '❓ راهنما',
  support: '🆘 پشتیبانی',
  cancel: '❌ لغو',
  back: '🔙 بازگشت',
  confirm: '✅ تأیید',
  reject: '❌ رد',
  
  // Registration
  registration: {
    welcome: 'برای استفاده از ربات، لطفاً اطلاعات خود را وارد کنید:',
    enterName: 'نام و نام خانوادگی خود را وارد کنید:',
    enterPhone: 'شماره تلفن خود را وارد کنید:\n(مثال: 09123456789)',
    success: '✅ ثبت‌نام با موفقیت انجام شد!',
    invalidPhone: '❌ شماره تلفن وارد شده معتبر نیست.',
    invalidName: '❌ نام وارد شده معتبر نیست.'
  },
  
  // Transaction Initiation
  transaction: {
    selectAccountType: 'نوع اکانت مورد نظر را انتخاب کنید:',
    gmail: '📧 Gmail',
    supercellId: '🎮 Supercell ID',
    enterPrice: 'قیمت مورد نظر را به تومان وارد کنید:',
    enterDescription: 'توضیحات اکانت را وارد کنید:\n(مثال: سطح، آیتم‌ها، و...)',
    created: '✅ معامله با شناسه #{id} ایجاد شد.',
    invalidPrice: '❌ قیمت وارد شده معتبر نیست.',
    priceRange: 'قیمت باید بین {min} تا {max} تومان باشد.'
  },
  
  // Eligibility Check
  eligibility: {
    checkTitle: '🔍 بررسی قابلیت تغییر اکانت',
    instruction: 'آیا اکانت شما قابلیت تغییر دارد؟\n(آخرین بار که وارد اکانت شده‌اید بیش از 2 هفته پیش بوده باشد)',
    hasCapability: '✅ بله، قابلیت تغییر دارد',
    noCapability: '❌ خیر، قابلیت تغییر ندارد',
    rejected: '❌ متأسفانه اکانت شما قابلیت تغییر ندارد.\nلطفاً 2 هفته پس از آخرین ورود مجدداً تلاش کنید.',
    approved: '✅ اکانت شما قابلیت تغییر دارد. ادامه می‌دهیم...'
  },
  
  // Payment
  payment: {
    title: '💳 مرحله پرداخت',
    enterCardDetails: 'اطلاعات کارت بانکی خود را برای دریافت وجه وارد کنید:\n\nشماره کارت:\nنام صاحب کارت:\nشماره شبا (اختیاری):',
    waitingAdmin: '⏳ در انتظار تأیید ادمین برای پرداخت...',
    adminNotified: '📢 ادمین از درخواست پرداخت مطلع شد.',
    approved: '✅ پرداخت تأیید شد. ادامه می‌دهیم...',
    rejected: '❌ پرداخت رد شد. لطفاً با پشتیبانی تماس بگیرید.',
    invalidCardDetails: '❌ اطلاعات کارت وارد شده معتبر نیست.'
  },
  
  // Account Transfer
  transfer: {
    title: '🔄 انتقال اکانت',
    enterNewEmail: 'ایمیل جدید خریدار را وارد کنید:',
    requestCode: 'کد تأیید ارسال شده به ایمیل قدیمی را وارد کنید:',
    codeInstructions: 'برای دریافت کد تأیید:\n1. به ایمیل قدیمی خود بروید\n2. کد ارسال شده را کپی کنید\n3. در اینجا وارد کنید',
    invalidEmail: '❌ ایمیل وارد شده معتبر نیست.',
    invalidCode: '❌ کد وارد شده معتبر نیست.',
    codeExpired: '❌ کد منقضی شده است. مجدداً تلاش کنید.',
    success: '✅ انتقال اکانت با موفقیت انجام شد.',
    multiDeviceOption: 'اگر چندین دستگاه دارید، گزینه "این دستگاه را به خاطر بسپار" را غیرفعال کنید.'
  },
  
  // Buyer Verification
  buyerVerification: {
    title: '✅ تأیید خریدار',
    instruction: 'خریدار عزیز، لطفاً وضعیت اکانت را بررسی کنید:',
    satisfied: '✅ راضی هستم، اکانت صحیح است',
    notSatisfied: '❌ مشکلی وجود دارد',
    enterIssue: 'لطفاً مشکل موجود را شرح دهید:',
    approved: '✅ خریدار از اکانت راضی است.',
    rejected: '❌ خریدار از اکانت راضی نیست.'
  },
  
  // Final Verification
  finalVerification: {
    title: '🎥 تأیید نهایی',
    instruction: 'فروشنده عزیز، لطفاً ویدیویی از خروج از اکانت ارسال کنید:\n\n⚠️ مهم: در ویدیو مطمئن شوید که گزینه "این اکانت را به خاطر بسپار" غیرفعال باشد.',
    uploadVideo: '📹 ویدیو را آپلود کنید',
    videoReceived: '✅ ویدیو دریافت شد. در حال بررسی...',
    approved: '✅ ویدیو تأیید شد. معامله کامل شد!',
    rejected: '❌ ویدیو مناسب نیست. لطفاً مجدداً ارسال کنید.',
    invalidVideo: '❌ فایل ارسالی معتبر نیست. لطفاً ویدیو ارسال کنید.'
  },
  
  // Transaction Status
  status: {
    initiated: '🆕 ایجاد شده',
    eligibilityCheck: '🔍 بررسی قابلیت',
    paymentPending: '⏳ در انتظار پرداخت',
    paymentVerified: '✅ پرداخت تأیید شده',
    accountTransfer: '🔄 انتقال اکانت',
    buyerVerification: '👤 تأیید خریدار',
    finalVerification: '🎥 تأیید نهایی',
    completed: '✅ تکمیل شده',
    cancelled: '❌ لغو شده',
    failed: '❌ ناموفق'
  },
  
  // Errors
  errors: {
    invalidInput: '❌ ورودی نامعتبر است.',
    timeout: '⏰ زمان انتظار تمام شد.',
    unauthorized: '🚫 شما مجاز به انجام این عمل نیستید.',
    transactionNotFound: '❌ معامله یافت نشد.',
    invalidState: '❌ وضعیت معامله نامعتبر است.',
    rateLimitExceeded: '⚠️ تعداد درخواست‌های شما زیاد است. لطفاً کمی صبر کنید.',
    contentFiltered: '🚫 متن شما حاوی اطلاعات حساس است. لطفاً از ارسال اطلاعات شخصی خودداری کنید.',
    systemError: '❌ خطای سیستم. لطفاً با پشتیبانی تماس بگیرید.',
    maxTransactions: '⚠️ حداکثر تعداد معاملات همزمان شما تکمیل است.',
    fileTooBig: '❌ حجم فایل بیش از حد مجاز است.',
    invalidFileType: '❌ نوع فایل مجاز نیست.'
  },
  
  // Admin Messages
  admin: {
    newTransaction: '🆕 معامله جدید ایجاد شد:\nشناسه: #{id}\nفروشنده: {seller}\nخریدار: {buyer}\nقیمت: {price} تومان',
    paymentRequest: '💳 درخواست تأیید پرداخت:\nمعامله: #{id}\nمبلغ: {amount} تومان\nاطلاعات کارت: {cardDetails}',
    transactionCompleted: '✅ معامله #{id} با موفقیت تکمیل شد.',
    transactionCancelled: '❌ معامله #{id} لغو شد.',
    menu: 'پنل مدیریت',
    pendingTransactions: '📋 معاملات در انتظار',
    approvePayment: '✅ تأیید پرداخت',
    rejectPayment: '❌ رد پرداخت'
  },
  
  // Help and Support
  help: {
    title: '❓ راهنمای استفاده',
    content: 'این ربات برای خرید و فروش امن اکانت‌های بازی طراحی شده است.\n\nمراحل فروش:\n1. شروع فرآیند فروش\n2. بررسی قابلیت تغییر اکانت\n3. تأیید پرداخت توسط ادمین\n4. انتقال اکانت\n5. تأیید خریدار\n6. ارسال ویدیو خروج از اکانت\n\nبرای پشتیبانی با @support تماس بگیرید.'
  },
  
  // Communication
  communication: {
    menu: '💬 ارتباط مستقیم',
    joinChat: '🔗 ورود به گفتگو',
    createChat: '➕ ایجاد گفتگو جدید',
    myChats: '📋 گفتگوهای من',
    enterPostId: 'شناسه پست مشترک را وارد کنید:',
    chatCreated: 'گفتگو جدید ایجاد شد!',
    postIdLabel: 'شناسه پست:',
    sharePostId: 'این شناسه را با کاربر مورد نظر به اشتراک بگذارید',
    chatNotFound: 'گفتگویی با این شناسه یافت نشد',
    joinedChat: 'به گفتگو پیوستید',
    leftChat: 'از گفتگو خارج شدید',
    sendMessage: '💬 ارسال پیام',
    messageReceived: 'پیام دریافت شد',
    messageSent: 'پیام ارسال شد',
    noChats: 'شما در هیچ گفتگویی شرکت ندارید',
    chatFull: 'این گفتگو پر است',
    chatClosed: 'این گفتگو بسته شده است',
    invalidPostId: 'شناسه پست نامعتبر است',
    waitingForOthers: 'در انتظار پیوستن کاربران دیگر...'
  },

  // Common
  yes: 'بله',
  no: 'خیر',
  next: 'بعدی',
  previous: 'قبلی',
  loading: '⏳ در حال پردازش...',
  success: '✅ موفق',
  failed: '❌ ناموفق',
  warning: '⚠️ هشدار',
  info: 'ℹ️ اطلاعات'
};

module.exports = fa;
