import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { SubscriptionTier } from '@/lib/types';
import { razorpayService, PLAN_LIMITS } from '@/lib/billing/razorpay';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let subscription = db.getSubscription(authUser.instituteId);
  if (!subscription) {
    subscription = {
      id: 'sub-' + Date.now(),
      instituteId: authUser.instituteId,
      tier: 'GROWTH',
      status: 'ACTIVE',
      leadsUsed: db.getLeads(authUser.instituteId).length,
      leadsQuota: 2500,
      ragQueriesUsed: 140,
      ragQueriesQuota: 1000,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    db.getData().subscriptions.push(subscription);
    db.persist();
  }

  // Update current live leads count
  subscription.leadsUsed = db.getLeads(authUser.instituteId).length;

  return NextResponse.json({
    success: true,
    subscription,
    availablePlans: PLAN_LIMITS,
    gateway: razorpayService.getStatus()
  });
}

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!requireRole(authUser.role, ['INSTITUTE_OWNER', 'SUPER_ADMIN'])) {
    return NextResponse.json({ error: 'Only institute owners can modify subscriptions' }, { status: 403 });
  }

  const body = await req.json();
  const { action, targetTier, orderId, paymentId, signature, testMode = true } = body;

  // 1. Order Creation Action
  if (action === 'CREATE_ORDER') {
    if (!targetTier || !PLAN_LIMITS[targetTier as SubscriptionTier]) {
      return NextResponse.json({ error: 'Invalid subscription plan tier' }, { status: 400 });
    }
    const plan = PLAN_LIMITS[targetTier as SubscriptionTier];
    const order = await razorpayService.createOrder(plan.price, `rcpt_${authUser.instituteId}_${Date.now()}`, {
      instituteId: authUser.instituteId,
      targetTier
    });
    return NextResponse.json({ success: true, order });
  }

  // 2. Plan Upgrade Action
  if (!targetTier || !PLAN_LIMITS[targetTier as SubscriptionTier]) {
    return NextResponse.json({ error: 'Invalid subscription plan tier' }, { status: 400 });
  }

  // Strict Signature Verification if live payment is claimed
  if (orderId && paymentId && signature) {
    const isValid = razorpayService.verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValid) {
      return NextResponse.json({
        error: 'Invalid payment signature. Payment verification failed on server.',
        verified: false
      }, { status: 400 });
    }
  }

  const planInfo = PLAN_LIMITS[targetTier as SubscriptionTier];

  // Update subscription in DB
  const updated = db.updateSubscription(authUser.instituteId, {
    tier: targetTier as SubscriptionTier,
    status: 'ACTIVE',
    leadsQuota: planInfo.leadsQuota,
    ragQueriesQuota: planInfo.ragQuota,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  return NextResponse.json({
    success: true,
    message: `Plan upgraded successfully to ${targetTier} (₹${planInfo.price.toLocaleString('en-IN')}/month)`,
    subscription: updated,
    paymentReceipt: {
      transactionId: paymentId || `pay_sim_${Date.now()}`,
      gateway: razorpayService.isConfigured() ? 'Razorpay Live Production' : 'Razorpay Standby Mode',
      status: 'CAPTURED',
      timestamp: new Date().toISOString()
    }
  });
}
