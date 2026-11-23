import type { Locator } from '@playwright/test';

export type PasswordRuleId = 'length' | 'number' | 'upper' | 'lower' | 'special';
export type RuleState = 'idle' | 'ok' | 'fail';

/** Live password checklist under the password field. */
export class PasswordRules {
  constructor(private readonly root: Locator) {}

  rule(id: PasswordRuleId): Locator {
    return this.root.getByTestId(`input-password-req-${id}`);
  }

  /** Current state of every rule, read from the `data-state` attribute. */
  async states(): Promise<Record<PasswordRuleId, RuleState>> {
    const ids: PasswordRuleId[] = ['length', 'number', 'upper', 'lower', 'special'];
    const entries = await Promise.all(ids.map(async (id) => [id, (await this.rule(id).getAttribute('data-state')) as RuleState] as const));
    return Object.fromEntries(entries) as Record<PasswordRuleId, RuleState>;
  }
}
