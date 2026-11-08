import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const startTime = Date.now();
    // Lightweight database check
    let dbStatus = 'CONNECTED';
    let instituteCount = 0;
    try {
      const institutes = db.getInstitutes();
      instituteCount = institutes.length;
    } catch (err: any) {
      dbStatus = 'DEGRADED';
    }

    const memory = process.memoryUsage();

    return NextResponse.json({
      status: dbStatus === 'CONNECTED' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - startTime,
      version: '1.0.0-pilot-p7',
      environment: process.env.NODE_ENV || 'development',
      database: {
        engine: db.getDatabaseEngine ? db.getDatabaseEngine() : (process.env.DATABASE_URL ? 'POSTGRESQL' : 'JSON_LOCAL'),
        status: dbStatus,
        activeTenantsCount: instituteCount
      },
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024))
      },
      integrations: {
        geminiAi: process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'STANDBY',
        razorpay: process.env.RAZORPAY_KEY_ID ? 'TEST_MODE' : 'STANDBY',
        whatsappMeta: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'CONFIGURED' : 'STANDBY',
        googleCalendar: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL ? 'CONFIGURED' : 'STANDBY'
      }
    }, {
      status: dbStatus === 'CONNECTED' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
