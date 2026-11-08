import { Pool, PoolClient } from 'pg';
import fs from 'fs';

let pool: Pool | null = null;

export function getPostgresPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const sslMode = process.env.DB_SSL_MODE || (connectionString.includes('sslmode=require') ? 'require' : 'prefer');

  // Secure SSL Configuration
  let sslConfig: any = undefined;

  if (sslMode === 'require' || connectionString.includes('supabase') || connectionString.includes('neon')) {
    const caCertPath = process.env.DB_CA_CERT_PATH;
    if (caCertPath && fs.existsSync(caCertPath)) {
      // Enterprise: Verify with CA Root Certificate
      sslConfig = {
        ca: fs.readFileSync(caCertPath, 'utf-8'),
        rejectUnauthorized: true,
      };
    } else if (isProduction && process.env.DB_SSL_ALLOW_SELF_SIGNED !== 'true') {
      // Strict production default: Reject unauthorized certificates
      sslConfig = {
        rejectUnauthorized: true,
      };
    } else {
      // Cloud development / explicit self-signed override with audit log
      sslConfig = {
        rejectUnauthorized: process.env.DB_SSL_ALLOW_SELF_SIGNED === 'true' ? false : true,
      };
    }
  }

  pool = new Pool({
    connectionString,
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '5000', 10),
    ssl: sslConfig,
  });

  pool.on('error', (err) => {
    console.error('[CRITICAL] Unexpected error on idle PostgreSQL pool client:', err);
  });

  return pool;
}

export async function checkPostgresHealth(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const p = getPostgresPool();
    const res = await p.query('SELECT 1 as health_check, NOW() as server_time');
    return {
      healthy: res.rows.length > 0,
      latencyMs: Date.now() - start
    };
  } catch (e: any) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: e.message
    };
  }
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const p = getPostgresPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function closePostgresPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
