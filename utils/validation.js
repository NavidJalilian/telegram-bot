const textFilter = require('./textFilter');
const { LIMITS } = require('../config/constants');

class Validator {
  // Validate user registration data
  static validateRegistration(data) {
    const errors = [];
    
    if (!data.name || !textFilter.isValidName(data.name)) {
      errors.push('نام وارد شده معتبر نیست');
    }
    
    if (!data.phone || !textFilter.isValidPhone(data.phone)) {
      errors.push('شماره تلفن وارد شده معتبر نیست');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate transaction data
  static validateTransaction(data) {
    const errors = [];
    
    if (!data.accountType || !['gmail', 'supercell_id'].includes(data.accountType)) {
      errors.push('نوع اکانت معتبر نیست');
    }
    
    if (!data.amount || data.amount < LIMITS.MIN_TRANSACTION_AMOUNT || data.amount > LIMITS.MAX_TRANSACTION_AMOUNT) {
      errors.push(`مبلغ باید بین ${LIMITS.MIN_TRANSACTION_AMOUNT.toLocaleString()} تا ${LIMITS.MAX_TRANSACTION_AMOUNT.toLocaleString()} تومان باشد`);
    }
    
    if (!data.description || data.description.length < 10 || data.description.length > 500) {
      errors.push('توضیحات باید بین 10 تا 500 کاراکتر باشد');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate email address
  static validateEmail(email) {
    return textFilter.isValidEmail(email);
  }

  // Validate phone number
  static validatePhone(phone) {
    return textFilter.isValidPhone(phone);
  }

  // Validate price input
  static validatePrice(priceText) {
    const price = parseInt(priceText.replace(/[,\s]/g, ''));
    
    if (isNaN(price) || price <= 0) {
      return { isValid: false, error: 'قیمت وارد شده معتبر نیست' };
    }
    
    if (price < LIMITS.MIN_TRANSACTION_AMOUNT) {
      return { 
        isValid: false, 
        error: `قیمت نباید کمتر از ${LIMITS.MIN_TRANSACTION_AMOUNT.toLocaleString()} تومان باشد` 
      };
    }
    
    if (price > LIMITS.MAX_TRANSACTION_AMOUNT) {
      return { 
        isValid: false, 
        error: `قیمت نباید بیشتر از ${LIMITS.MAX_TRANSACTION_AMOUNT.toLocaleString()} تومان باشد` 
      };
    }
    
    return { isValid: true, value: price };
  }

  // Validate verification code
  static validateVerificationCode(code) {
    if (!code || typeof code !== 'string') {
      return { isValid: false, error: 'کد تأیید معتبر نیست' };
    }
    
    const cleanCode = code.trim();
    
    if (cleanCode.length < 4 || cleanCode.length > 10) {
      return { isValid: false, error: 'کد تأیید باید بین 4 تا 10 کاراکتر باشد' };
    }
    
    // Check if code contains only alphanumeric characters
    if (!/^[a-zA-Z0-9]+$/.test(cleanCode)) {
      return { isValid: false, error: 'کد تأیید فقط باید شامل حروف و اعداد انگلیسی باشد' };
    }
    
    return { isValid: true, value: cleanCode };
  }

  // Validate card details
  static validateCardDetails(cardDetails) {
    if (!cardDetails || cardDetails.length < 20) {
      return { isValid: false, error: 'اطلاعات کارت کامل نیست' };
    }
    
    // Check for required fields (basic validation)
    const hasCardNumber = /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/.test(cardDetails);
    const hasName = /[آ-ی\u200c\u200d\s]{2,}/.test(cardDetails) || /[a-zA-Z\s]{2,}/.test(cardDetails);
    
    if (!hasCardNumber) {
      return { isValid: false, error: 'شماره کارت یافت نشد' };
    }
    
    if (!hasName) {
      return { isValid: false, error: 'نام صاحب کارت یافت نشد' };
    }
    
    return { isValid: true };
  }

  // Validate file upload
  static validateFile(file, allowedTypes = [], maxSize = 50 * 1024 * 1024) {
    if (!file) {
      return { isValid: false, error: 'فایل انتخاب نشده است' };
    }
    
    // Check file size
    if (file.file_size && file.file_size > maxSize) {
      return { 
        isValid: false, 
        error: `حجم فایل نباید بیشتر از ${Math.round(maxSize / (1024 * 1024))} مگابایت باشد` 
      };
    }
    
    return { isValid: true };
  }

  // Validate video file
  static validateVideo(video) {
    if (!video) {
      return { isValid: false, error: 'ویدیو انتخاب نشده است' };
    }
    
    // Check duration
    if (video.duration > 300) { // 5 minutes
      return { isValid: false, error: 'مدت ویدیو نباید بیشتر از 5 دقیقه باشد' };
    }
    
    if (video.duration < 10) { // 10 seconds
      return { isValid: false, error: 'مدت ویدیو باید حداقل 10 ثانیه باشد' };
    }
    
    // Check file size (50MB max)
    if (video.file_size && video.file_size > 50 * 1024 * 1024) {
      return { isValid: false, error: 'حجم ویدیو نباید بیشتر از 50 مگابایت باشد' };
    }
    
    return { isValid: true };
  }

  // Validate text length
  static validateTextLength(text, minLength = 1, maxLength = 4096) {
    if (!text || typeof text !== 'string') {
      return { isValid: false, error: 'متن معتبر نیست' };
    }
    
    const trimmedText = text.trim();
    
    if (trimmedText.length < minLength) {
      return { 
        isValid: false, 
        error: `متن باید حداقل ${minLength} کاراکتر باشد` 
      };
    }
    
    if (trimmedText.length > maxLength) {
      return { 
        isValid: false, 
        error: `متن نباید بیشتر از ${maxLength} کاراکتر باشد` 
      };
    }
    
    return { isValid: true, value: trimmedText };
  }

  // Validate user ID
  static validateUserId(userId) {
    if (!userId || typeof userId !== 'number') {
      return { isValid: false, error: 'شناسه کاربر معتبر نیست' };
    }
    
    if (userId <= 0) {
      return { isValid: false, error: 'شناسه کاربر معتبر نیست' };
    }
    
    return { isValid: true };
  }

  // Validate transaction ID
  static validateTransactionId(transactionId) {
    if (!transactionId || typeof transactionId !== 'string') {
      return { isValid: false, error: 'شناسه معامله معتبر نیست' };
    }
    
    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(transactionId)) {
      return { isValid: false, error: 'فرمت شناسه معامله معتبر نیست' };
    }
    
    return { isValid: true };
  }

  // Sanitize input
  static sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    return textFilter.sanitizeInput(input);
  }

  // Check content safety (more permissive)
  static checkContentSafety(text) {
    const safetyScore = textFilter.getContentSafetyScore(text);

    // Only check for actual sensitive data (emails, cards, passwords)
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
    const hasCardNumber = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(text);
    const hasPassword = /(?:رمز|پسورد|password|pass)[\s:=]+[^\s]+/gi.test(text);

    const containsSensitive = hasEmail || hasCardNumber || hasPassword;

    return {
      isSafe: safetyScore >= 50 && !containsSensitive,
      score: safetyScore,
      containsSensitive,
      warning: containsSensitive ? textFilter.getFilterWarning(text) : null
    };
  }
}

module.exports = Validator;
