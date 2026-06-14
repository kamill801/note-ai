import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../db/migrations/0001_initial.sql', import.meta.url), 'utf8');
const requiredTables = ['sources', 'transcript_segments', 'transcript_windows', 'captures', 'notes', 'research_jobs'];
const missingTables = requiredTables.filter((table) => !new RegExp(`CREATE TABLE ${table}\\b`, 'i').test(sql));

if (missingTables.length > 0) {
  console.error(`Migration missing tables: ${missingTables.join(', ')}`);
  process.exit(1);
}

const forbidden = [/youtube audio/i, /downloaded audio/i, /background playback/i];
const riskyMatches = forbidden.filter((pattern) => pattern.test(sql) && !/does not store downloaded YouTube audio\/video/i.test(sql));
if (riskyMatches.length > 0) {
  console.error('Migration contains policy-risky storage language.');
  process.exit(1);
}

for (const keyword of ['in_app_exact', 'youtube_app_estimated', 'memo_transcript', 'evidence_segment_ids']) {
  if (!sql.includes(keyword)) {
    console.error(`Migration missing required MVP1/MVP2 field marker: ${keyword}`);
    process.exit(1);
  }
}

console.log('migration validation passed');
