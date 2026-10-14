/**
 * Email validation:
 * - Rejects empty or whitespace-only inputs
 * - Validates standard RFC-compliant email structure
 * - Requires valid username, @ symbol, domain, and TLD
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return 'Email address is required.';
  }
  const cleanEmail = email.trim();
  // Standard email format regex: user@domain.tld
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleanEmail)) {
    return 'Please enter a valid email address (e.g. name@university.edu).';
  }
  return null;
};

/**
 * Login password validation:
 * - Requires password to not be empty
 * - Does NOT enforce registration complexity rules so existing accounts remain accessible
 */
export const validateLoginPassword = (password) => {
  if (!password || typeof password !== 'string' || !password) {
    return 'Password is required.';
  }
  return null;
};

/**
 * Registration & password creation complexity validation:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 */
export const validateRegistrationPassword = (password) => {
  if (!password || typeof password !== 'string' || !password) {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter (A-Z).';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter (a-z).';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number (0-9).';
  }
  return null;
};

/**
 * Unified validatePassword helper for backward compatibility
 */
export const validatePassword = (password, isLogin = false) => {
  if (isLogin) {
    return validateLoginPassword(password);
  }
  return validateRegistrationPassword(password);
};

/**
 * Confirm password validation:
 * - Requires confirmation string
 * - Ensures exact match with original password
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || typeof confirmPassword !== 'string' || !confirmPassword) {
    return 'Please confirm your password.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
};

export const validateFullName = (name) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'Full Name is required.';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters.';
  }
  return null;
};

export const validateUniversity = (uni) => {
  if (!uni || typeof uni !== 'string' || !uni.trim()) {
    return 'College/University is required.';
  }
  return null;
};

export const validateCourse = (course) => {
  if (!course || typeof course !== 'string' || !course.trim()) {
    return 'Course is required.';
  }
  return null;
};

export const validateYearOfStudy = (year) => {
  if (!year || typeof year !== 'string' || !year.trim()) {
    return 'Year of Study is required.';
  }
  return null;
};

export const validateRequiredText = (val, fieldName) => {
  if (!val || !val.toString().trim()) {
    return `${fieldName} is required.`;
  }
  return null;
};
