/**
 * Form Register (/ui-elements/form-register/) — expectations read from the app source
 * (`form-lab.tsx`, QA Practice revision 3d14d23; identical in the local build d856264).
 * All values are synthetic: no real person, a reserved `.test` mail domain, no real password.
 */

export interface Registration {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  /** Option value of the Country select ('' = "Select country"). */
  country: string;
  terms: boolean;
}

/** Validation runs in a `setTimeout` of this many ms after submit. */
export const REGISTER_SUBMIT_DELAY_MS = 360;

export const REGISTER_LABELS = {
  submit: 'Create account',
  loading: 'Validating...',
  idleMessage: 'Awaiting submission.',
} as const;

export const VALID_REGISTRATION: Registration = {
  firstName: 'Test',
  lastName: 'Runner',
  username: 'qa_runner_01',
  email: 'qa.runner@example.test',
  password: 'Passw0rd!',
  confirmPassword: 'Passw0rd!',
  country: 'DE',
  terms: true,
};

export const successMessage = (username: string) => `Registration success for ${username}.`;
export const issuesMessage = (count: number) => `${count} validation issue${count === 1 ? '' : 's'} found.`;

export const REGISTER_ERRORS = {
  firstName: 'First Name is required.',
  lastName: 'Last Name is required.',
  username: 'Username is required.',
  email: 'Email is required.',
  password: 'Password is required.',
  confirmPassword: 'Confirm Password is required.',
  country: 'Country is required.',
  emailFormat: 'Email must be a valid email address.',
  passwordLength: 'Password must be at least 8 characters.',
  passwordMatch: 'Passwords must match.',
  terms: 'Terms checkbox is required.',
} as const;

/**
 * Empty form, in the app's validation order. Empty passwords are equal, so there is no
 * "Passwords must match." error; the email format rule fires on the empty email as well.
 */
export const EMPTY_FORM_ERRORS = [
  REGISTER_ERRORS.firstName,
  REGISTER_ERRORS.lastName,
  REGISTER_ERRORS.username,
  REGISTER_ERRORS.email,
  REGISTER_ERRORS.password,
  REGISTER_ERRORS.confirmPassword,
  REGISTER_ERRORS.country,
  REGISTER_ERRORS.emailFormat,
  REGISTER_ERRORS.passwordLength,
  REGISTER_ERRORS.terms,
] as const;

/** Rejected by the app's EMAIL_RE /^[^\s@]+@[^\s@]+\.[^\s@]+$/. */
export const INVALID_EMAILS = ['qa.runner', 'qa.runner@example', 'qa runner@example.test', 'qa.runner@@example.test'] as const;
