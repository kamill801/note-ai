import net from 'node:net';

export type DatabaseTarget = {
  host: string;
  port: number;
  database: string;
  user: string;
  ssl: boolean;
};

export type DatabaseConnectionCheck = {
  ok: boolean;
  target: DatabaseTarget;
  checkedAt: string;
  message: string;
};

export function parseDatabaseUrl(databaseUrl: string): DatabaseTarget {
  const url = new URL(databaseUrl);
  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error(`DATABASE_URL must use postgres:// or postgresql://, received ${url.protocol}`);
  }

  const database = url.pathname.replace(/^\//, '');
  if (!database) throw new Error('DATABASE_URL must include a database name');

  return {
    host: url.hostname || 'localhost',
    port: Number(url.port || 5432),
    database,
    user: decodeURIComponent(url.username || ''),
    ssl: url.searchParams.get('sslmode') === 'require',
  };
}

export async function checkDatabaseTcpConnection(
  databaseUrl: string,
  timeoutMs: number,
): Promise<DatabaseConnectionCheck> {
  const target = parseDatabaseUrl(databaseUrl);
  const checkedAt = new Date().toISOString();

  return new Promise((resolve) => {
    const socket = net.createConnection({ host: target.host, port: target.port });
    let settled = false;

    const finish = (ok: boolean, message: string) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ ok, target, checkedAt, message });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true, 'PostgreSQL TCP endpoint is reachable.'));
    socket.once('timeout', () => finish(false, `Timed out after ${timeoutMs}ms.`));
    socket.once('error', (error: NodeJS.ErrnoException) => {
      const detail = error.message || error.code || 'Unable to reach PostgreSQL TCP endpoint.';
      finish(false, detail);
    });
  });
}
