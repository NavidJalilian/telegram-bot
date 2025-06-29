const config = require('../config');
const storage = require('../utils/storage');
const User = require('../models/User');
const fa = require('../locales/fa');
const { SESSION_STATES } = require('../config/constants');

// Authentication middleware
const authenticate = () => {
  return async (ctx, next) => {
    try {
      const userId = ctx.from.id;
      
      // Get user from storage
      let userData = await storage.getUser(userId);
      
      // Create new user if doesn't exist
      if (!userData) {
        const newUser = new User({
          id: userId,
          username: ctx.from.username,
          name: ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : '')
        });
        
        await storage.saveUser(newUser);
        userData = newUser.toJSON();
      }
      
      // Create user instance
      ctx.user = User.fromJSON(userData);
      
      // Update last activity
      ctx.user.updateActivity();
      await storage.saveUser(ctx.user);
      
      return next();
    } catch (error) {
      console.error('Authentication error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  };
};

// Registration check middleware
const requireRegistration = () => {
  return async (ctx, next) => {
    try {
      if (!ctx.user.isRegistered) {
        // Start registration process
        await ctx.reply(fa.registration.welcome, {
          reply_markup: {
            inline_keyboard: [[
              { text: 'شروع ثبت‌نام', callback_data: 'start_registration' }
            ]]
          }
        });
        return;
      }
      
      return next();
    } catch (error) {
      console.error('Registration check error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  };
};

// Admin authorization middleware
const requireAdmin = () => {
  return async (ctx, next) => {
    try {
      const userId = ctx.from.id;
      
      // Check if user is admin
      if (!config.admin.userIds.includes(userId)) {
        await ctx.reply(fa.errors.unauthorized);
        return;
      }
      
      // Set admin flag
      ctx.isAdmin = true;
      
      return next();
    } catch (error) {
      console.error('Admin authorization error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  };
};

// Block check middleware
const checkBlocked = () => {
  return async (ctx, next) => {
    try {
      if (ctx.user.isBlocked()) {
        const blockReason = ctx.user.security.blockReason || 'نامشخص';
        await ctx.reply(`🚫 حساب شما مسدود شده است.\nدلیل: ${blockReason}\n\nبرای رفع مسدودیت با پشتیبانی تماس بگیرید.`);
        return;
      }
      
      return next();
    } catch (error) {
      console.error('Block check error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  };
};

// Session management middleware
const sessionManager = () => {
  return async (ctx, next) => {
    try {
      const userId = ctx.from.id;
      
      // Get session data
      let sessionData = await storage.getSession(userId);
      
      // Create new session if doesn't exist
      if (!sessionData) {
        sessionData = {
          userId,
          state: SESSION_STATES.IDLE,
          data: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await storage.saveSession(userId, sessionData);
      }
      
      // Add session to context
      ctx.session = sessionData;
      
      // Helper function to update session
      ctx.updateSession = async (updates) => {
        ctx.session = {
          ...ctx.session,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        await storage.saveSession(userId, ctx.session);
      };
      
      return next();
    } catch (error) {
      console.error('Session management error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  };
};

// Transaction participant check
const requireTransactionParticipant = () => {
  return async (ctx, next) => {
    try {
      const transactionId = ctx.session?.data?.currentTransactionId;
      
      if (!transactionId) {
        await ctx.reply('شما در حال حاضر در هیچ معامله‌ای شرکت ندارید.');
        return;
      }
      
      // Get transaction
      const transactionData = await storage.getTransaction(transactionId);
      
      if (!transactionData) {
        await ctx.reply(fa.errors.transactionNotFound);
        return;
      }
      
      // Check if user is participant
      const userId = ctx.from.id;
      if (transactionData.sellerId !== userId && transactionData.buyerId !== userId) {
        await ctx.reply(fa.errors.unauthorized);
        return;
      }
      
      // Add transaction to context
      ctx.transaction = transactionData;
      ctx.userRole = transactionData.sellerId === userId ? 'seller' : 'buyer';
      
      return next();
    } catch (error) {
      console.error('Transaction participant check error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  };
};

// State validation middleware
const requireState = (requiredStates) => {
  return async (ctx, next) => {
    try {
      const currentState = ctx.session?.state;
      
      if (!requiredStates.includes(currentState)) {
        await ctx.reply(fa.errors.invalidState);
        return;
      }
      
      return next();
    } catch (error) {
      console.error('State validation error:', error);
      await ctx.reply(fa.errors.systemError);
    }
  };
};

// Timeout check middleware
const checkTimeout = () => {
  return async (ctx, next) => {
    try {
      const sessionTimeout = config.timeouts.session;
      const sessionUpdated = new Date(ctx.session.updatedAt);
      const now = new Date();
      
      // Check if session is expired
      if (now - sessionUpdated > sessionTimeout) {
        // Reset session
        await ctx.updateSession({
          state: SESSION_STATES.IDLE,
          data: {}
        });
        
        await ctx.reply('⏰ جلسه شما منقضی شده است. لطفاً مجدداً شروع کنید.');
        return;
      }
      
      return next();
    } catch (error) {
      console.error('Timeout check error:', error);
      return next();
    }
  };
};

// Logging middleware
const logActivity = () => {
  return async (ctx, next) => {
    try {
      // Log user activity
      const logData = {
        userId: ctx.from.id,
        username: ctx.from.username,
        action: ctx.message?.text || ctx.callbackQuery?.data || 'unknown',
        timestamp: new Date().toISOString(),
        chatId: ctx.chat?.id,
        messageId: ctx.message?.message_id
      };
      
      await storage.saveLog(logData);
      
      return next();
    } catch (error) {
      console.error('Activity logging error:', error);
      return next();
    }
  };
};

module.exports = {
  authenticate,
  requireRegistration,
  requireAdmin,
  checkBlocked,
  sessionManager,
  requireTransactionParticipant,
  requireState,
  checkTimeout,
  logActivity
};
