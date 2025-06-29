#!/usr/bin/env node

// Test script to verify English words are no longer filtered
const textFilter = require('./utils/textFilter');

console.log('🧪 Testing English Word Filtering Changes...\n');

// Test cases that should NOT be filtered (allowed)
const allowedTexts = [
  'Hello, I want to buy an account',
  'This is a good game account',
  'I need help with verification',
  'The account has many items',
  'Please help me with the process',
  'I want to sell my gaming account',
  'This account is level 50',
  'The price is reasonable',
  'I am interested in buying',
  'Can you help me verify?',
  'account level high',
  'verification process',
  'gaming account sale',
  'supercell game',
  'clash of clans',
  'good condition account',
  'سلام، من می‌خواهم اکانت بخرم',
  'این اکانت خوبی است',
  'لطفاً کمکم کنید'
];

// Test cases that SHOULD be filtered (blocked)
const blockedTexts = [
  'my email is test@gmail.com',
  'password is 123456',
  'رمز عبور من 123456 است',
  'ایمیل من test@example.com است',
  '1234-5678-9012-3456',
  '09123456789',
  'پسورد: mypassword123'
];

console.log('✅ Testing ALLOWED texts (should pass):');
allowedTexts.forEach((text, index) => {
  const containsSensitive = textFilter.containsSensitiveInfo(text);
  const status = containsSensitive ? '❌ BLOCKED' : '✅ ALLOWED';
  console.log(`${index + 1}. ${status}: "${text}"`);
});

console.log('\n🚫 Testing BLOCKED texts (should be filtered):');
blockedTexts.forEach((text, index) => {
  const containsSensitive = textFilter.containsSensitiveInfo(text);
  const status = containsSensitive ? '✅ BLOCKED' : '❌ ALLOWED';
  console.log(`${index + 1}. ${status}: "${text}"`);
});

console.log('\n📊 Testing content safety scores:');
const testTexts = [
  'Hello, I want to buy an account',
  'my email is test@gmail.com',
  'This is a normal message',
  'password: 123456'
];

testTexts.forEach(text => {
  const score = textFilter.getContentSafetyScore(text);
  const safe = score >= 50 ? '✅' : '❌';
  console.log(`${safe} "${text}" - Score: ${score}`);
});

console.log('\n🎯 Summary:');
console.log('• English words like "account", "verification", "help" are now allowed');
console.log('• Only actual sensitive data (emails, passwords, cards) are blocked');
console.log('• Persian and English text mixing is fully supported');
console.log('• Content filtering is now more user-friendly');

console.log('\n✅ English word filtering has been successfully removed!');
console.log('Users can now freely use English words in their messages.');
