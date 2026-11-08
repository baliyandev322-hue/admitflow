import crypto from 'crypto';
import { SubscriptionTier } from '../types';

export const PLAN_LIMITS: Record<SubscriptionTier, { price: number; leadsQuota: number; ragQuota: number; branches: string }> = {
  STARTER: { price: 999, leadsQuota: 500, ragQuota: 200, branches: '1 Branch' },
  GROWTH: { price: 1999, leadsQuota: 2500, ragQuota: 1000, branches: 'Up to 3 Branches' },
  PRO: { price: 3999, leadsQuota: 10000, ragQuota: 5000, branches: 'Unlimited Branches' },
  ENTERPRISE: { price: 9999, leadsQuota: 50000, ragQuota: 25000, branches: 'Dedicated Cluster' }
};

export interface RazorpayOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  status: 'CREATED' | 'STANDBY_MOCK';
  receipt: string;
  keyId: string;
  isLiveGateway: boolean;
}

export class RazorpayGatewayService {
  private keyId?: string;
  private keySecret?: string;
  private webhookSecret?: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET;
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'admitflow_rzp_webhook_sec_2026';
  }

  public isConfigured(): boolean {
    return Boolean(this.keyId && this.keySecret && this.keyId.startsWith('rzp_'));
  }

  public getStatus() {
    return {
      isConfigured: this.isConfigured(),
      status: this.isConfigured() ? 'ACTIVE' : 'PENDING_CONFIG',
      keyIdMasked: this.keyId ? this.keyId.substring(0, 8) + '...' : 'NOT_SET',
      webhookConfigured: Boolean(this.webhookSecret)
    };
  }

  /**
   * 1. Create Order via official Razorpay Orders API
   */
  public async createOrder(
    amountInInr: number, 
    receiptId: string, 
    notes: Record<string, string> = {}
  ): Promise<RazorpayOrderResult> {
    const amountInPaise = amountInInr * 100;

    if (this.isConfigured()) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
        const res = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: receiptId,
            notes
          })
        });

        if (res.ok) {
          const order = await res.json();
          return {
            orderId: order.id,
            amount: amountInInr,
            currency: 'INR',
            status: 'CREATED',
            receipt: receiptId,
            keyId: this.keyId!,
            isLiveGateway: true
          };
        }
      } catch (err: any) {
        console.warn(`[Razorpay Orders API Error] ${err.message}. Falling back to standby order.`);
      }
    }

    // Standby Mode Order: For development, demo environments, or when keys are pending setup
    const standbyOrderId = `order_sb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      orderId: standbyOrderId,
      amount: amountInInr,
      currency: 'INR',
      status: 'STANDBY_MOCK',
      receipt: receiptId,
      keyId: this.keyId || 'rzp_test_standby_demo',
      isLiveGateway: false
    };
  }

  /**
   * 2. Verify Payment Signature on server
   * Formula: HMAC_SHA256(order_id + "|" + payment_id, secret) == signature
   */
  public verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!orderId || !paymentId || !signature) return false;

    // If live credentials configured, use official secret
    if (this.isConfigured()) {
      const expected = crypto
        .createHmac('sha256', this.keySecret!)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    }

    // In Standby mode, verify consistent simulated signature
    const standbySecret = 'admitflow_standby_secret_2026';
    const expectedStandby = crypto
      .createHmac('sha256', standbySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    
    // Accept either valid standby HMAC or test-mode verification token
    return signature === expectedStandby || signature === `sig_valid_${orderId}`;
  }

  /**
   * 3. Verify Webhook Signature
   */
  public verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!rawBody || !signature) return false;
    const expected = crypto
      .createHmac('sha256', this.webhookSecret!)
      .update(rawBody)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch (e) {
      return false;
    }
  }
}

export const razorpayService = new RazorpayGatewayService();
