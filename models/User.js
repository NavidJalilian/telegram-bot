const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class User {
  constructor(data = {}) {
    this.id = data.id || null; // Telegram user ID
    this.uuid = data.uuid || uuidv4();
    this.name = data.name || null;
    this.username = data.username || null;
    this.phone = data.phone || null;
    this.role = data.role || 'user'; // user, admin
    this.isRegistered = data.isRegistered || false;
    this.createdAt = data.createdAt || moment().toISOString();
    this.updatedAt = data.updatedAt || moment().toISOString();
    this.lastActivity = data.lastActivity || moment().toISOString();
    
    // Statistics
    this.stats = {
      totalTransactions: data.stats?.totalTransactions || 0,
      completedTransactions: data.stats?.completedTransactions || 0,
      cancelledTransactions: data.stats?.cancelledTransactions || 0,
      totalVolume: data.stats?.totalVolume || 0,
      rating: data.stats?.rating || 0,
      ratingCount: data.stats?.ratingCount || 0
    };
    
    // Settings
    this.settings = {
      language: data.settings?.language || 'fa',
      notifications: data.settings?.notifications !== false,
      timezone: data.settings?.timezone || 'Asia/Tehran'
    };
    
    // Security
    this.security = {
      isBlocked: data.security?.isBlocked || false,
      blockReason: data.security?.blockReason || null,
      blockedAt: data.security?.blockedAt || null,
      loginAttempts: data.security?.loginAttempts || 0,
      lastLoginAttempt: data.security?.lastLoginAttempt || null
    };
  }

  // Update user information
  update(data) {
    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'uuid' && key !== 'createdAt') {
        this[key] = data[key];
      }
    });
    this.updatedAt = moment().toISOString();
    return this;
  }

  // Update last activity
  updateActivity() {
    this.lastActivity = moment().toISOString();
    return this;
  }

  // Complete registration
  completeRegistration(name, phone) {
    this.name = name;
    this.phone = phone;
    this.isRegistered = true;
    this.updatedAt = moment().toISOString();
    return this;
  }

  // Check if user is admin
  isAdmin() {
    return this.role === 'admin';
  }

  // Check if user is blocked
  isBlocked() {
    return this.security.isBlocked;
  }

  // Block user
  block(reason) {
    this.security.isBlocked = true;
    this.security.blockReason = reason;
    this.security.blockedAt = moment().toISOString();
    this.updatedAt = moment().toISOString();
    return this;
  }

  // Unblock user
  unblock() {
    this.security.isBlocked = false;
    this.security.blockReason = null;
    this.security.blockedAt = null;
    this.updatedAt = moment().toISOString();
    return this;
  }

  // Update statistics
  updateStats(transactionData) {
    this.stats.totalTransactions += 1;
    
    if (transactionData.status === 'completed') {
      this.stats.completedTransactions += 1;
      this.stats.totalVolume += transactionData.amount || 0;
    } else if (transactionData.status === 'cancelled') {
      this.stats.cancelledTransactions += 1;
    }
    
    this.updatedAt = moment().toISOString();
    return this;
  }

  // Add rating
  addRating(rating) {
    const currentTotal = this.stats.rating * this.stats.ratingCount;
    this.stats.ratingCount += 1;
    this.stats.rating = (currentTotal + rating) / this.stats.ratingCount;
    this.updatedAt = moment().toISOString();
    return this;
  }

  // Get user display name
  getDisplayName() {
    return this.name || this.username || `User ${this.id}`;
  }

  // Validate user data
  validate() {
    const errors = [];
    
    if (!this.id) {
      errors.push('User ID is required');
    }
    
    if (this.isRegistered) {
      if (!this.name || this.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
      }
      
      if (!this.phone || !/^09\d{9}$/.test(this.phone)) {
        errors.push('Valid phone number is required');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      uuid: this.uuid,
      name: this.name,
      username: this.username,
      phone: this.phone,
      role: this.role,
      isRegistered: this.isRegistered,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastActivity: this.lastActivity,
      stats: this.stats,
      settings: this.settings,
      security: this.security
    };
  }

  // Create from JSON
  static fromJSON(data) {
    return new User(data);
  }
}

module.exports = User;
