const storage = require('./storage');
const config = require('../config');

class TimeoutManager {
  constructor() {
    this.timeouts = new Map();
    this.intervals = new Map();
  }

  // Set timeout for a user session
  setSessionTimeout(userId, callback, timeoutMs = config.timeouts.session) {
    this.clearSessionTimeout(userId);
    
    const timeoutId = setTimeout(async () => {
      try {
        await callback();
        this.timeouts.delete(userId);
      } catch (error) {
        console.error(`Session timeout callback error for user ${userId}:`, error);
      }
    }, timeoutMs);
    
    this.timeouts.set(userId, timeoutId);
    return timeoutId;
  }

  // Clear session timeout
  clearSessionTimeout(userId) {
    const timeoutId = this.timeouts.get(userId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(userId);
    }
  }

  // Set transaction timeout
  setTransactionTimeout(transactionId, callback, timeoutMs = config.timeouts.transaction) {
    this.clearTransactionTimeout(transactionId);
    
    const timeoutId = setTimeout(async () => {
      try {
        await callback();
        this.timeouts.delete(`transaction_${transactionId}`);
      } catch (error) {
        console.error(`Transaction timeout callback error for ${transactionId}:`, error);
      }
    }, timeoutMs);
    
    this.timeouts.set(`transaction_${transactionId}`, timeoutId);
    return timeoutId;
  }

  // Clear transaction timeout
  clearTransactionTimeout(transactionId) {
    const key = `transaction_${transactionId}`;
    const timeoutId = this.timeouts.get(key);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(key);
    }
  }

  // Set payment verification timeout
  setPaymentTimeout(transactionId, callback, timeoutMs = config.timeouts.paymentVerification) {
    const key = `payment_${transactionId}`;
    this.clearTimeout(key);
    
    const timeoutId = setTimeout(async () => {
      try {
        await callback();
        this.timeouts.delete(key);
      } catch (error) {
        console.error(`Payment timeout callback error for ${transactionId}:`, error);
      }
    }, timeoutMs);
    
    this.timeouts.set(key, timeoutId);
    return timeoutId;
  }

  // Set account transfer timeout
  setTransferTimeout(transactionId, callback, timeoutMs = config.timeouts.accountTransfer) {
    const key = `transfer_${transactionId}`;
    this.clearTimeout(key);
    
    const timeoutId = setTimeout(async () => {
      try {
        await callback();
        this.timeouts.delete(key);
      } catch (error) {
        console.error(`Transfer timeout callback error for ${transactionId}:`, error);
      }
    }, timeoutMs);
    
    this.timeouts.set(key, timeoutId);
    return timeoutId;
  }

  // Set final verification timeout
  setFinalVerificationTimeout(transactionId, callback, timeoutMs = config.timeouts.finalVerification) {
    const key = `final_${transactionId}`;
    this.clearTimeout(key);
    
    const timeoutId = setTimeout(async () => {
      try {
        await callback();
        this.timeouts.delete(key);
      } catch (error) {
        console.error(`Final verification timeout callback error for ${transactionId}:`, error);
      }
    }, timeoutMs);
    
    this.timeouts.set(key, timeoutId);
    return timeoutId;
  }

  // Clear any timeout by key
  clearTimeout(key) {
    const timeoutId = this.timeouts.get(key);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(key);
    }
  }

  // Set recurring interval
  setInterval(key, callback, intervalMs) {
    this.clearInterval(key);
    
    const intervalId = setInterval(async () => {
      try {
        await callback();
      } catch (error) {
        console.error(`Interval callback error for ${key}:`, error);
      }
    }, intervalMs);
    
    this.intervals.set(key, intervalId);
    return intervalId;
  }

  // Clear interval
  clearInterval(key) {
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
  }

  // Clear all timeouts and intervals
  clearAll() {
    // Clear all timeouts
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();
    
    // Clear all intervals
    for (const intervalId of this.intervals.values()) {
      clearInterval(intervalId);
    }
    this.intervals.clear();
  }

  // Get active timeout count
  getActiveTimeoutCount() {
    return this.timeouts.size;
  }

  // Get active interval count
  getActiveIntervalCount() {
    return this.intervals.size;
  }

  // Check if timeout exists
  hasTimeout(key) {
    return this.timeouts.has(key);
  }

  // Check if interval exists
  hasInterval(key) {
    return this.intervals.has(key);
  }

  // Create timeout for user input
  createInputTimeout(userId, ctx, timeoutMs = 5 * 60 * 1000) { // 5 minutes default
    return this.setSessionTimeout(userId, async () => {
      try {
        await ctx.reply('⏰ زمان انتظار تمام شد. لطفاً مجدداً تلاش کنید.', {
          reply_markup: {
            inline_keyboard: [[
              { text: '🔙 بازگشت به منو', callback_data: 'main_menu' }
            ]]
          }
        });
        
        // Reset user session
        await ctx.updateSession({
          state: 'idle',
          data: {}
        });
      } catch (error) {
        console.error('Input timeout error:', error);
      }
    }, timeoutMs);
  }

  // Create timeout for transaction step
  createStepTimeout(transactionId, ctx, step, timeoutMs) {
    return this.setTransactionTimeout(transactionId, async () => {
      try {
        const transactionData = await storage.getTransaction(transactionId);
        if (!transactionData) return;
        
        const Transaction = require('../models/Transaction');
        const transaction = Transaction.fromJSON(transactionData);
        
        // Mark transaction as timed out
        transaction.setState('failed', `Timeout in step: ${step}`, 'system');
        await storage.saveTransaction(transaction);
        
        // Notify participants
        const participants = transaction.getParticipants();
        for (const participantId of participants) {
          try {
            await ctx.telegram.sendMessage(participantId, 
              `⏰ معامله #${transaction.shortId} به دلیل عدم پاسخ در مرحله ${step} لغو شد.`, {
              reply_markup: {
                inline_keyboard: [[
                  { text: '🔙 بازگشت به منو', callback_data: 'main_menu' }
                ]]
              }
            });
          } catch (error) {
            console.error(`Failed to notify participant ${participantId}:`, error);
          }
        }
        
        // Notify admins
        const adminIds = config.admin.userIds;
        for (const adminId of adminIds) {
          try {
            await ctx.telegram.sendMessage(adminId, 
              `⏰ معامله #${transaction.shortId} به دلیل timeout لغو شد.\nمرحله: ${step}`);
          } catch (error) {
            console.error(`Failed to notify admin ${adminId}:`, error);
          }
        }
      } catch (error) {
        console.error('Step timeout error:', error);
      }
    }, timeoutMs);
  }

  // Create warning timeout (warn before actual timeout)
  createWarningTimeout(key, ctx, warningMessage, warningTimeMs, actualTimeoutMs, actualCallback) {
    // Set warning timeout
    const warningTimeoutId = setTimeout(async () => {
      try {
        await ctx.reply(warningMessage);
      } catch (error) {
        console.error('Warning timeout error:', error);
      }
    }, warningTimeMs);
    
    // Set actual timeout
    const actualTimeoutId = setTimeout(actualCallback, actualTimeoutMs);
    
    // Store both timeouts
    this.timeouts.set(`${key}_warning`, warningTimeoutId);
    this.timeouts.set(key, actualTimeoutId);
    
    return { warningTimeoutId, actualTimeoutId };
  }

  // Clear warning timeout
  clearWarningTimeout(key) {
    this.clearTimeout(`${key}_warning`);
    this.clearTimeout(key);
  }
}

// Create singleton instance
const timeoutManager = new TimeoutManager();

// Cleanup on process exit
process.on('exit', () => {
  timeoutManager.clearAll();
});

process.on('SIGINT', () => {
  timeoutManager.clearAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  timeoutManager.clearAll();
  process.exit(0);
});

module.exports = timeoutManager;
