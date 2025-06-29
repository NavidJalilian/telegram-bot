const textFilter = require('../utils/textFilter');
const { ERROR_CODES } = require('../config/constants');
const fa = require('../locales/fa');

// Content filtering middleware
const contentFilter = () => {
  return async (ctx, next) => {
    try {
      // Skip filtering for certain message types
      if (ctx.message && (ctx.message.photo || ctx.message.video || ctx.message.document)) {
        return next();
      }

      // Get message text
      const text = ctx.message?.text || ctx.callbackQuery?.data || '';
      
      if (!text) {
        return next();
      }

      // Check for sensitive information
      if (textFilter.containsSensitiveInfo(text)) {
        const warning = textFilter.getFilterWarning(text);
        
        // Log the filtered content
        console.warn(`Content filtered for user ${ctx.from.id}:`, {
          userId: ctx.from.id,
          text: textFilter.cleanText(text),
          detectedPatterns: textFilter.getDetectedPatterns(text)
        });

        // Send warning to user
        await ctx.reply(warning, {
          reply_markup: {
            inline_keyboard: [[
              { text: fa.back, callback_data: 'back_to_menu' }
            ]]
          }
        });

        // Don't proceed with the message
        return;
      }

      // Check for spam
      if (textFilter.isSpam(text)) {
        await ctx.reply(fa.errors.rateLimitExceeded);
        return;
      }

      // Sanitize input
      if (ctx.message?.text) {
        ctx.message.text = textFilter.sanitizeInput(ctx.message.text);
      }

      return next();
    } catch (error) {
      console.error('Content filtering error:', error);
      return next();
    }
  };
};

// Rate limiting middleware
const rateLimit = () => {
  const userRequests = new Map();
  const WINDOW_SIZE = 60 * 1000; // 1 minute
  const MAX_REQUESTS = 10;

  return async (ctx, next) => {
    try {
      const userId = ctx.from.id;
      const now = Date.now();
      
      // Get user's request history
      if (!userRequests.has(userId)) {
        userRequests.set(userId, []);
      }
      
      const requests = userRequests.get(userId);
      
      // Remove old requests outside the window
      const validRequests = requests.filter(timestamp => now - timestamp < WINDOW_SIZE);
      
      // Check if user exceeded rate limit
      if (validRequests.length >= MAX_REQUESTS) {
        await ctx.reply(fa.errors.rateLimitExceeded);
        return;
      }
      
      // Add current request
      validRequests.push(now);
      userRequests.set(userId, validRequests);
      
      return next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      return next();
    }
  };
};

// Input validation middleware
const validateInput = (validationType) => {
  return async (ctx, next) => {
    try {
      const text = ctx.message?.text;
      
      if (!text) {
        await ctx.reply(fa.errors.invalidInput);
        return;
      }

      let isValid = false;
      let errorMessage = fa.errors.invalidInput;

      switch (validationType) {
        case 'email':
          isValid = textFilter.isValidEmail(text);
          errorMessage = 'آدرس ایمیل وارد شده معتبر نیست.';
          break;
          
        case 'phone':
          isValid = textFilter.isValidPhone(text);
          errorMessage = fa.registration.invalidPhone;
          break;
          
        case 'name':
          isValid = textFilter.isValidName(text);
          errorMessage = fa.registration.invalidName;
          break;
          
        case 'price':
          const price = parseInt(text.replace(/[,\s]/g, ''));
          isValid = !isNaN(price) && price > 0;
          errorMessage = fa.transaction.invalidPrice;
          break;
          
        case 'card':
          isValid = textFilter.isValidCardNumber(text.replace(/[\s-]/g, ''));
          errorMessage = fa.payment.invalidCardDetails;
          break;
          
        default:
          isValid = true;
      }

      if (!isValid) {
        await ctx.reply(errorMessage);
        return;
      }

      return next();
    } catch (error) {
      console.error('Input validation error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  };
};

// File validation middleware
const validateFile = (allowedTypes = [], maxSize = 50 * 1024 * 1024) => {
  return async (ctx, next) => {
    try {
      const message = ctx.message;
      let file = null;
      let fileType = null;

      // Determine file type and get file info
      if (message.photo) {
        file = message.photo[message.photo.length - 1]; // Get highest resolution
        fileType = 'photo';
      } else if (message.video) {
        file = message.video;
        fileType = 'video';
      } else if (message.document) {
        file = message.document;
        fileType = 'document';
      }

      if (!file) {
        await ctx.reply('لطفاً فایل معتبری ارسال کنید.');
        return;
      }

      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(fileType)) {
        await ctx.reply(fa.errors.invalidFileType);
        return;
      }

      // Check file size
      if (file.file_size && file.file_size > maxSize) {
        await ctx.reply(fa.errors.fileTooBig);
        return;
      }

      // Add file info to context
      ctx.fileInfo = {
        type: fileType,
        file: file,
        size: file.file_size || 0
      };

      return next();
    } catch (error) {
      console.error('File validation error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  };
};

// Security headers middleware
const securityHeaders = () => {
  return async (ctx, next) => {
    try {
      // Add security context
      ctx.security = {
        userId: ctx.from.id,
        timestamp: Date.now(),
        messageId: ctx.message?.message_id,
        chatId: ctx.chat?.id
      };

      return next();
    } catch (error) {
      console.error('Security headers error:', error);
      return next();
    }
  };
};

// Error handling middleware
const errorHandler = () => {
  return async (ctx, next) => {
    try {
      return await next();
    } catch (error) {
      console.error('Middleware error:', error);
      
      // Log error details
      const errorInfo = {
        userId: ctx.from?.id,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      
      console.error('Error details:', errorInfo);

      // Send user-friendly error message
      try {
        await ctx.reply(fa.errors.systemError);
      } catch (replyError) {
        console.error('Failed to send error message:', replyError);
      }
    }
  };
};

module.exports = {
  contentFilter,
  rateLimit,
  validateInput,
  validateFile,
  securityHeaders,
  errorHandler
};
