// Common weak passwords to block
const COMMON_PASSWORDS = [
  'password',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty',
  'qwerty123',
  'abc123',
  'letmein',
  'welcome',
  'admin',
  'monkey',
  '1234567',
  'sunshine',
  'princess',
  'football',
  'iloveyou',
  'master',
  'hello',
  'freedom',
  'whatever',
  'qazwsx',
  'trustno1',
  'dragon',
  'baseball',
  'superman',
  'michael',
  'shadow',
  'jennifer',
  'hunter',
  'buster',
  'soccer',
  'harley',
  'batman',
  'andrew',
  'tigger',
  'charlie',
  'robert',
  'thomas',
  'hockey',
  'ranger',
  'daniel',
  'hannah',
  'maggie',
  'jessica',
  'michelle',
  'chocolate',
  'jordan',
  'summer',
  'winter',
  'spring',
  'autumn'
];

/**
 * Check if password contains repeating characters (e.g., "aaaaaa", "111111")
 */
function hasRepeatingChars(password) {
  if (password.length < 3) return false;
  
  // Check for sequences of 3+ identical characters
  for (let i = 0; i < password.length - 2; i++) {
    if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
      return true;
    }
  }
  
  // Check for patterns like "aaaaaa" (all same character)
  const firstChar = password[0];
  if (password.split('').every(char => char === firstChar)) {
    return true;
  }
  
  return false;
}

/**
 * Check if password contains sequential characters (e.g., "123456", "abcdef")
 */
function hasSequentialChars(password) {
  if (password.length < 3) return false;
  
  const lowerPassword = password.toLowerCase();
  
  for (let i = 0; i < lowerPassword.length - 2; i++) {
    const char1 = lowerPassword.charCodeAt(i);
    const char2 = lowerPassword.charCodeAt(i + 1);
    const char3 = lowerPassword.charCodeAt(i + 2);
    
    // Check for sequential numbers or letters
    if (
      (char2 === char1 + 1 && char3 === char2 + 1) ||
      (char2 === char1 - 1 && char3 === char2 - 1)
    ) {
      // Check if the sequence continues for at least 4 characters
      let sequenceLength = 3;
      for (let j = i + 3; j < lowerPassword.length; j++) {
        const nextChar = lowerPassword.charCodeAt(j);
        const expectedChar = lowerPassword.charCodeAt(j - 1) + (char2 - char1);
        if (nextChar === expectedChar) {
          sequenceLength++;
        } else {
          break;
        }
      }
      if (sequenceLength >= 4) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Calculate password strength score (0-100)
 */
function calculateStrengthScore(password) {
  let score = 0;
  
  // Length scoring (max 25 points)
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 5;
  
  // Character variety scoring (max 40 points)
  if (/[a-z]/.test(password)) score += 10; // lowercase
  if (/[A-Z]/.test(password)) score += 10; // uppercase
  if (/[0-9]/.test(password)) score += 10; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) score += 10; // special chars
  
  // Complexity scoring (max 20 points)
  const varietyCount = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password)
  ].filter(Boolean).length;
  
  if (varietyCount >= 3) score += 10;
  if (varietyCount === 4) score += 10;
  
  // Pattern penalty (max -35 points)
  if (hasRepeatingChars(password)) score -= 20;
  if (hasSequentialChars(password)) score -= 15;
  
  // Common password penalty
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    score = 0;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Validate password and return detailed validation result
 */
function validatePassword(password) {
  const errors = [];
  
  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
    return { isValid: false, errors };
  }
  
  // Check for common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('This password is too common and easily guessable. Please choose a more unique password.');
    return { isValid: false, errors };
  }
  
  // Check for repeating characters
  if (hasRepeatingChars(password)) {
    errors.push('Password contains too many repeating characters (e.g., "aaaaaa", "111111"). Please use more varied characters.');
    return { isValid: false, errors };
  }
  
  // Check for sequential characters
  if (hasSequentialChars(password)) {
    errors.push('Password contains sequential characters (e.g., "123456", "abcdef"). Please avoid predictable patterns.');
    return { isValid: false, errors };
  }
  
  // Calculate strength score
  const score = calculateStrengthScore(password);
  
  // Check minimum strength (must be at least 30)
  if (score < 30) {
    errors.push('Password is too weak. Please include a mix of uppercase letters, lowercase letters, numbers, and special characters.');
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors };
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const errors = [];
  
  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
    return { isValid: false, errors };
  }
  
  // Check for common email issues
  if (email.includes('..')) {
    errors.push('Email cannot contain consecutive dots');
    return { isValid: false, errors };
  }
  
  if (email.startsWith('.') || email.endsWith('.')) {
    errors.push('Email cannot start or end with a dot');
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors };
}

/**
 * Validate display name
 */
function validateDisplayName(displayName) {
  const errors = [];
  
  if (!displayName || displayName.trim().length === 0) {
    errors.push('Display name is required');
    return { isValid: false, errors };
  }
  
  if (displayName.trim().length < 2) {
    errors.push('Display name must be at least 2 characters long');
    return { isValid: false, errors };
  }
  
  if (displayName.trim().length > 50) {
    errors.push('Display name must be no more than 50 characters long');
    return { isValid: false, errors };
  }
  
  // Check for only whitespace
  if (displayName.trim().length === 0) {
    errors.push('Display name cannot be only whitespace');
    return { isValid: false, errors };
  }
  
  return { isValid: true, errors };
}

module.exports = {
  validatePassword,
  validateEmail,
  validateDisplayName
};



