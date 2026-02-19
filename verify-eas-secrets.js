#!/usr/bin/env node

/**
 * Script to verify all required EAS secrets are set
 * Run: node verify-eas-secrets.js
 */

const { execSync } = require('child_process');

const REQUIRED_SECRETS = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY',
  'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY',
  'EXPO_PUBLIC_GEMINI_API_KEY',
];

console.log('🔍 Checking EAS secrets...\n');

try {
  const output = execSync('eas secret:list', { encoding: 'utf-8' });
  
  // Parse the text output to extract secret names
  // Format: "Name        EXPO_PUBLIC_..."
  const lines = output.split('\n');
  const secretNames = [];
  
  for (const line of lines) {
    // Match lines like "Name        EXPO_PUBLIC_FIREBASE_API_KEY"
    const match = line.match(/Name\s+([A-Z_][A-Z0-9_]*)/);
    if (match && match[1].startsWith('EXPO_PUBLIC_')) {
      secretNames.push(match[1]);
    }
  }
  
  const missing = REQUIRED_SECRETS.filter(name => !secretNames.includes(name));
  const found = REQUIRED_SECRETS.filter(name => secretNames.includes(name));
  
  console.log(`✅ Found ${found.length}/${REQUIRED_SECRETS.length} required secrets:\n`);
  found.forEach(name => {
    console.log(`   ✓ ${name}`);
  });
  
  if (missing.length > 0) {
    console.log(`\n❌ Missing ${missing.length} required secrets:\n`);
    missing.forEach(name => {
      console.log(`   ✗ ${name}`);
    });
    console.log('\n⚠️  Run: eas secret:create --name <SECRET_NAME> --type string');
    process.exit(1);
  } else {
    console.log('\n✅ All required secrets are configured!');
    process.exit(0);
  }
} catch (error) {
  console.error('❌ Error checking secrets:', error.message);
  console.log('\n💡 Make sure you are logged in: eas login');
  process.exit(1);
}

