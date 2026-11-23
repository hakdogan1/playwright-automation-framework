import type { PasswordRuleId } from '../components/password-rules.component';

/**
 * Synthetic data only. Emails use the reserved .test TLD (RFC 2606),
 * so nothing here can belong to a real person.
 */
export const VALID_CREDENTIALS = { email: 'qa.user@example.test', password: 'Strong#Pass1' } as const;

export const INVALID_EMAILS = [
  { label: 'missing @', value: 'qa.user.example.test' },
  { label: 'missing domain dot', value: 'qa.user@example' },
  { label: 'contains a space', value: 'qa user@example.test' },
  { label: 'whitespace only', value: '   ' },
] as const;

/** Each password breaks exactly one rule; all other rules pass. */
export const PASSWORD_SINGLE_RULE_FAILURES: { rule: PasswordRuleId; value: string }[] = [
  { rule: 'length', value: 'Abcde1!' }, // 7 characters: one below the boundary
  { rule: 'number', value: 'Abcdefg!' },
  { rule: 'upper', value: 'abcdef1!' },
  { rule: 'lower', value: 'ABCDEF1!' },
  { rule: 'special', value: 'Abcdefg1' },
];

/** Exactly 8 characters: the minimum length boundary. */
export const PASSWORD_AT_MIN_LENGTH = 'Abcdef1!';
