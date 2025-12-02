// Shared validation helpers for email and password
export const validateEmailAddress = (rawEmail: string): string | null => {
  const email = rawEmail.trim();

  // 1. Required
  if (!email) {
    return 'Email is required';
  }

  // 5. No spaces allowed
  if (/\s/.test(email)) {
    return 'Email cannot contain spaces';
  }

  // 6. Max length 254 characters
  if (email.length > 254) {
    return 'Email must be at most 254 characters long';
  }

  // Email must start with a letter
  if (!/^[A-Za-z]/.test(email)) {
    return 'Your email address needs to start with a letter';
  }

  // Only allowed characters: letters, numbers, ., -, _, + and @ separator
  if (!/^[A-Za-z0-9._+-@]+$/.test(email)) {
    return 'Email contains invalid characters (allowed: letters, numbers, ".", "-", "_", "+")';
  }

  // Cannot start or end with a dot
  if (email.startsWith('.') || email.endsWith('.')) {
    return 'Email cannot start or end with a dot';
  }

  // Must contain exactly one "@"
  const atMatches = email.match(/@/g) ?? [];
  if (atMatches.length !== 1) {
    return 'Email must contain exactly one "@" symbol';
  }

  const [localPart, domainPart] = email.split('@');

  // Local part max 64 characters
  if (!localPart || localPart.length > 64) {
    return 'The part before "@" must not exceed 64 characters';
  }

  // Domain part max 255 characters
  if (!domainPart || domainPart.length > 255) {
    return 'The part after "@" must not exceed 255 characters';
  }

  // At least one "." after "@"
  if (!domainPart.includes('.')) {
    return 'Email domain must contain at least one "." after "@"';
  }

  // Domain extension (TLD) at least 2 characters
  const lastDotIndex = domainPart.lastIndexOf('.');
  const tld = lastDotIndex >= 0 ? domainPart.slice(lastDotIndex + 1) : '';
  if (!tld || tld.length < 2) {
    return 'Domain extension must be at least 2 characters (e.g. .com, .pk)';
  }

  // Basic regex format check
  const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicEmailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return null;
};

// Shared password strength validator
export const validatePasswordStrength = (password: string): string | null => {
  const pwd = password;

  // No spaces allowed
  if (/\s/.test(pwd)) {
    return 'Password cannot contain spaces';
  }

  const hasMinLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

  if (!hasMinLength) {
    return 'Password must be at least 8 characters long.';
  }
  if (!hasUpper) {
    return 'Password must include at least 1 uppercase letter (A-Z).';
  }
  if (!hasLower) {
    return 'Password must include at least 1 lowercase letter (a-z).';
  }
  if (!hasNumber) {
    return 'Password must include at least 1 number (0-9).';
  }
  if (!hasSpecial) {
    return 'Password must include at least 1 special character (e.g. !@#$).';
  }

  return null;
};


