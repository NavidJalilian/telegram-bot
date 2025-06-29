const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class ChatRoom {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.postId = data.postId || null; // The shared post ID that users enter
    this.participants = data.participants || []; // Array of user IDs
    this.messages = data.messages || [];
    this.isActive = data.isActive !== false;
    this.createdAt = data.createdAt || moment().toISOString();
    this.updatedAt = data.updatedAt || moment().toISOString();
    this.lastActivity = data.lastActivity || moment().toISOString();
    
    // Room settings
    this.settings = {
      maxParticipants: data.settings?.maxParticipants || 2,
      allowNewParticipants: data.settings?.allowNewParticipants !== false,
      autoDeleteAfterHours: data.settings?.autoDeleteAfterHours || 24
    };
    
    // Room metadata
    this.metadata = {
      title: data.metadata?.title || `گفتگو ${this.postId}`,
      description: data.metadata?.description || '',
      createdBy: data.metadata?.createdBy || null
    };
  }

  // Add participant to chat room
  addParticipant(userId) {
    if (this.participants.includes(userId)) {
      return { success: false, reason: 'user_already_in_room' };
    }
    
    if (this.participants.length >= this.settings.maxParticipants) {
      return { success: false, reason: 'room_full' };
    }
    
    if (!this.settings.allowNewParticipants && this.participants.length > 0) {
      return { success: false, reason: 'room_closed' };
    }
    
    this.participants.push(userId);
    this.updateActivity();
    
    // Add system message
    this.addSystemMessage(`کاربر جدید به گفتگو پیوست`, userId);
    
    return { success: true };
  }

  // Remove participant from chat room
  removeParticipant(userId) {
    const index = this.participants.indexOf(userId);
    if (index === -1) {
      return { success: false, reason: 'user_not_in_room' };
    }
    
    this.participants.splice(index, 1);
    this.updateActivity();
    
    // Add system message
    this.addSystemMessage(`کاربر از گفتگو خارج شد`, userId);
    
    // Deactivate room if no participants left
    if (this.participants.length === 0) {
      this.isActive = false;
    }
    
    return { success: true };
  }

  // Add message to chat room
  addMessage(userId, messageText, messageType = 'text') {
    if (!this.participants.includes(userId)) {
      return { success: false, reason: 'user_not_in_room' };
    }
    
    if (!this.isActive) {
      return { success: false, reason: 'room_inactive' };
    }
    
    const message = {
      id: uuidv4(),
      userId,
      text: messageText,
      type: messageType,
      timestamp: moment().toISOString(),
      edited: false,
      editedAt: null
    };
    
    this.messages.push(message);
    this.updateActivity();
    
    return { success: true, message };
  }

  // Add system message
  addSystemMessage(text, relatedUserId = null) {
    const message = {
      id: uuidv4(),
      userId: 'system',
      text,
      type: 'system',
      timestamp: moment().toISOString(),
      relatedUserId
    };
    
    this.messages.push(message);
    this.updateActivity();
    
    return message;
  }

  // Get recent messages
  getRecentMessages(limit = 20) {
    return this.messages
      .slice(-limit)
      .map(msg => ({
        ...msg,
        timeAgo: moment(msg.timestamp).fromNow()
      }));
  }

  // Get messages for a specific user (with proper formatting)
  getMessagesForUser(userId, limit = 20) {
    if (!this.participants.includes(userId)) {
      return [];
    }
    
    return this.getRecentMessages(limit);
  }

  // Check if user is participant
  isParticipant(userId) {
    return this.participants.includes(userId);
  }

  // Get other participants (excluding the given user)
  getOtherParticipants(userId) {
    return this.participants.filter(id => id !== userId);
  }

  // Update last activity
  updateActivity() {
    this.lastActivity = moment().toISOString();
    this.updatedAt = moment().toISOString();
    return this;
  }

  // Check if room is expired
  isExpired() {
    const expiryTime = moment(this.lastActivity).add(this.settings.autoDeleteAfterHours, 'hours');
    return moment().isAfter(expiryTime);
  }

  // Get room status
  getStatus() {
    if (!this.isActive) return 'inactive';
    if (this.isExpired()) return 'expired';
    if (this.participants.length === 0) return 'empty';
    if (this.participants.length === 1) return 'waiting';
    if (this.participants.length >= this.settings.maxParticipants) return 'full';
    return 'active';
  }

  // Get room summary
  getSummary() {
    return {
      postId: this.postId,
      participantCount: this.participants.length,
      messageCount: this.messages.length,
      status: this.getStatus(),
      lastActivity: this.lastActivity,
      isActive: this.isActive
    };
  }

  // Format room info for display
  getDisplayInfo() {
    const status = this.getStatus();
    const statusEmoji = {
      'active': '🟢',
      'waiting': '🟡',
      'full': '🔴',
      'inactive': '⚫',
      'expired': '⏰',
      'empty': '⚪'
    };
    
    return {
      title: this.metadata.title,
      postId: this.postId,
      status: `${statusEmoji[status]} ${this.getStatusText(status)}`,
      participants: this.participants.length,
      messages: this.messages.length,
      lastActivity: moment(this.lastActivity).fromNow()
    };
  }

  // Get status text in Persian
  getStatusText(status) {
    const statusTexts = {
      'active': 'فعال',
      'waiting': 'در انتظار',
      'full': 'پر',
      'inactive': 'غیرفعال',
      'expired': 'منقضی',
      'empty': 'خالی'
    };
    
    return statusTexts[status] || 'نامشخص';
  }

  // Validate chat room data
  validate() {
    const errors = [];
    
    if (!this.postId || this.postId.trim().length === 0) {
      errors.push('Post ID is required');
    }
    
    if (this.participants.length > this.settings.maxParticipants) {
      errors.push('Too many participants');
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
      postId: this.postId,
      participants: this.participants,
      messages: this.messages,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastActivity: this.lastActivity,
      settings: this.settings,
      metadata: this.metadata
    };
  }

  // Create from JSON
  static fromJSON(data) {
    return new ChatRoom(data);
  }

  // Generate random post ID
  static generatePostId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }
}

module.exports = ChatRoom;
