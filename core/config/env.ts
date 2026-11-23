import { z } from 'zod';

/**
 * Test environment resolution.
 *
 * Safety rules:
 * - TEST_ENV missing      → "production" (the strictest policy) plus a visible notice.
 * - TEST_ENV invalid      → explicit error, the run does not start.
 * - BASE_URL points at a production host while TEST_ENV is not "production" → explicit error.
 * - GUARD_MODE=observe is refused for production.
 */
export const TEST_ENVIRONMENTS = ['local', 'ci', 'staging', 'production'] as const;
export type TestEnvironment = (typeof TEST_ENVIRONMENTS)[number];

export const GUARD_MODES = ['enforce', 'observe'] as const;
export type GuardMode = (typeof GUARD_MODES)[number];

export interface AppEnvironment {
  baseURL: string;
}

/** Per-app description of where it runs. Lives in apps/<app>/app.config.ts. */
export interface AppDefinition {
  name: string;
  environments: Partial<Record<TestEnvironment, AppEnvironment>>;
  /** Hosts that belong to the production deployment of this app. */
  productionHosts: readonly string[];
}

export interface ResolvedEnvironment {
  env: TestEnvironment;
  baseURL: string;
  guardMode: GuardMode;
  /** True when TEST_ENV was not provided and the safe default was applied. */
  defaulted: boolean;
}

export class EnvironmentConfigError extends Error {
  constructor(message: string) {
    super(`[env] ${message}`);
    this.name = 'EnvironmentConfigError';
  }
}

const rawSchema = z.object({
  TEST_ENV: z.string().trim().optional(),
  BASE_URL: z.string().trim().optional(),
  GUARD_MODE: z.string().trim().optional(),
});

function parseEnum<T extends readonly string[]>(name: string, value: string, allowed: T): T[number] {
  if ((allowed as readonly string[]).includes(value)) return value;
  throw new EnvironmentConfigError(`${name}="${value}" is not valid. Use one of: ${(allowed as readonly string[]).join(', ')}.`);
}

export function resolveEnvironment(
  app: AppDefinition,
  source: Record<string, string | undefined> = process.env,
): ResolvedEnvironment {
  const raw = rawSchema.parse({
    TEST_ENV: source.TEST_ENV || undefined,
    BASE_URL: source.BASE_URL || undefined,
    GUARD_MODE: source.GUARD_MODE || undefined,
  });

  const defaulted = raw.TEST_ENV === undefined;
  const env: TestEnvironment = defaulted ? 'production' : parseEnum('TEST_ENV', raw.TEST_ENV ?? '', TEST_ENVIRONMENTS);
  const guardMode: GuardMode = raw.GUARD_MODE ? parseEnum('GUARD_MODE', raw.GUARD_MODE, GUARD_MODES) : 'enforce';

  if (env === 'production' && guardMode !== 'enforce') {
    throw new EnvironmentConfigError('GUARD_MODE=observe is not allowed for production. Remove GUARD_MODE or use TEST_ENV=local.');
  }

  const configured = app.environments[env]?.baseURL;
  const baseURLText = raw.BASE_URL ?? configured;
  if (!baseURLText) {
    throw new EnvironmentConfigError(`No BASE_URL for "${app.name}" in TEST_ENV=${env}. Set BASE_URL or add environments.${env} to the app config.`);
  }

  let baseURL: URL;
  try {
    baseURL = new URL(baseURLText);
  } catch {
    throw new EnvironmentConfigError(`BASE_URL="${baseURLText}" is not a valid absolute URL.`);
  }
  if (baseURL.protocol !== 'https:' && baseURL.protocol !== 'http:') {
    throw new EnvironmentConfigError(`BASE_URL must use http or https, got "${baseURL.protocol}".`);
  }

  const pointsAtProduction = app.productionHosts.includes(baseURL.host);
  if (pointsAtProduction && env !== 'production') {
    throw new EnvironmentConfigError(
      `BASE_URL host "${baseURL.host}" is a production host but TEST_ENV=${env}. Use TEST_ENV=production (read-only policy) or a non-production BASE_URL.`,
    );
  }

  return { env, baseURL: baseURL.origin, guardMode, defaulted };
}
