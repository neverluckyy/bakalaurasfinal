// Generate a secure JWT secret for production
// Run: node generate-jwt-secret.js

const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex');
console.log('\n=== JWT Secret Generated ===');
console.log(secret);
console.log('\nCopy this value and use it as JWT_SECRET in your backend environment variables.\n');

