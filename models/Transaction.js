const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { TRANSACTION_STATES, ACCOUNT_TYPES } = require('../config/constants');

class Transaction {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.shortId = data.shortId || this.generateShortId();
    this.sellerId = data.sellerId || null;
    this.buyerId = data.buyerId || null;
    this.accountType = data.accountType || ACCOUNT_TYPES.GMAIL;
    this.amount = data.amount || 0;
    this.description = data.description || '';
    this.state = data.state || TRANSACTION_STATES.INITIATED;
    this.createdAt = data.createdAt || moment().toISOString();
    this.updatedAt = data.updatedAt || moment().toISOString();
    this.completedAt = data.completedAt || null;
    this.cancelledAt = data.cancelledAt || null;
    this.timeoutAt = data.timeoutAt || null;
    
    // Transaction data for each step
    this.data = {
      eligibility: data.data?.eligibility || null,
      payment: data.data?.payment || null,
      transfer: data.data?.transfer || null,
      buyerVerification: data.data?.buyerVerification || null,
      finalVerification: data.data?.finalVerification || null,
      ...data.data
    };
    
    // Files and media
    this.files = data.files || [];
    
    // History of state changes
    this.history = data.history || [];
    
    // Retry attempts for each step
    this.retryAttempts = data.retryAttempts || {};
    
    // Admin notes
    this.adminNotes = data.adminNotes || [];
  }

  // Generate short ID for display
  generateShortId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  // Update transaction state
  setState(newState, note = null, userId = null) {
    const oldState = this.state;
    this.state = newState;
    this.updatedAt = moment().toISOString();
    
    // Add to history
    this.history.push({
      from: oldState,
      to: newState,
      timestamp: moment().toISOString(),
      note,
      userId
    });
    
    // Set completion/cancellation timestamps
    if (newState === TRANSACTION_STATES.COMPLETED) {
      this.completedAt = moment().toISOString();
    } else if (newState === TRANSACTION_STATES.CANCELLED || newState === TRANSACTION_STATES.FAILED) {
      this.cancelledAt = moment().toISOString();
    }
    
    return this;
  }

  // Update transaction data for specific step
  updateData(step, data) {
    this.data[step] = { ...this.data[step], ...data };
    this.updatedAt = moment().toISOString();
    return this;
  }

  // Add file to transaction
  addFile(fileData) {
    this.files.push({
      id: uuidv4(),
      ...fileData,
      uploadedAt: moment().toISOString()
    });
    this.updatedAt = moment().toISOString();
    return this;
  }

  // Add admin note
  addAdminNote(note, adminId) {
    this.adminNotes.push({
      id: uuidv4(),
      note,
      adminId,
      timestamp: moment().toISOString()
    });
    this.updatedAt = moment().toISOString();
    return this;
  }

  // Increment retry attempts for a step
  incrementRetry(step) {
    this.retryAttempts[step] = (this.retryAttempts[step] || 0) + 1;
    this.updatedAt = moment().toISOString();
    return this;
  }

  // Get retry count for a step
  getRetryCount(step) {
    return this.retryAttempts[step] || 0;
  }

  // Check if transaction is active
  isActive() {
    return ![
      TRANSACTION_STATES.COMPLETED,
      TRANSACTION_STATES.CANCELLED,
      TRANSACTION_STATES.FAILED
    ].includes(this.state);
  }

  // Check if transaction is expired
  isExpired() {
    return this.timeoutAt && moment().isAfter(moment(this.timeoutAt));
  }

  // Set timeout
  setTimeout(minutes) {
    this.timeoutAt = moment().add(minutes, 'minutes').toISOString();
    this.updatedAt = moment().toISOString();
    return this;
  }

  // Clear timeout
  clearTimeout() {
    this.timeoutAt = null;
    this.updatedAt = moment().toISOString();
    return this;
  }

  // Get transaction age in minutes
  getAge() {
    return moment().diff(moment(this.createdAt), 'minutes');
  }

  // Get current step duration in minutes
  getCurrentStepDuration() {
    const lastStateChange = this.history[this.history.length - 1];
    const startTime = lastStateChange ? lastStateChange.timestamp : this.createdAt;
    return moment().diff(moment(startTime), 'minutes');
  }

  // Get participants
  getParticipants() {
    const participants = [];
    if (this.sellerId) participants.push(this.sellerId);
    if (this.buyerId) participants.push(this.buyerId);
    return participants;
  }

  // Check if user is participant
  isParticipant(userId) {
    return this.sellerId === userId || this.buyerId === userId;
  }

  // Get user role in transaction
  getUserRole(userId) {
    if (this.sellerId === userId) return 'seller';
    if (this.buyerId === userId) return 'buyer';
    return null;
  }

  // Validate transaction data
  validate() {
    const errors = [];
    
    if (!this.sellerId) {
      errors.push('Seller ID is required');
    }
    
    if (!this.accountType || !Object.values(ACCOUNT_TYPES).includes(this.accountType)) {
      errors.push('Valid account type is required');
    }
    
    if (!this.amount || this.amount <= 0) {
      errors.push('Valid amount is required');
    }
    
    if (!this.description || this.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get transaction summary
  getSummary() {
    return {
      id: this.shortId,
      state: this.state,
      accountType: this.accountType,
      amount: this.amount,
      age: this.getAge(),
      isActive: this.isActive(),
      isExpired: this.isExpired()
    };
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      shortId: this.shortId,
      sellerId: this.sellerId,
      buyerId: this.buyerId,
      accountType: this.accountType,
      amount: this.amount,
      description: this.description,
      state: this.state,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
      cancelledAt: this.cancelledAt,
      timeoutAt: this.timeoutAt,
      data: this.data,
      files: this.files,
      history: this.history,
      retryAttempts: this.retryAttempts,
      adminNotes: this.adminNotes
    };
  }

  // Create from JSON
  static fromJSON(data) {
    return new Transaction(data);
  }
}

module.exports = Transaction;
