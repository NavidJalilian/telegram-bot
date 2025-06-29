# Telegram Escrow Bot for Gaming Accounts

A comprehensive Telegram bot that serves as an escrow service for digital gaming account transactions (specifically Gmail/Supercell ID accounts) between buyers and sellers. The bot implements a secure, step-by-step workflow to prevent fraud and ensure safe transactions.

## 🌟 Features

### Core Functionality
- **Secure Escrow System**: Complete transaction management with admin oversight
- **Multi-Step Verification**: Account eligibility, payment verification, and final confirmation
- **Persian/Farsi Interface**: Full UTF-8 support with comprehensive Persian language interface
- **Content Filtering**: Advanced text filtering to prevent sharing of sensitive information
- **Session Management**: Robust state management for multiple concurrent user sessions
- **Admin Panel**: Comprehensive admin dashboard for transaction oversight

### Security Features
- **Text Filtering**: Automatic detection and blocking of emails, passwords, account IDs
- **Rate Limiting**: Protection against spam and abuse
- **Input Validation**: Comprehensive validation for all user inputs
- **Timeout Management**: Automatic timeout handling for each workflow step
- **Audit Trail**: Complete transaction history and logging

### Transaction Workflow
1. **Initial Setup**: User registration and communication
2. **Transaction Initiation**: Account type selection and price setting
3. **Eligibility Verification**: Account change capability verification
4. **Payment Processing**: Admin-supervised payment verification
5. **Account Transfer**: Secure account transfer with verification codes
6. **Buyer Verification**: Buyer confirmation of account details
7. **Final Verification**: Video proof of account logout

## 🚀 Quick Start

### Prerequisites
- Node.js 16.0.0 or higher
- Redis (optional, for session storage)
- Telegram Bot Token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd telegram-escrow-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the bot**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Required
BOT_TOKEN=your_telegram_bot_token_here
ADMIN_USER_IDS=123456789,987654321

# Optional
REDIS_URL=redis://localhost:6379
NODE_ENV=production
TRANSACTION_TIMEOUT_MINUTES=30
```

### Bot Token Setup

1. Create a new bot with [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Set the token in your `.env` file
4. Configure admin user IDs

## 📁 Project Structure

```
telegram-escrow-bot/
├── app.js                 # Application entry point
├── bot.js                 # Main bot initialization
├── config/
│   ├── index.js          # Configuration management
│   └── constants.js      # Application constants
├── handlers/
│   ├── start.js          # Registration and main menu
│   ├── initiate.js       # Transaction initiation
│   ├── verification.js   # Account eligibility verification
│   ├── payment.js        # Payment processing
│   ├── transfer.js       # Account transfer
│   ├── buyerVerification.js  # Buyer verification
│   ├── finalVerification.js  # Final security verification
│   └── admin.js          # Admin panel
├── middleware/
│   ├── auth.js           # Authentication and authorization
│   └── filtering.js      # Content filtering and security
├── models/
│   ├── User.js           # User data model
│   └── Transaction.js    # Transaction data model
├── utils/
│   ├── textFilter.js     # Text filtering utilities
│   └── storage.js        # Data persistence
├── locales/
│   └── fa.js             # Persian language strings
└── data/                 # Data storage directory
```

## 🔧 Usage

### For Users

1. **Start the bot**: Send `/start` to begin
2. **Register**: Complete the registration process
3. **Create transaction**: Choose "Start Sale Process" or "Start Purchase"
4. **Follow workflow**: Complete each step as guided by the bot

### For Admins

1. **Access admin panel**: Use the admin menu (available to configured admin users)
2. **Review transactions**: Monitor pending transactions
3. **Approve payments**: Verify and approve payment requests
4. **Review videos**: Approve or reject logout videos
5. **Manage users**: View user statistics and manage accounts

## 🛡️ Security Features

### Content Filtering
- **Email Detection**: Automatically detects and blocks email addresses
- **Password Protection**: Prevents sharing of passwords in chat
- **Account ID Filtering**: Blocks account identifiers and sensitive data
- **Persian Pattern Recognition**: Supports Persian/Farsi sensitive content detection

### Rate Limiting
- **Request Limiting**: Maximum 10 requests per minute per user
- **Spam Protection**: Automatic detection of spam patterns
- **Timeout Management**: Session timeouts to prevent resource abuse

### Data Protection
- **Encrypted Storage**: Sensitive data is handled securely
- **Audit Logging**: Complete transaction audit trail
- **Backup System**: Automatic data backups every 6 hours

## 📊 Admin Features

### Dashboard
- **System Statistics**: User counts, transaction volumes, success rates
- **Pending Transactions**: Quick access to transactions needing review
- **User Management**: User statistics and account management
- **Reports**: Detailed system reports and analytics

### Transaction Management
- **Payment Approval**: Review and approve payment requests
- **Video Verification**: Review logout videos for final approval
- **Transaction Notes**: Add administrative notes to transactions
- **Manual Intervention**: Cancel or modify transactions when needed

## 🔄 Transaction States

1. **INITIATED**: Transaction created by seller
2. **ELIGIBILITY_CHECK**: Verifying account change capability
3. **PAYMENT_PENDING**: Waiting for admin payment approval
4. **PAYMENT_VERIFIED**: Payment approved, ready for buyer
5. **ACCOUNT_TRANSFER**: Account being transferred to buyer
6. **BUYER_VERIFICATION**: Buyer confirming account satisfaction
7. **FINAL_VERIFICATION**: Waiting for logout video approval
8. **COMPLETED**: Transaction successfully completed
9. **CANCELLED**: Transaction cancelled
10. **FAILED**: Transaction failed

## 🚨 Error Handling

The bot includes comprehensive error handling:
- **User-friendly messages**: All errors shown in Persian
- **Automatic recovery**: Session recovery and timeout handling
- **Logging**: Complete error logging for debugging
- **Graceful degradation**: System continues operating during partial failures

## 📝 Logging

### Transaction Logs
- All user actions are logged with timestamps
- Transaction state changes are tracked
- Admin actions are recorded for audit purposes

### System Logs
- Application startup and shutdown events
- Error logs with stack traces
- Performance metrics and statistics

## 🔧 Maintenance

### Backup and Recovery
- **Automatic Backups**: Every 6 hours
- **Manual Backup**: Available through admin panel
- **Data Recovery**: Restore from backup functionality

### Monitoring
- **Health Checks**: System status monitoring
- **Performance Metrics**: Response times and throughput
- **Alert System**: Notifications for critical issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common issues

## 🔮 Future Enhancements

- **Multi-language Support**: Additional language interfaces
- **Payment Integration**: Direct payment gateway integration
- **Mobile App**: Companion mobile application
- **API Access**: RESTful API for external integrations
- **Advanced Analytics**: Enhanced reporting and analytics
- **Automated Testing**: Comprehensive test suite

---

**Note**: This bot is designed for educational and legitimate business purposes. Ensure compliance with local laws and Telegram's Terms of Service when deploying.
