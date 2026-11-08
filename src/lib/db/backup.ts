import fs from 'fs';
import path from 'path';
import { db } from '../db';

export interface BackupMetadata {
  timestamp: string;
  backupPath: string;
  totalSizeKb: number;
  recordCounts: {
    institutes: number;
    branches: number;
    users: number;
    courses: number;
    batches: number;
    leads: number;
    appointments: number;
    followups: number;
    salesProspects: number;
    pilotTracking: number;
  };
}

export function createDatabaseBackup(customLabel = 'p8_step2'): BackupMetadata {
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `admitflow_db_backup_${customLabel}_${timestamp}.json`;
  const backupPath = path.join(backupDir, filename);

  const data = db.getData();
  const jsonString = JSON.stringify(data, null, 2);
  fs.writeFileSync(backupPath, jsonString, 'utf-8');

  const stats = fs.statSync(backupPath);

  return {
    timestamp: new Date().toISOString(),
    backupPath,
    totalSizeKb: Math.round(stats.size / 1024),
    recordCounts: {
      institutes: (data.institutes || []).length,
      branches: (data.branches || []).length,
      users: (data.users || []).length,
      courses: (data.courses || []).length,
      batches: (data.batches || []).length,
      leads: (data.leads || []).length,
      appointments: (data.appointments || []).length,
      followups: (data.followups || []).length,
      salesProspects: (data.sales_prospects || []).length,
      pilotTracking: (data.pilot_tracking || []).length,
    }
  };
}

export function verifyBackupIntegrity(backupPath: string): { valid: boolean; error?: string; metadata?: BackupMetadata['recordCounts'] } {
  try {
    if (!fs.existsSync(backupPath)) {
      return { valid: false, error: 'Backup file does not exist' };
    }

    const content = fs.readFileSync(backupPath, 'utf-8');
    const parsed = JSON.parse(content);

    const requiredKeys = ['institutes', 'branches', 'users', 'courses', 'leads'];
    for (const key of requiredKeys) {
      if (!Array.isArray(parsed[key])) {
        return { valid: false, error: `Missing required schema key: ${key}` };
      }
    }

    return {
      valid: true,
      metadata: {
        institutes: parsed.institutes.length,
        branches: parsed.branches.length,
        users: parsed.users.length,
        courses: parsed.courses.length,
        batches: (parsed.batches || []).length,
        leads: parsed.leads.length,
        appointments: (parsed.appointments || []).length,
        followups: (parsed.followups || []).length,
        salesProspects: (parsed.sales_prospects || []).length,
        pilotTracking: (parsed.pilot_tracking || []).length
      }
    };
  } catch (err: any) {
    return { valid: false, error: `JSON parsing failed: ${err.message}` };
  }
}
