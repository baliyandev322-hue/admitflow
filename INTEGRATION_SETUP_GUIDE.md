# AdmitFlow AI — External Integrations Setup Guide

This guide provides step-by-step instructions to take Google Calendar, WhatsApp Business, and Razorpay from **STANDBY MODE** to **LIVE PRODUCTION**.

---

## 1. Google Calendar Integration (OAuth 2.0)

To sync counselor availability and auto-generate Google Meet video links:

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create project: `AdmitFlow-Counselling`.
3. Enable **Google Calendar API**.
4. Configure OAuth Consent Screen (Scopes: `https://www.googleapis.com/auth/calendar.events`).
5. Create OAuth 2.0 Client ID (Application type: Web application).
6. Set Authorized Redirect URI: `https://your-domain.com/api/auth/google/callback`.
7. Add the following to your production `.env`:
   ```bash
   GOOGLE_CALENDAR_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CALENDAR_CLIENT_SECRET="your-client-secret"
   GOOGLE_CALENDAR_REFRESH_TOKEN="your-refresh-token"
   GOOGLE_CALENDAR_ID="primary"
   DEFAULT_TIMEZONE="Asia/Kolkata"
   ```
8. In AdmitFlow dashboard (`/integrations`), Google Calendar status will update from `STANDBY` to `ACTIVE`.

---

## 2. WhatsApp Business Cloud API (Meta)

To send official WhatsApp templates with delivery receipts:

1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Create a **Business** app and add the **WhatsApp** product.
3. Link your WhatsApp Business Account (WABA) and verify your sender phone number.
4. Generate a **Permanent System User Token** with `whatsapp_business_messaging` permission.
5. Create and submit the 4 required templates in Meta Business Manager:
   * `enquiry_acknowledgement_v1`
   * `counselling_slot_confirmed_v1`
   * `document_submission_reminder_v1`
   * `fee_installments_info_v1`
6. Add the following to your `.env`:
   ```bash
   WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
   WHATSAPP_ACCESS_TOKEN="your-permanent-system-token"
   WHATSAPP_BUSINESS_ACCOUNT_ID="your-waba-id"
   WHATSAPP_WEBHOOK_VERIFY_TOKEN="admitflow_wa_verify_2026"
   WHATSAPP_APP_SECRET="your-meta-app-secret"
   ```
7. Set Webhook Callback URL in Meta App Dashboard:
   `https://your-domain.com/api/whatsapp/webhook`

---

## 3. Razorpay Payment Gateway

To accept live institute subscription payments:

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings > API Keys** and generate Live Key Pair.
3. Configure Webhook URL in Razorpay Dashboard:
   * URL: `https://your-domain.com/api/billing/webhook`
   * Secret: Set a secure webhook secret string.
   * Events to Subscribe: `payment.captured`, `order.paid`.
4. Add to your `.env`:
   ```bash
   RAZORPAY_KEY_ID="rzp_live_..."
   RAZORPAY_KEY_SECRET="your-key-secret"
   RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"
   ```
5. All subscription upgrades will now automatically verify HMAC-SHA256 signatures before activating quotas.
