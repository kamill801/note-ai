import type { IncomingMessage, ServerResponse } from 'node:http';
import { readBackendConfig } from '../config/env.ts';
import { parseDatabaseUrl } from '../db/connection.ts';
import { writeJson } from '../http/json.ts';

export function handleHealth(_request: IncomingMessage, response: ServerResponse): void {
  const config = readBackendConfig();
  const database = parseDatabaseUrl(config.databaseUrl);

  writeJson(response, 200, {
    status: 'ok',
    service: 'note-ai-backend',
    appEnv: config.appEnv,
    database: {
      host: database.host,
      port: database.port,
      database: database.database,
      configured: true,
    },
    policy: {
      youtubePlayback: 'visible_embedded_player_only',
      hiddenPlayback: false,
      audioDownload: false,
    },
    checkedAt: new Date().toISOString(),
  });
}
