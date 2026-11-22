import { z } from 'zod';

/**
 * Composition root: validated configuration.
 * Wire the logger, Prisma client, repositories, and handlers here as they are introduced.
 */

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(0).max(65_535).default(3000),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
});

export interface AppConfig {
  readonly env: 'development' | 'test' | 'production';
  readonly http: { readonly host: string; readonly port: number };
  readonly shutdownTimeoutMs: number;
}

export class InvalidConfigError extends Error {
  override readonly name = 'InvalidConfigError';
}

/** Environment variables are `unknown` until they pass schema validation. */
export function loadConfig(env: unknown): AppConfig {
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    throw new InvalidConfigError(`Invalid configuration:\n${z.prettifyError(parsed.error)}`);
  }
  const c = parsed.data;
  return Object.freeze({
    env: c.NODE_ENV,
    http: Object.freeze({ host: c.HOST, port: c.PORT }),
    shutdownTimeoutMs: c.SHUTDOWN_TIMEOUT_MS,
  });
}
