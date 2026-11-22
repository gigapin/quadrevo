import { describe, expect, it } from 'vitest';
import { InvalidConfigError, loadConfig } from '../../src/bootstrap.js';

describe('loadConfig', () => {
  it('applica i default a un ambiente vuoto', () => {
    expect(loadConfig({})).toEqual({
      env: 'development',
      http: { host: '0.0.0.0', port: 3000 },
      shutdownTimeoutMs: 10_000,
    });
  });

  it('converte i valori stringa delle variabili d’ambiente', () => {
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
  ])('rifiuta configurazioni non valide: %o', (env) => {
    expect(() => loadConfig(env)).toThrow(InvalidConfigError);
  });

  it('rifiuta input che non sono oggetti', () => {
    expect(() => loadConfig(undefined)).toThrow(InvalidConfigError);
  });

  it('restituisce una configurazione immutabile', () => {
    const config = loadConfig({});
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.http)).toBe(true);
  });
});
