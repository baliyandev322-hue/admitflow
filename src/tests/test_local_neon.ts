import fs from 'fs';
import path from 'path';

// Load .env.local safely
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function verifyNeon() {
  const { checkPostgresHealth, getPostgresPool } = await import('../lib/db/postgresPool');
  const health = await checkPostgresHealth();
  console.log('PostgreSQL Health Check:', {
    healthy: health.healthy,
    latencyMs: health.latencyMs,
    error: health.error || null
  });

  if (health.healthy) {
    const pool = getPostgresPool();
    const res = await pool.query('SELECT count(*)::int as count FROM institutes');
    console.log('Verified database table accessibility: institutes count =', res.rows[0].count);
  }
}

verifyNeon().catch(err => {
  console.error('Neon test failed:', err.message);
  process.exit(1);
});
