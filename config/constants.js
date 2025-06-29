// Transaction States
const TRANSACTION_STATES = {
  INITIATED: 'initiated',
  ELIGIBILITY_CHECK: 'eligibility_check',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_VERIFIED: 'payment_verified',
  ACCOUNT_TRANSFER: 'account_transfer',
  BUYER_VERIFICATION: 'buyer_verification',
  FINAL_VERIFICATION: 'final_verification',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
};

// User Roles
const USER_ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin'
};

// Session States
const SESSION_STATES = {
  IDLE: 'idle',
  REGISTERING: 'registering',
  IN_TRANSACTION: 'in_transaction',
  WAITING_INPUT: 'waiting_input',
  ADMIN_PANEL: 'admin_panel'
};

// Account Types
const ACCOUNT_TYPES = {
  GMAIL: 'gmail',
  SUPERCELL_ID: 'supercell_id'
};

// Message Types
const MESSAGE_TYPES = {
  TEXT: 'text',
  PHOTO: 'photo',
  VIDEO: 'video',
  DOCUMENT: 'document'
};

// Error Codes
const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  TIMEOUT: 'TIMEOUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
  INVALID_STATE: 'INVALID_STATE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CONTENT_FILTERED: 'CONTENT_FILTERED',
  SYSTEM_ERROR: 'SYSTEM_ERROR'
};

// Keyboard Types
const KEYBOARD_TYPES = {
  MAIN_MENU: 'main_menu',
  TRANSACTION_MENU: 'transaction_menu',
  ADMIN_MENU: 'admin_menu',
  CONFIRMATION: 'confirmation',
  CANCEL: 'cancel'
};

// File Types for Verification
const VERIFICATION_FILE_TYPES = {
  PAYMENT_RECEIPT: 'payment_receipt',
  ACCOUNT_SCREENSHOT: 'account_screenshot',
  LOGOUT_VIDEO: 'logout_video'
};

// Regular Expressions for Content Filtering
const CONTENT_FILTERS = {
  EMAIL_PATTERN: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PASSWORD_PATTERN: /(?:password|pass|pwd|رمز|پسورد|کلمه.*عبور)[\s:=]*[^\s]+/gi,
  ACCOUNT_ID_PATTERN: /(?:id|آی.*دی|شناسه)[\s:=]*[a-zA-Z0-9._-]+/gi,
  PHONE_PATTERN: /(?:\+98|0098|09)\d{9}/g,
  CARD_NUMBER_PATTERN: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g
};

// Transaction Limits
const LIMITS = {
  MAX_CONCURRENT_TRANSACTIONS_PER_USER: 3,
  MAX_TRANSACTION_AMOUNT: 10000000, // 10 million Toman
  MIN_TRANSACTION_AMOUNT: 50000, // 50 thousand Toman
  MAX_MESSAGE_LENGTH: 4096,
  MAX_FILE_SIZE: 50 * 1024 * 1024 // 50MB
};

module.exports = {
  TRANSACTION_STATES,
  USER_ROLES,
  SESSION_STATES,
  ACCOUNT_TYPES,
  MESSAGE_TYPES,
  ERROR_CODES,
  KEYBOARD_TYPES,
  VERIFICATION_FILE_TYPES,
  CONTENT_FILTERS,
  LIMITS
};
