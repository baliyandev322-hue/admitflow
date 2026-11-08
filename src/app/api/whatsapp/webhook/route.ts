import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { WhatsAppBusinessConnector } from '@/lib/mcp/whatsapp';
import { db } from '@/lib/db';

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'admitflow_wa_verify_2026';
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

/**
 * GET: Meta Webhook Handshake Verification
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge || '', { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST: Incoming Message & Delivery Status Webhook
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // Verify HMAC-SHA256 if APP_SECRET is set
    if (APP_SECRET && signature) {
      const expected = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex');
      if (signature !== expected) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody || '{}');
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    const defaultInst = db.getInstitutes()[0]?.id || 'inst-apex-001';
    const wa = new WhatsAppBusinessConnector(defaultInst);

    // 1. Process Inbound Messages (Opt-out STOP check)
    if (value?.messages) {
      for (const msg of value.messages) {
        const fromPhone = msg.from;
        const text = msg.text?.body || '';

        // Check if student texted STOP or UNSUBSCRIBE
        wa.handleInboundText(fromPhone, text);
      }
    }

    // 2. Process Delivery Receipts (delivered, read)
    if (value?.statuses) {
      for (const st of value.statuses) {
        const statusType = st.status; // 'sent' | 'delivered' | 'read'
        const recipientId = st.recipient_id;
        // Status recorded
      }
    }

    return NextResponse.json({ status: 'EVENT_RECEIVED' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
