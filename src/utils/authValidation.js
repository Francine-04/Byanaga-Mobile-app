export const passwordRuleText = 'Use 8-15 characters with 1 uppercase letter, 1 number, and 1 special character.';
export const incorrectLoginMessage = 'Incorrect email or password.';

export function sanitizeAgeInput(value) {
  return String(value || '').replace(/[^0-9]/g, '').slice(0, 3);
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isGmailAddress(value) {
  return /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@gmail\.com$/.test(normalizeEmail(value));
}

export function isStrongPassword(value) {
  const password = String(value || '');
  return (
    password.length >= 8 &&
    password.length <= 15 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export function validateRegistrationProfile(form) {
  const errors = {};
  const firstName = String(form.firstName || '').trim();
  const lastName = String(form.lastName || '').trim();
  const ageText = sanitizeAgeInput(form.age);
  const age = Number(ageText);
  const email = normalizeEmail(form.email);
  const password = String(form.password || '');
  const confirmPassword = String(form.confirmPassword || '');

  if (!firstName) errors.firstName = 'First name is required.';
  if (!lastName) errors.lastName = 'Last name is required.';
  if (!ageText) errors.age = 'Age is required.';
  else if (!Number.isInteger(age) || age < 1 || age > 120) errors.age = 'Enter a valid age from 1 to 120.';
  if (!form.gender) errors.gender = 'Select MALE or FEMALE.';
  if (!form.nationality) errors.nationality = 'Select your nationality.';
  if (!email) errors.email = 'Gmail address is required.';
  else if (!isGmailAddress(email)) errors.email = 'Use a valid Gmail address ending in @gmail.com.';
  if (!password) errors.password = 'Password is required.';
  else if (!isStrongPassword(password)) errors.password = passwordRuleText;
  if (!confirmPassword) errors.confirmPassword = 'Confirm your password.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';

  return errors;
}

export function validateLoginForm({ email, password }) {
  const errors = {};
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) errors.email = 'Gmail address is required.';
  else if (!isGmailAddress(normalizedEmail)) errors.email = 'Use the Gmail address you registered with.';
  if (!password) errors.password = 'Password is required.';

  return errors;
}

export function validatePreferenceForm(preferences) {
  const errors = [];
  if (!preferences?.places?.length) errors.push('Choose at least one place type.');
  if (!preferences?.activities?.length) errors.push('Choose at least one activity.');
  if (!preferences?.travelStyle) errors.push('Choose a travel style.');
  if (!preferences?.budget) errors.push('Choose a budget.');
  if (!preferences?.duration) errors.push('Choose a trip duration.');
  return errors;
}

export function buildRegistrationProfile(form) {
  const firstName = String(form.firstName || '').trim();
  const lastName = String(form.lastName || '').trim();
  const email = normalizeEmail(form.email);

  return {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    age: Number(sanitizeAgeInput(form.age)),
    gender: form.gender,
    nationality: form.nationality,
    email,
    image: null,
  };
}

export function getFirebaseAuthMessage(error) {
  const code = error?.code || '';

  if (code.includes('email-already-in-use')) return 'This Gmail address is already registered. Please log in instead.';
  if (code.includes('invalid-email')) return 'Enter a valid Gmail address.';
  if (code.includes('invalid-credential') || code.includes('user-not-found') || code.includes('wrong-password')) return incorrectLoginMessage;
  if (code.includes('weak-password')) return passwordRuleText;
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a moment and try again.';
  if (code.includes('network-request-failed')) return 'Check your internet connection and try again.';
  if (code.includes('operation-not-allowed')) return 'Email and password sign-in is not enabled in Firebase.';
  if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) return 'Sign-in was cancelled.';
  if (code.includes('account-exists-with-different-credential')) return 'This email is already registered using another sign-in method.';
  if (code.includes('unauthorized-domain')) return 'This app domain is not authorized in Firebase Authentication.';
  if (code.includes('provider-already-linked')) return 'This sign-in provider is already linked to the account.';
  if (code.includes('invalid-oauth-provider')) return 'Unable to verify this social sign-in. Please try again.';

  return error?.message || 'Authentication failed. Please try again.';
}
