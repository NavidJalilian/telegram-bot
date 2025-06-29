const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

class Storage {
  constructor() {
    this.dataPath = config.storage.path;
    this.usersPath = path.join(this.dataPath, 'users');
    this.transactionsPath = path.join(this.dataPath, 'transactions');
    this.chatRoomsPath = path.join(this.dataPath, 'chatrooms');
    this.sessionsPath = path.join(this.dataPath, 'sessions');
    this.logsPath = path.join(this.dataPath, 'logs');
    this.backupsPath = path.join(this.dataPath, 'backups');
    
    this.initializeStorage();
  }

  // Initialize storage directories
  async initializeStorage() {
    try {
      await fs.ensureDir(this.dataPath);
      await fs.ensureDir(this.usersPath);
      await fs.ensureDir(this.transactionsPath);
      await fs.ensureDir(this.chatRoomsPath);
      await fs.ensureDir(this.sessionsPath);
      await fs.ensureDir(this.logsPath);
      await fs.ensureDir(this.backupsPath);
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  // User storage methods
  async saveUser(user) {
    try {
      const filePath = path.join(this.usersPath, `${user.id}.json`);
      await fs.writeJson(filePath, user.toJSON(), { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Failed to save user:', error);
      return false;
    }
  }

  async getUser(userId) {
    try {
      const filePath = path.join(this.usersPath, `${userId}.json`);
      const exists = await fs.pathExists(filePath);
      
      if (!exists) {
        return null;
      }
      
      const userData = await fs.readJson(filePath);
      return userData;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  async getAllUsers() {
    try {
      const files = await fs.readdir(this.usersPath);
      const users = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const userData = await fs.readJson(path.join(this.usersPath, file));
          users.push(userData);
        }
      }
      
      return users;
    } catch (error) {
      console.error('Failed to get all users:', error);
      return [];
    }
  }

  async deleteUser(userId) {
    try {
      const filePath = path.join(this.usersPath, `${userId}.json`);
      await fs.remove(filePath);
      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }

  // Transaction storage methods
  async saveTransaction(transaction) {
    try {
      const filePath = path.join(this.transactionsPath, `${transaction.id}.json`);
      await fs.writeJson(filePath, transaction.toJSON(), { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Failed to save transaction:', error);
      return false;
    }
  }

  async getTransaction(transactionId) {
    try {
      const filePath = path.join(this.transactionsPath, `${transactionId}.json`);
      const exists = await fs.pathExists(filePath);
      
      if (!exists) {
        return null;
      }
      
      const transactionData = await fs.readJson(filePath);
      return transactionData;
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return null;
    }
  }

  async getTransactionByShortId(shortId) {
    try {
      const files = await fs.readdir(this.transactionsPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const transactionData = await fs.readJson(path.join(this.transactionsPath, file));
          if (transactionData.shortId === shortId) {
            return transactionData;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get transaction by short ID:', error);
      return null;
    }
  }

  async getAllTransactions() {
    try {
      const files = await fs.readdir(this.transactionsPath);
      const transactions = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const transactionData = await fs.readJson(path.join(this.transactionsPath, file));
          transactions.push(transactionData);
        }
      }
      
      return transactions;
    } catch (error) {
      console.error('Failed to get all transactions:', error);
      return [];
    }
  }

  async getUserTransactions(userId) {
    try {
      const allTransactions = await this.getAllTransactions();
      return allTransactions.filter(t => t.sellerId === userId || t.buyerId === userId);
    } catch (error) {
      console.error('Failed to get user transactions:', error);
      return [];
    }
  }

  async deleteTransaction(transactionId) {
    try {
      const filePath = path.join(this.transactionsPath, `${transactionId}.json`);
      await fs.remove(filePath);
      return true;
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      return false;
    }
  }

  // Session storage methods
  async saveSession(userId, sessionData) {
    try {
      const filePath = path.join(this.sessionsPath, `${userId}.json`);
      await fs.writeJson(filePath, {
        userId,
        ...sessionData,
        updatedAt: new Date().toISOString()
      }, { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  }

  async getSession(userId) {
    try {
      const filePath = path.join(this.sessionsPath, `${userId}.json`);
      const exists = await fs.pathExists(filePath);
      
      if (!exists) {
        return null;
      }
      
      const sessionData = await fs.readJson(filePath);
      return sessionData;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  async deleteSession(userId) {
    try {
      const filePath = path.join(this.sessionsPath, `${userId}.json`);
      await fs.remove(filePath);
      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }

  // Log storage methods
  async saveLog(logData) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const filePath = path.join(this.logsPath, `${date}.log`);
      const logEntry = `${new Date().toISOString()} - ${JSON.stringify(logData)}\n`;
      await fs.appendFile(filePath, logEntry);
      return true;
    } catch (error) {
      console.error('Failed to save log:', error);
      return false;
    }
  }

  // Backup methods
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.backupsPath, `backup-${timestamp}`);
      
      await fs.ensureDir(backupDir);
      await fs.copy(this.usersPath, path.join(backupDir, 'users'));
      await fs.copy(this.transactionsPath, path.join(backupDir, 'transactions'));
      await fs.copy(this.chatRoomsPath, path.join(backupDir, 'chatrooms'));
      await fs.copy(this.sessionsPath, path.join(backupDir, 'sessions'));
      
      // Create backup info file
      const backupInfo = {
        timestamp,
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      await fs.writeJson(path.join(backupDir, 'backup-info.json'), backupInfo, { spaces: 2 });
      
      return backupDir;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return null;
    }
  }

  async restoreBackup(backupDir) {
    try {
      const backupInfoPath = path.join(backupDir, 'backup-info.json');
      const exists = await fs.pathExists(backupInfoPath);
      
      if (!exists) {
        throw new Error('Invalid backup directory');
      }
      
      // Create backup of current data before restore
      await this.createBackup();
      
      // Restore data
      await fs.copy(path.join(backupDir, 'users'), this.usersPath);
      await fs.copy(path.join(backupDir, 'transactions'), this.transactionsPath);
      await fs.copy(path.join(backupDir, 'chatrooms'), this.chatRoomsPath);
      await fs.copy(path.join(backupDir, 'sessions'), this.sessionsPath);
      
      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }

  async cleanupOldBackups(daysToKeep = 30) {
    try {
      const backups = await fs.readdir(this.backupsPath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      for (const backup of backups) {
        const backupPath = path.join(this.backupsPath, backup);
        const stats = await fs.stat(backupPath);
        
        if (stats.isDirectory() && stats.mtime < cutoffDate) {
          await fs.remove(backupPath);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      return false;
    }
  }

  // Chat room storage methods
  async saveChatRoom(chatRoom) {
    try {
      const filePath = path.join(this.chatRoomsPath, `${chatRoom.id}.json`);
      await fs.writeJson(filePath, chatRoom.toJSON(), { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Failed to save chat room:', error);
      return false;
    }
  }

  async getChatRoom(chatRoomId) {
    try {
      const filePath = path.join(this.chatRoomsPath, `${chatRoomId}.json`);
      const exists = await fs.pathExists(filePath);

      if (!exists) {
        return null;
      }

      const chatRoomData = await fs.readJson(filePath);
      return chatRoomData;
    } catch (error) {
      console.error('Failed to get chat room:', error);
      return null;
    }
  }

  async getChatRoomByPostId(postId) {
    try {
      const files = await fs.readdir(this.chatRoomsPath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const chatRoomData = await fs.readJson(path.join(this.chatRoomsPath, file));
          if (chatRoomData.postId === postId) {
            return chatRoomData;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get chat room by post ID:', error);
      return null;
    }
  }

  async getAllChatRooms() {
    try {
      const files = await fs.readdir(this.chatRoomsPath);
      const chatRooms = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const chatRoomData = await fs.readJson(path.join(this.chatRoomsPath, file));
          chatRooms.push(chatRoomData);
        }
      }

      return chatRooms;
    } catch (error) {
      console.error('Failed to get all chat rooms:', error);
      return [];
    }
  }

  async getUserChatRooms(userId) {
    try {
      const allChatRooms = await this.getAllChatRooms();
      return allChatRooms.filter(room => room.participants.includes(userId));
    } catch (error) {
      console.error('Failed to get user chat rooms:', error);
      return [];
    }
  }

  async deleteChatRoom(chatRoomId) {
    try {
      const filePath = path.join(this.chatRoomsPath, `${chatRoomId}.json`);
      await fs.remove(filePath);
      return true;
    } catch (error) {
      console.error('Failed to delete chat room:', error);
      return false;
    }
  }
}

module.exports = new Storage();
