export type AppEnv = 'development' | 'test' | 'production';

export type BackendConfig = {
  appEnv: AppEnv;
  port: number;
  databaseUrl: string;
  databaseConnectionTimeoutMs: number;
};

const DEFAULT_DATABASE_URL = 'postgres://user:password@localhost:5432/note_ai';

export function readBackendConfig(env: NodeJS.ProcessEnv = process.env): BackendConfig {
  const appEnv = parseAppEnv(env.APP_ENV);
  const port = parsePort(env.PORT ?? '3000');
  const databaseConnectionTimeoutMs = parsePositiveInt(
    env.DATABASE_CONNECTION_TIMEOUT_MS ?? '1500',
    'DATABASE_CONNECTION_TIMEOUT_MS',
  );

  return {
    appEnv,
    port,
    databaseUrl: env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    databaseConnectionTimeoutMs,
  };
}

function parseAppEnv(value: string | undefined): AppEnv {
  if (value === undefined || value === '') return 'development';
  if (value === 'development' || value === 'test' || value === 'production') return value;
  throw new Error(`Invalid APP_ENV: ${value}`);
}

function parsePort(value: string): number {
  const port = parsePositiveInt(value, 'PORT');
  if (port > 65535) throw new Error(`PORT must be <= 65535: ${value}`);
  return port;
}

function parsePositiveInt(value: string, name: string): number {
  if (!/^\d+$/.test(value)) throw new Error(`${name} must be a positive integer: ${value}`);
  const parsed = Number(value);
  if (parsed <= 0) throw new Error(`${name} must be > 0: ${value}`);
  return parsed;
}
