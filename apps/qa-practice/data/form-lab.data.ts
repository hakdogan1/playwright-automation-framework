/**
 * Form Lab — the eight forms besides Form Register: login, contact, address, payment, checkout,
 * profile, multi-step and validation-errors. Expectations read from the app source (`form-lab.tsx`,
 * QA Practice revision 3d14d23; identical in the local build d856264). The widget is client-only
 * (no network or storage calls).
 *
 * All values are synthetic and use the reserved `.test` mail domain. The app's own trigger
 * addresses for "locked account" (login) and "email already used" (profile) are on a
 * non-reserved domain; they are deliberately not copied here (privacy gate, OBS-09).
 * No card number is used anywhere: the payment tests check only the rules that can be exercised
 * without one (see TC-PAY.md).
 */

export const LAB_FORM_SUBMIT_DELAY_MS = 360;

export interface LabFormDefinition<F extends string = string> {
  slug: string;
  path: string;
  title: string;
  submitLabel: string;
  /** Field key → the app's field id (test id `<slug>-<id>`). */
  fields: Record<F, string>;
}

const def = <F extends string>(slug: string, title: string, submitLabel: string, fields: Record<F, string>): LabFormDefinition<F> => ({
  slug,
  path: `/ui-elements/${slug}/`,
  title,
  submitLabel,
  fields,
});

export const LOGIN = def('form-login', 'Login Form', 'Sign in', { email: 'email', password: 'password', rememberMe: 'remember-me' });
export const CONTACT = def('form-contact', 'Contact Form', 'Send message', { fullName: 'full-name', email: 'email', subject: 'subject', message: 'message', attachment: 'attachment' });
export const ADDRESS = def('form-address', 'Address Form', 'Save address', {
  line1: 'address-line-1',
  line2: 'address-line-2',
  city: 'city',
  state: 'state',
  postalCode: 'postal-code',
  country: 'country',
  phone: 'phone-number',
});
export const PAYMENT = def('form-payment', 'Payment Form', 'Pay with test card', {
  cardholder: 'cardholder-name',
  cardNumber: 'card-number',
  expiry: 'expiry-date',
  cvv: 'cvv',
  zip: 'billing-zip',
  saveCard: 'save-card',
});
export const CHECKOUT = def('form-checkout', 'Checkout Form', 'Submit order', {
  email: 'customer-email',
  fullName: 'full-name',
  address: 'shipping-address',
  city: 'city',
  paymentMethod: 'payment-method',
  reviewOrder: 'review-order',
  acceptTerms: 'accept-terms',
});
export const PROFILE = def('form-profile', 'Profile Update Form', 'Update profile', {
  displayName: 'display-name',
  email: 'email',
  phone: 'phone',
  language: 'language',
  timezone: 'timezone',
  avatar: 'avatar-upload',
});

export const IDLE_MESSAGE = 'Awaiting submission.';
export const VALIDATING_LABEL = 'Validating...';
export const ERROR_TOAST = 'Error toast: Fix validation errors before submitting.';
export const successToast = (message: string) => `Success toast: ${message}`;
export const issuesMessage = (count: number) => `${count} validation issue${count === 1 ? '' : 's'} found.`;

// ---------- Login ----------
/** The lab's published demo password (shown in the module's own documentation; not a real secret). */
export const LOGIN_DEMO_PASSWORD = 'Password123!';
export const VALID_LOGIN = { email: 'qa.login@example.test', password: LOGIN_DEMO_PASSWORD } as const;
export const LOGIN_MESSAGES = {
  success: (email: string, remember = false) => `Login success for ${email}${remember ? ' with remember me enabled' : ''}.`,
  emptyErrors: ['Email is required.', 'Password is required.', 'Email must be valid.'],
  invalidEmail: 'Email must be valid.',
  invalidPassword: 'Invalid password.',
} as const;

// ---------- Contact ----------
export const VALID_CONTACT = {
  fullName: 'Test Runner',
  email: 'qa.contact@example.test',
  subject: 'Checkout total is blank',
  message: 'The order total stays empty after applying a coupon.',
} as const;
export const CONTACT_MESSAGE_MIN = 20;
export const CONTACT_MESSAGES = {
  success: (file?: string) => `Contact request sent${file ? ` with ${file}` : ''}.`,
  emptyErrors: ['Full Name is required.', 'Email is required.', 'Subject is required.', 'Message is required.', 'Email must be valid.', 'Message must be at least 20 characters.'],
  tooShort: 'Message must be at least 20 characters.',
} as const;

// ---------- Address ----------
export const VALID_ADDRESS = {
  line1: 'Teststrasse 1',
  city: 'Berlin',
  state: 'Berlin',
  postalCode: '10115',
  country: 'DE',
  phone: '0301234567',
} as const;
export const ADDRESS_MESSAGES = {
  success: (city: string, country: string) => `Address saved for ${city}, ${country}.`,
  emptyErrors: [
    'Address Line 1 is required.',
    'City is required.',
    'State is required.',
    'Postal Code is required.',
    'Country is required.',
    'Phone Number is required.',
    'Postal code format is invalid.',
    'Phone Number must be numeric.',
  ],
  postal: 'Postal code format is invalid.',
  phone: 'Phone Number must be numeric.',
} as const;
/** Postal code rule /^[A-Za-z0-9 -]{4,10}$/ and phone rule /^[0-9]{7,15}$/ (data-driven boundaries). */
export const POSTAL_CODES = [
  { value: '123', valid: false },
  { value: '1234', valid: true },
  { value: 'SW1A 1AA', valid: true },
  { value: 'AB-12345-C', valid: true },
  { value: 'AB-12345-CD', valid: false },
  { value: '1234#', valid: false },
] as const;
export const PHONES = [
  { value: '123456', valid: false },
  { value: '1234567', valid: true },
  { value: '123456789012345', valid: true },
  { value: '1234567890123456', valid: false },
  { value: '030 1234567', valid: false },
] as const;

// ---------- Payment (no card numbers) ----------
export const PAYMENT_WARNING = 'Test card data only. Do not enter real card information.';
/** Not a card number: letters only. Every payment test uses it, so the card rule always reports. */
export const NOT_A_CARD = 'abcd efgh ijkl mnop';
export const PAYMENT_BASE = { cardholder: 'Test Runner', cardNumber: NOT_A_CARD, expiry: '12/30', cvv: '123', zip: '10115' } as const;
export const PAYMENT_MESSAGES = {
  emptyErrors: [
    'Cardholder Name is required.',
    'Card Number is required.',
    'Expiry Date is required.',
    'Cvv is required.',
    'Billing Zip is required.',
    'Card number format is invalid.',
    'Expiry Date is required and must be future MM/YY.',
    'CVV length is invalid.',
  ],
  cardFormat: 'Card number format is invalid.',
  expiry: 'Expiry Date is required and must be future MM/YY.',
  cvv: 'CVV length is invalid.',
} as const;
/** Expiry rule /^(0[1-9]|1[0-2])\/(2[6-9]|[3-9][0-9])$/ (format and year only). */
export const EXPIRIES = [
  { value: '12/30', valid: true },
  { value: '1/30', valid: false },
  { value: '13/30', valid: false },
  { value: '00/30', valid: false },
  { value: '12/25', valid: false },
  { value: '12-30', valid: false },
] as const;
export const CVVS = [
  { value: '12', valid: false },
  { value: '123', valid: true },
  { value: '1234', valid: true },
  { value: '12345', valid: false },
  { value: '12a', valid: false },
] as const;

// ---------- Checkout ----------
export const VALID_CHECKOUT = {
  email: 'qa.checkout@example.test',
  fullName: 'Test Runner',
  address: 'Teststrasse 1',
  city: 'Berlin',
  paymentMethod: 'test-success',
  reviewOrder: true,
  acceptTerms: true,
} as const;
export const CHECKOUT_MESSAGES = {
  success: 'Order submitted successfully. Confirmation VL-2042 is ready.',
  emptyErrors: [
    'Customer Email is required.',
    'Full Name is required.',
    'Shipping Address is required.',
    'City is required.',
    'Payment Method is required.',
    'Customer Email must be valid.',
    'Review order must be confirmed.',
    'Terms not accepted.',
  ],
  declined: 'Declined payment blocks checkout.',
  review: 'Review order must be confirmed.',
  terms: 'Terms not accepted.',
} as const;

// ---------- Profile ----------
export const VALID_PROFILE = { displayName: 'Test Runner', email: 'qa.profile@example.test', phone: '0301234567', language: 'de', timezone: 'Europe/Berlin' } as const;
export const PROFILE_MESSAGES = {
  success: (file?: string) => `Profile updated${file ? ` with ${file}` : ''}.`,
  invalidEmail: 'Email must be valid.',
  invalidPhone: 'Invalid phone.',
  fileType: 'Upload invalid file type.',
} as const;

// ---------- Multi-step ----------
export const WIZARD_STEPS = ['Personal Info', 'Address', 'Preferences', 'Review', 'Submit'] as const;
export const wizardProgress = (index: number) => `Step ${index + 1} of ${WIZARD_STEPS.length}: ${WIZARD_STEPS[index] ?? ''}`;
export const VALID_WIZARD = { firstName: 'Test', email: 'qa.wizard@example.test', address: 'Teststrasse 1', city: 'Berlin' } as const;
export const WIZARD_MESSAGES = {
  incomplete: 'Complete required fields before continuing.',
  valid: 'Step is valid. Continue when ready.',
  ready: 'Ready to submit the completed wizard.',
  done: 'Multi-step form submitted successfully.',
  step1Errors: ['First Name is required.', 'Email must be valid.'],
  step2Errors: ['Address is required.', 'City is required.'],
} as const;

// ---------- Validation errors ----------
export const VALIDATION_CASES = [
  { id: 'empty-submit', label: 'Empty submit', message: 'Required fields are missing.' },
  { id: 'invalid-email', label: 'Invalid email', message: 'Invalid email format.' },
  { id: 'short-password', label: 'Short password', message: 'Password is shorter than 8 characters.' },
  { id: 'mismatched-passwords', label: 'Mismatched passwords', message: 'Passwords do not match.' },
  { id: 'invalid-phone', label: 'Invalid phone', message: 'Phone number must be numeric.' },
  { id: 'expired-card', label: 'Expired card', message: 'Expired card cannot be used.' },
  { id: 'invalid-cvv', label: 'Invalid CVV', message: 'Invalid CVV length.' },
  { id: 'unchecked-terms', label: 'Unchecked terms', message: 'Terms checkbox is required.' },
  { id: 'server-error', label: 'Server error simulation', message: 'Server error simulation: 500 response, retry allowed.' },
] as const;
export const VALIDATION_IDLE = 'Choose a negative scenario.';
