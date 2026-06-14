import { readFileSync, existsSync } from 'node:fs';

const required = [
  'package.json',
  'backend/package.json',
  'backend/src/server.ts',
  'backend/db/migrations/0001_initial.sql',
  'mobile/package.json',
  'mobile/app.json',
  'mobile/App.tsx',
  'mobile/src/design/tokens.ts',
  '.env.example',
];

const missing = required.filter((file) => !existsSync(file));
if (missing.length > 0) {
  console.error(`Missing required bootstrap files: ${missing.join(', ')}`);
  process.exit(1);
}

const rootPackage = JSON.parse(readFileSync('package.json', 'utf8'));
if (!rootPackage.workspaces?.includes('backend') || !rootPackage.workspaces?.includes('mobile')) {
  console.error('Root package.json must declare backend and mobile workspaces.');
  process.exit(1);
}

const envExample = readFileSync('.env.example', 'utf8');
for (const key of ['PUBLIC_API_BASE_URL', 'PORT', 'DATABASE_URL', 'OPENAI_API_KEY']) {
  if (!envExample.includes(`${key}=`)) {
    console.error(`.env.example missing ${key}`);
    process.exit(1);
  }
}

console.log('workspace bootstrap check passed');
