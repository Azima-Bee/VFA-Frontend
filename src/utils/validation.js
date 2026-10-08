export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return 'Email is required.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address.';
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password || !password.trim()) {
    return 'Password is required.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || !confirmPassword.trim()) {
    return 'Confirm password is required.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
};

export const validateFullName = (name) => {
  if (!name || !name.trim()) {
    return 'Full Name is required.';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters.';
  }
  return null;
};

export const validateUniversity = (uni) => {
  if (!uni || !uni.trim()) {
    return 'College/University is required.';
  }
  return null;
};

export const validateCourse = (course) => {
  if (!course || !course.trim()) {
    return 'Course is required.';
  }
  return null;
};

export const validateYearOfStudy = (year) => {
  if (!year || !year.trim()) {
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
