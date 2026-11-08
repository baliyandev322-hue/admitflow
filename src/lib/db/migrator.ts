import fs from 'fs';
import path from 'path';
import { getPostgresPool } from './postgresPool';

export interface MigrationResult {
  success: boolean;
  executedStatements: number;
  tablesVerified: string[];
  appliedMigrations: string[];
  error?: string;
}

export async function runPostgresMigrations(): Promise<MigrationResult> {
  const pool = getPostgresPool();
  const migrationsDir = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations');
  const schemaPath = path.join(process.cwd(), 'admitflow_postgres_schema.sql');

  let migrationFiles: { name: string; sql: string }[] = [];

  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // 001, 002 order
    
    migrationFiles = files.map(f => ({
      name: f,
      sql: fs.readFileSync(path.join(migrationsDir, f), 'utf-8')
    }));
  }

  // Fallback if migrations dir is empty
  if (migrationFiles.length === 0 && fs.existsSync(schemaPath)) {
    migrationFiles.push({
      name: 'admitflow_postgres_schema.sql',
      sql: fs.readFileSync(schemaPath, 'utf-8')
    });
  }

  if (migrationFiles.length === 0) {
    return {
      success: false,
      executedStatements: 0,
      tablesVerified: [],
      appliedMigrations: [],
      error: `No migration files found in ${migrationsDir} or ${schemaPath}`
    };
  }

  const appliedMigrations: string[] = [];
  let totalStatements = 0;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create migration tracking table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      for (const mig of migrationFiles) {
        await client.query(mig.sql);
        await client.query(`
          INSERT INTO schema_migrations (version) 
          VALUES ($1) 
          ON CONFLICT (version) DO NOTHING;
        `, [mig.name]);
        
        appliedMigrations.push(mig.name);
        totalStatements += mig.sql.split(';').length;
      }

      await client.query('COMMIT');

      // Verify all tables
      const checkRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);

      const tables = checkRes.rows.map(r => r.table_name);

      return {
        success: true,
        executedStatements: totalStatements,
        tablesVerified: tables,
        appliedMigrations
      };
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err: any) {
    return {
      success: false,
      executedStatements: totalStatements,
      tablesVerified: [],
      appliedMigrations,
      error: err.message
    };
  }
}
