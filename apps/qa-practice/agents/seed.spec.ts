import { test, expect } from '../fixtures';

/**
 * Seed for Playwright Test Agents (planner / generator / healer).
 * Agents run this test to get a page. Because it uses the QA Practice
 * fixtures, the agent's browser runs behind the production guard:
 * no writes, no Supabase, analytics stubbed.
 *
 * Project: qa-practice-agent-seed (not run by default).
 */
test('seed', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/QA Practice/);
});
