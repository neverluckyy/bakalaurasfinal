#!/usr/bin/env node

/**
 * Generate a secure random JWT secret
 * Usage: node generate-jwt-secret.js
 */

const crypto = require('crypto');

// Generate a 64-byte (128 hex characters) random secret
const secret = crypto.randomBytes(64).toString('hex');

console.log('='.repeat(80));
console.log('Generated JWT Secret:');
console.log('='.repeat(80));
console.log(secret);
console.log('='.repeat(80));
console.log('\nCopy this value and set it as JWT_SECRET in your Railway environment variables.');
console.log('⚠️  Keep this secret secure and never commit it to git!\n');

