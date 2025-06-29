const { CONTENT_FILTERS } = require('../config/constants');

class TextFilter {
  constructor() {
    this.filters = CONTENT_FILTERS;
    this.suspiciousPatterns = [
      // Email patterns (only when followed by actual email)
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,

      // Password patterns (only when explicitly mentioned with credentials)
      /(?:رمز|پسورد|کلمه.*عبور|پس.*ورد)[\s:=]*[^\s]+/gi,
      /(?:password|pass|pwd)[\s:=]+[^\s]+/gi,

      // Account ID patterns (only when explicitly mentioned with IDs)
      /(?:آی.*دی|شناسه)[\s:=]*[a-zA-Z0-9._-]+/gi,
      /(?:account.*id|user.*id)[\s:=]+[a-zA-Z0-9._-]+/gi,

      // Card numbers (always filter these)
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,

      // Phone numbers (Iranian format)
      /(?:\+98|0098|09)\d{9}/g,

      // Gaming account patterns (only when combined with email)
      /(?:clash|coc|supercell|gmail)[\s._-]*[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+/gi
    ];
  }

  // Check if text contains sensitive information
  containsSensitiveInfo(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    // Check against all patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  // Get detected sensitive patterns
  getDetectedPatterns(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const detected = [];
    
    for (const pattern of this.suspiciousPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        detected.push({
          pattern: pattern.source,
          matches: matches
        });
      }
    }

    return detected;
  }

  // Clean text by removing sensitive information
  cleanText(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let cleanedText = text;

    // Replace emails
    cleanedText = cleanedText.replace(this.filters.EMAIL_PATTERN, '[ایمیل حذف شده]');
    
    // Replace passwords
    cleanedText = cleanedText.replace(this.filters.PASSWORD_PATTERN, '[رمز حذف شده]');
    
    // Replace account IDs
    cleanedText = cleanedText.replace(this.filters.ACCOUNT_ID_PATTERN, '[شناسه حذف شده]');
    
    // Replace phone numbers
    cleanedText = cleanedText.replace(this.filters.PHONE_PATTERN, '[شماره تلفن حذف شده]');
    
    // Replace card numbers
    cleanedText = cleanedText.replace(this.filters.CARD_NUMBER_PATTERN, '[شماره کارت حذف شده]');

    return cleanedText;
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // Validate phone number format (Iranian)
  isValidPhone(phone) {
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phone);
  }

  // Validate card number format
  isValidCardNumber(cardNumber) {
    const cardRegex = /^\d{16}$/;
    const cleanCard = cardNumber.replace(/[\s-]/g, '');
    return cardRegex.test(cleanCard);
  }

  // Check if text contains only allowed characters for names
  isValidName(name) {
    // Allow Persian, Arabic, English letters, numbers, spaces, and common punctuation
    const nameRegex = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s\-.'_]+$/;
    return nameRegex.test(name) && name.trim().length >= 2 && name.trim().length <= 50;
  }

  // Sanitize input text
  sanitizeInput(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, '');
    
    // Remove excessive whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Remove control characters except newlines and tabs
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return text;
  }

  // Check for spam patterns
  isSpam(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const spamPatterns = [
      // Repeated characters (excessive repetition)
      /(.)\1{15,}/g,

      // Excessive caps (very long all-caps text)
      /[A-Z]{50,}/g,

      // Excessive punctuation
      /[!?]{10,}/g,

      // Persian spam patterns (only obvious spam)
      /(?:رایگان.*رایگان|برنده.*برنده|پول.*پول|فوری.*فوری)/gi
    ];

    return spamPatterns.some(pattern => pattern.test(text));
  }

  // Get content safety score (0-100, higher is safer)
  getContentSafetyScore(text) {
    if (!text || typeof text !== 'string') {
      return 100;
    }

    let score = 100;

    // Deduct points for sensitive information
    if (this.containsSensitiveInfo(text)) {
      score -= 50;
    }

    // Deduct points for spam
    if (this.isSpam(text)) {
      score -= 30;
    }

    // Deduct points for excessive length
    if (text.length > 1000) {
      score -= 10;
    }

    // Deduct points for suspicious patterns
    const detectedPatterns = this.getDetectedPatterns(text);
    score -= detectedPatterns.length * 10;

    return Math.max(0, score);
  }

  // Generate warning message for filtered content
  getFilterWarning(text) {
    let warning = '🚫 متن شما حاوی اطلاعات حساس است:\n\n';
    let hasIssue = false;

    if (this.filters.EMAIL_PATTERN.test(text)) {
      warning += '• آدرس ایمیل شناسایی شد\n';
      hasIssue = true;
    }

    if (this.filters.PASSWORD_PATTERN.test(text)) {
      warning += '• رمز عبور شناسایی شد\n';
      hasIssue = true;
    }

    if (this.filters.CARD_NUMBER_PATTERN.test(text)) {
      warning += '• شماره کارت شناسایی شد\n';
      hasIssue = true;
    }

    if (this.filters.PHONE_PATTERN.test(text)) {
      warning += '• شماره تلفن شناسایی شد\n';
      hasIssue = true;
    }

    if (!hasIssue) {
      return null;
    }

    warning += '\n⚠️ لطفاً از ارسال اطلاعات شخصی در چت خودداری کنید. ربات این اطلاعات را به صورت امن مدیریت می‌کند.';

    return warning;
  }
}

module.exports = new TextFilter();
