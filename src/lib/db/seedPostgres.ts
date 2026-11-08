import fs from 'fs';
import path from 'path';
import { getPostgresPool, withTransaction } from './postgresPool';

export async function seedPostgresFromJson(jsonFilePath?: string): Promise<{ migratedCounts: Record<string, number> }> {
  const file = jsonFilePath || path.join(process.cwd(), 'data', 'admitflow_db.json');
  if (!fs.existsSync(file)) {
    throw new Error(`Seed JSON file not found at ${file}`);
  }

  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const counts: Record<string, number> = {};

  await withTransaction(async (client) => {
    // 1. Institutes
    counts.institutes = 0;
    for (const inst of (data.institutes || [])) {
      await client.query(`
        INSERT INTO institutes (id, name, slug, email, phone, website, ai_tone, welcome_message, currency, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, welcome_message = EXCLUDED.welcome_message;
      `, [
        inst.id, inst.name, inst.slug, inst.email, inst.phone, inst.website || null,
        inst.aiTone || 'helpful_professional', inst.welcomeMessage, inst.currency || 'INR',
        inst.createdAt, inst.updatedAt
      ]);
      counts.institutes++;
    }

    // 2. Branches
    counts.branches = 0;
    for (const b of (data.branches || [])) {
      await client.query(`
        INSERT INTO branches (id, institute_id, name, city, address, phone, email, is_headquarters, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING;
      `, [b.id, b.instituteId, b.name, b.city, b.address, b.phone || null, b.email || null, b.isHeadquarters || false, b.createdAt]);
      counts.branches++;
    }

    // 3. Users
    counts.users = 0;
    for (const u of (data.users || [])) {
      await client.query(`
        INSERT INTO users (id, institute_id, branch_id, name, email, password_hash, role, phone, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING;
      `, [u.id, u.instituteId, u.branchId || null, u.name, u.email, u.passwordHash, u.role, u.phone || null, u.isActive, u.createdAt]);
      counts.users++;
    }

    // 4. Courses
    counts.courses = 0;
    for (const c of (data.courses || [])) {
      await client.query(`
        INSERT INTO courses (id, institute_id, name, code, category, duration_weeks, base_fee, min_installment_fee, max_discount_pct, description, eligibility, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING;
      `, [c.id, c.instituteId, c.name, c.code, c.category, c.durationWeeks, c.baseFee, c.minInstallmentFee, c.maxDiscountPct, c.description, c.eligibility, c.isActive, c.createdAt]);
      counts.courses++;
    }

    // 5. Leads
    counts.leads = 0;
    for (const l of (data.leads || [])) {
      await client.query(`
        INSERT INTO leads (id, institute_id, branch_id, assigned_counsellor_id, student_name, phone, email, course_id, status, source, lead_score, next_best_action, notes, last_interaction_at, next_followup_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING;
      `, [l.id, l.instituteId, l.branchId || null, l.assignedCounsellorId || null, l.studentName, l.phone, l.email || null, l.courseId || null, l.status, l.source, l.leadScore, l.nextBestAction || null, l.notes || null, l.lastInteractionAt, l.nextFollowupAt || null, l.createdAt, l.updatedAt]);
      counts.leads++;
    }
  });

  return { migratedCounts: counts };
}
