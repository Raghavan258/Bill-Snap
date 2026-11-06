export type RegistrationInput = {
  fullName: string;
  mobile: string;
  password: string;
  confirmPassword: string;
};

export type FieldErrors = Record<string, string>;

const MOBILE = /^[0-9]{10,15}$/;

/** Checks a local registration form. This does not contact a server or send an SMS. */
export function validateRegistration(input: RegistrationInput): FieldErrors {
  const errors: FieldErrors = {};
  if (input.fullName.trim().length < 2) errors.fullName = 'Enter your full name.';
  if (!MOBILE.test(input.mobile.trim())) errors.mobile = 'Enter a mobile number of 10 to 15 digits.';
  if (input.password.length < 6) errors.password = 'Use at least 6 characters.';
  if (input.password !== input.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

/** Checks the local sign-in form. */
export function validateLogin(input: { mobile: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!MOBILE.test(input.mobile.trim())) errors.mobile = 'Enter the mobile number you registered.';
  if (input.password.length === 0) errors.password = 'Enter your password.';
  return errors;
}
