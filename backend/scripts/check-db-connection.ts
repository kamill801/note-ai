import { readBackendConfig } from '../src/config/env.ts';
import { checkDatabaseTcpConnection } from '../src/db/connection.ts';

const config = readBackendConfig();
const result = await checkDatabaseTcpConnection(config.databaseUrl, config.databaseConnectionTimeoutMs);
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
