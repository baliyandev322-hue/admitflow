import { NextRequest, NextResponse } from 'next/server';
import { razorpayService, PLAN_LIMITS } from '@/lib/billing/razorpay';
import { db } from '@/lib/db';
import { SubscriptionTier } from '@/lib/types';

// Idempotency cache for processed webhook event IDs
const processedWebhookEvents = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid && razorpayService.isConfigured()) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody || '{}');
    const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;

    // Idempotency check: Ignore duplicate events
    if (processedWebhookEvents.has(eventId)) {
      return NextResponse.json({ status: 'ok', message: 'Event already processed (Idempotent)' });
    }
    processedWebhookEvents.add(eventId);

    const event = payload.event;
    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload.payload?.payment?.entity;
      const notes = payment?.notes || {};
      const instituteId = notes.instituteId;
      const targetTier = notes.targetTier as SubscriptionTier;

      if (instituteId && targetTier && PLAN_LIMITS[targetTier]) {
        const plan = PLAN_LIMITS[targetTier];
        db.updateSubscription(instituteId, {
          tier: targetTier,
          status: 'ACTIVE',
          leadsQuota: plan.leadsQuota,
          ragQueriesQuota: plan.ragQuota,
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
