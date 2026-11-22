import { describe, expect, it } from 'vitest';
import { InvalidConfigError, loadConfig } from '../../src/bootstrap.js';

describe('loadConfig', () => {
  it('applies defaults to an empty environment', () => {
    expect(loadConfig({})).toEqual({
      env: 'development',
      http: { host: '0.0.0.0', port: 3000 },
      shutdownTimeoutMs: 10_000,
    });
  });

  it('coerces environment variable strings', () => {
    const config = loadConfig({ NODE_ENV: 'production', PORT: '8080', SHUTDOWN_TIMEOUT_MS: '2500' });
    expect(config.env).toBe('production');
    expect(config.http.port).toBe(8080);
    expect(config.shutdownTimeoutMs).toBe(2500);
  });

  it.each([
    { PORT: 'abc' },
    { PORT: '70000' },
    { NODE_ENV: 'staging' },
    { SHUTDOWN_TIMEOUT_MS: '0' },
  ])('rejects invalid configurations: %o', (env) => {
    expect(() => loadConfig(env)).toThrow(InvalidConfigError);
  });

  it('rejects non-object inputs', () => {
    expect(() => loadConfig(undefined)).toThrow(InvalidConfigError);
  });

  it('returns an immutable configuration', () => {
    const config = loadConfig({});
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.http)).toBe(true);
  });
});
