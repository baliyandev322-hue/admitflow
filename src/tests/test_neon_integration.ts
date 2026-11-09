import { getPostgresPool, checkPostgresHealth, withTransaction } from '../lib/db/postgresPool';
import { db } from '../lib/db';

async function runNeonEndToEndTests() {
  console.log('========================================================================');
  console.log('🚀 ADMITFLOW AI — NEON POSTGRESQL END-TO-END VERIFICATION');
  console.log('========================================================================\n');

  // Use DATABASE_URL from environment / .env.local; fallback to placeholder if not configured
  if (!process.env.DATABASE_URL) {
    const fs = await import('fs');
    const path = await import('path');
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (match) process.env.DATABASE_URL = match[1];
    }
  }
  (process.env as any).NODE_ENV = 'production';

  // 1. Health Check
  console.log('--- TEST 1: NEON POOL HEALTH CHECK ---');
  const health = await checkPostgresHealth();
  console.log('Health check response:', health);
  if (!health.healthy) {
    throw new Error(`Neon health check failed: ${health.error}`);
  }
  console.log(`✅ PASS: Connected to Neon (Latency: ${health.latencyMs}ms)\n`);

  // 2. DB Engine Verification
  console.log('--- TEST 2: DATABASE ENGINE VERIFICATION ---');
  const engine = db.getDatabaseEngine();
  console.log('Database Engine detected:', engine);
  if (engine !== 'POSTGRESQL') {
    throw new Error(`Expected POSTGRESQL engine but got ${engine}`);
  }
  console.log('✅ PASS: Engine is strictly POSTGRESQL\n');

  // 3. Schema Verification
  console.log('--- TEST 3: NEON TABLE INTEGRITY VERIFICATION ---');
  const pool = getPostgresPool();
  const tablesRes = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  const tableNames = tablesRes.rows.map(r => r.table_name);
  console.log(`Verified ${tableNames.length} tables in Neon:`, tableNames.join(', '));
  const expectedTables = ['institutes', 'branches', 'users', 'courses', 'leads', 'lead_activities', 'appointments', 'followups', 'knowledge_documents', 'document_chunks', 'sales_prospects', 'pilot_tracking'];
  for (const exp of expectedTables) {
    if (!tableNames.includes(exp)) {
      throw new Error(`Expected table '${exp}' missing in Neon`);
    }
  }
  console.log('✅ PASS: All critical AdmitFlow tables verified in Neon\n');

  // 4. CRUD & Transaction Verification in Neon
  console.log('--- TEST 4: TRANSACTION & CRUD VERIFICATION IN NEON ---');
  const testInstId = 'a0000000-0000-0000-0000-000000000001';
  const testLeadId = 'b0000000-0000-0000-0000-000000000001';
  await withTransaction(async (client) => {
    // Insert test institute
    await client.query(`
      INSERT INTO institutes (id, name, slug, email, phone, ai_tone, welcome_message, currency)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `, [testInstId, 'Neon Verified Institute', 'neon-verified', 'director@neon-test.com', '+91-99999-88888', 'helpful_professional', 'Welcome to Neon Test Campus', 'INR']);

    // Insert test lead
    await client.query(`
      INSERT INTO leads (id, institute_id, student_name, phone, status, source, lead_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET student_name = EXCLUDED.student_name;
    `, [testLeadId, testInstId, 'Rohan Sharma', '+91-98765-43210', 'NEW', 'WEBSITE_CHAT', 88]);

    // Query back
    const leadQuery = await client.query('SELECT * FROM leads WHERE id = $1', [testLeadId]);
    if (leadQuery.rows.length === 0 || leadQuery.rows[0].student_name !== 'Rohan Sharma') {
      throw new Error('Failed to query newly inserted lead in Neon');
    }

    console.log('Query result from Neon:', {
      leadId: leadQuery.rows[0].id,
      studentName: leadQuery.rows[0].student_name,
      leadScore: leadQuery.rows[0].lead_score,
      status: leadQuery.rows[0].status
    });

    // Clean up test records
    await client.query('DELETE FROM leads WHERE id = $1', [testLeadId]);
    await client.query('DELETE FROM institutes WHERE id = $1', [testInstId]);
  });
  console.log('✅ PASS: Transaction, INSERT, SELECT, and DELETE executed successfully in Neon\n');

  console.log('========================================================================');
  console.log('🎉 ALL NEON POSTGRESQL SERVICES VERIFIED END-TO-END!');
  console.log('========================================================================');
  process.exit(0);
}

runNeonEndToEndTests().catch(err => {
  console.error('Neon test failed:', err);
  process.exit(1);
});
