#!/usr/bin/env node

// Network connectivity test for Telegram API
require('dotenv').config();
const https = require('https');
const http = require('http');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.log('❌ BOT_TOKEN not found in .env file');
  process.exit(1);
}

console.log('🔧 Testing Telegram API connectivity...\n');

// Test 1: Basic HTTPS request
function testHTTPS() {
  return new Promise((resolve, reject) => {
    console.log('1️⃣ Testing HTTPS connection to api.telegram.org...');
    
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/getMe`,
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.ok) {
            console.log('✅ HTTPS connection successful!');
            console.log(`   Bot: ${result.result.first_name} (@${result.result.username})`);
            resolve(result);
          } else {
            console.log('❌ API returned error:', result.description);
            reject(new Error(result.description));
          }
        } catch (error) {
          console.log('❌ Invalid JSON response');
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ HTTPS connection failed:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.log('❌ HTTPS connection timed out');
      req.destroy();
      reject(new Error('Connection timeout'));
    });

    req.end();
  });
}

// Test 2: Alternative API endpoints
function testAlternativeEndpoints() {
  const endpoints = [
    'api.telegram.org',
    'api.telegram.me',
    'telegram.org'
  ];

  console.log('\n2️⃣ Testing alternative endpoints...');
  
  endpoints.forEach(endpoint => {
    const options = {
      hostname: endpoint,
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      console.log(`✅ ${endpoint}: ${res.statusCode}`);
    });

    req.on('error', (error) => {
      console.log(`❌ ${endpoint}: ${error.message}`);
    });

    req.on('timeout', () => {
      console.log(`⏰ ${endpoint}: timeout`);
      req.destroy();
    });

    req.end();
  });
}

// Test 3: Check proxy settings
function checkProxySettings() {
  console.log('\n3️⃣ Checking proxy settings...');
  
  const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy'];
  let proxyFound = false;
  
  proxyVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ${varName}: ${value}`);
      proxyFound = true;
    }
  });
  
  if (!proxyFound) {
    console.log('   No proxy settings detected');
  }
}

// Test 4: DNS resolution
function testDNS() {
  console.log('\n4️⃣ Testing DNS resolution...');
  
  const dns = require('dns');
  
  dns.lookup('api.telegram.org', (err, address, family) => {
    if (err) {
      console.log('❌ DNS lookup failed:', err.message);
    } else {
      console.log(`✅ DNS resolved: ${address} (IPv${family})`);
      
      // Check if it's a private IP (might indicate filtering)
      if (address.startsWith('10.') || address.startsWith('192.168.') || address.startsWith('172.')) {
        console.log('⚠️  Warning: Resolved to private IP - possible DNS filtering');
      }
    }
  });
}

// Main test function
async function runTests() {
  try {
    checkProxySettings();
    testDNS();
    testAlternativeEndpoints();
    
    // Wait a bit for other tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n🔍 Testing bot API...');
    await testHTTPS();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Your bot should work fine. Try starting it with:');
    console.log('   node app.js');
    
  } catch (error) {
    console.log('\n❌ Connectivity test failed');
    console.log('\n🔧 Possible solutions:');
    console.log('   1. Check your internet connection');
    console.log('   2. Try using a VPN if Telegram is blocked in your region');
    console.log('   3. Configure proxy settings if behind corporate firewall');
    console.log('   4. Try running the bot from a different network');
    console.log('\n💡 If you\'re in Iran, China, or other restricted regions:');
    console.log('   - Use a reliable VPN service');
    console.log('   - Try different VPN servers');
    console.log('   - Consider using proxy settings');
  }
}

// Run the tests
runTests();
