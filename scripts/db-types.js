// AI.DY — Database type generator
// Connects to the live DB and runs supabase-gen-types (via npx).
// Outputs to src/types/database.types.ts.

import { spawnSync } from 'child_process';

const PROJECT_REF = 'qchnindfczaulufazivy';
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const OUT = 'src/types/database.types.ts';

if (!DB_PASSWORD) {
  console.error('ERROR: SUPABASE_DB_PASSWORD env var required.');
  process.exit(1);
}

const DB_URL = `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-1-eu-central-1.pooler.supabase.com:6543/postgres`;

console.log('Generating TypeScript types from live DB...');
console.log(`Output: ${OUT}`);

const result = spawnSync(
  'npx',
  [
    '-y',
    'supabase-gen-types-ts',
    '--schema',
    'public',
    '--db-url',
    DB_URL,
    '--output',
    OUT,
  ],
  { stdio: 'inherit', shell: true }
);

if (result.status !== 0) {
  console.error('Type generation failed.');
  process.exit(1);
}
console.log('Done.');
