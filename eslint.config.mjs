import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

const NETWORK_BYPASS = [
  { property: 'route', message: 'Use guard.mock() — raw routes can bypass the production guard.' },
  { property: 'routeFromHAR', message: 'Use guard.mock() — raw routes can bypass the production guard.' },
  { property: 'routeWebSocket', message: 'WebSocket routing belongs to core/guard.' },
  { property: 'unrouteAll', message: 'Removing routes would remove the production guard.' },
  { property: 'newContext', message: 'Use the page/context/request fixtures so the guard is applied.' },
];

// `page.request` / `context.request` are guarded at runtime too; the rule keeps API calls on the
// `request` fixture so reviews see one API entry point.
const UNGUARDED_SYNTAX = [
  { selector: "MemberExpression[property.name='request'][object.type!='ThisExpression']", message: 'Use the `request` fixture for API calls (page.request / context.request are discouraged).' },
  { selector: "CallExpression[callee.property.name='newPage'][callee.object.name='browser']", message: 'Use the `page` fixture; pages created from `browser` need explicit review.' },
];
const UNGUARDED_IMPORTS = [
  { name: '@playwright/test', importNames: ['chromium', 'firefox', 'webkit', 'request', '_electron', '_android'], message: 'Launching browsers or API clients directly bypasses fixtures and the guard.' },
];

export default tseslint.config(
  { ignores: ['node_modules/**', 'reports/**', 'evidence/**', 'test-results/**', 'playwright-report/**', 'framework-tests/fixtures/reporter-project/samples.spec.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: { allowDefaultProject: ['eslint.config.mjs'] }, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-empty-pattern': 'off', // Playwright fixtures use `async ({}, use) => …`
    },
  },
  {
    files: ['eslint.config.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // Reusable core must never depend on an application.
    files: ['core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['**/apps/**'], message: 'core/ must not import from apps/.' }] }],
    },
  },
  {
    files: ['apps/**/*.ts', 'framework-tests/**/*.spec.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-skipped-test': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/expect-expect': ['error', { assertFunctionNames: ['expect', 'expect.poll'] }],
      'playwright/no-conditional-in-test': 'error',
    },
  },
  {
    // Application code may not bypass the guard. This is a code-review aid, not network security:
    // the runtime guard (core/guard) is what actually blocks requests.
    files: ['apps/**/*.ts'],
    rules: {
      'no-restricted-properties': ['error', ...NETWORK_BYPASS.map((r) => ({ object: undefined, ...r }))],
      'no-restricted-syntax': ['error', ...UNGUARDED_SYNTAX],
      'no-restricted-imports': ['error', { paths: UNGUARDED_IMPORTS, patterns: [{ group: ['playwright', 'playwright-core', 'playwright/*', 'playwright-core/*'], message: 'Use @playwright/test fixtures so the guard applies.' }] }],
    },
  },
  {
    // Page and component objects expose locators and actions; assertions live in specs.
    // Readiness waits (support/ready.ts, goto()) are the documented exception.
    files: ['apps/**/components/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...UNGUARDED_IMPORTS,
            { name: '@playwright/test', importNames: ['expect'], message: 'Components do not assert. Return locators or state; assert in the spec.' },
          ],
          patterns: [
            { group: ['playwright', 'playwright-core', 'playwright/*', 'playwright-core/*'], message: 'Use @playwright/test fixtures so the guard applies.' },
            { group: ['**/fixtures', '**/core/fixtures', '**/core/fixtures/*'], importNames: ['expect'], message: 'Components do not assert.' },
          ],
        },
      ],
    },
  },
  {
    // Self-tests deliberately exercise failures (test.fail) and conditional fixtures.
    files: ['framework-tests/**/*.ts'],
    rules: {
      'playwright/no-conditional-in-test': 'off',
      'playwright/no-conditional-expect': 'off',
    },
  },
);
