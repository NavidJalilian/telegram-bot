#!/usr/bin/env node

// Simple configuration test script
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing Telegram Escrow Bot Configuration...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found');
  console.log('📝 Please copy .env.example to .env and configure it:');
  console.log('   cp .env.example .env');
  console.log('   nano .env  # or use your preferred editor\n');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Required environment variables:');
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    const requiredVars = envExample.match(/^[A-Z_]+=.*$/gm) || [];
    requiredVars.forEach(line => {
      const [key] = line.split('=');
      if (key && !key.startsWith('#')) {
        console.log(`   - ${key}`);
      }
    });
  }
  process.exit(1);
}

// Load environment variables
require('dotenv').config();

// Test configuration
try {
  const config = require('./config');
  
  console.log('✅ Configuration loaded successfully\n');
  
  // Check required configurations
  const checks = [
    {
      name: 'Bot Token',
      value: config.bot.token,
      required: true,
      test: (val) => val && val.length > 10
    },
    {
      name: 'Admin User IDs',
      value: config.admin.userIds,
      required: false,
      test: (val) => Array.isArray(val)
    },
    {
      name: 'Storage Path',
      value: config.storage.path,
      required: true,
      test: (val) => val && typeof val === 'string'
    },
    {
      name: 'Environment',
      value: config.app.env,
      required: true,
      test: (val) => ['development', 'production'].includes(val)
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    const passed = check.test(check.value);
    const status = passed ? '✅' : '❌';
    const required = check.required ? '(Required)' : '(Optional)';
    
    console.log(`${status} ${check.name} ${required}`);
    
    if (!passed && check.required) {
      allPassed = false;
      console.log(`   Error: Invalid or missing ${check.name.toLowerCase()}`);
    }
  });
  
  console.log('\n📊 Configuration Summary:');
  console.log(`   Environment: ${config.app.env}`);
  console.log(`   Storage Type: ${config.storage.type}`);
  console.log(`   Storage Path: ${config.storage.path}`);
  console.log(`   Admin Users: ${config.admin.userIds.length}`);
  console.log(`   Log Level: ${config.app.logLevel}`);
  
  if (allPassed) {
    console.log('\n🎉 All required configurations are valid!');
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure your bot token is correct');
    console.log('   2. Add your Telegram user ID to ADMIN_USER_IDS');
    console.log('   3. Run: npm start');
    console.log('\n💡 To get your Telegram user ID:');
    console.log('   - Message @userinfobot on Telegram');
    console.log('   - Or use @RawDataBot');
  } else {
    console.log('\n❌ Please fix the configuration errors above');
    process.exit(1);
  }
  
} catch (error) {
  console.log('❌ Configuration error:', error.message);
  console.log('\n🔧 Please check your .env file and try again');
  process.exit(1);
}

// Test file structure
console.log('\n📁 Checking file structure...');

const requiredFiles = [
  'bot.js',
  'app.js',
  'config/index.js',
  'config/constants.js',
  'locales/fa.js',
  'models/User.js',
  'models/Transaction.js',
  'handlers/start.js',
  'handlers/initiate.js',
  'handlers/verification.js',
  'handlers/payment.js',
  'handlers/transfer.js',
  'handlers/buyerVerification.js',
  'handlers/finalVerification.js',
  'handlers/admin.js',
  'middleware/auth.js',
  'middleware/filtering.js',
  'utils/storage.js',
  'utils/textFilter.js',
  'utils/validation.js',
  'utils/timeout.js'
];

let missingFiles = [];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log(`\n❌ Missing ${missingFiles.length} required files`);
  process.exit(1);
} else {
  console.log('\n✅ All required files are present');
}

// Test storage directory creation
console.log('\n💾 Testing storage initialization...');

try {
  const storage = require('./utils/storage');
  console.log('✅ Storage module loaded successfully');
  console.log('✅ Storage directories will be created on first run');
} catch (error) {
  console.log('❌ Storage initialization error:', error.message);
  process.exit(1);
}

console.log('\n🚀 Configuration test completed successfully!');
console.log('\n📚 Documentation: See README.md for detailed setup instructions');
console.log('🆘 Support: Create an issue if you encounter problems');
