# AdmitFlow AI — Environment Variables & Secrets Reference

This document details all environment variables used by AdmitFlow AI across production, staging, and local development.

---

## 1. Core & Security Configuration

| Variable | Required? | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | Production | `development` | Set to `production` for production builds and strict error enforcing |
| `PORT` | Optional | `3000` | HTTP port for Next.js application server |
| `JWT_SECRET` | **YES** | `admitflow-super-secure...` | Secret key used to sign and verify session JWTs (minimum 32 characters) |
| `APP_URL` | Optional | `http://localhost:3000` | Base public URL of the application |

---

## 2. Database Configuration (PostgreSQL)

| Variable | Required? | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | **YES (Prod)** | None (uses JSON local fallback) | Connection string for PostgreSQL (e.g., `postgresql://user:pass@host:5432/admitflow?sslmode=require`) |
| `DB_SSL_ALLOW_SELF_SIGNED`| Optional | `false` | Set to `true` only for cloud providers (Neon/Supabase) with non-CA certificates |
| `DB_CA_CERT_PATH` | Optional | None | Absolute path to custom CA certificate for strict corporate TLS verification |

> **IMPORTANT**: In production (`NODE_ENV=production`), if `DATABASE_URL` is set and the database is unreachable, the system raises a fatal error and will **NEVER** silently fall back to JSON.

---

## 3. Google Gemini AI Model Configuration

| Variable | Required? | Default | Purpose |
|---|---|---|---|
| `GEMINI_API_KEY` | **YES** | File fallback (`api_key.txt`) | Official Google Gemini API Key |
| `GEMINI_MODEL` | Optional | `gemini-3.5-flash-lite` | Active model selection (recommended: `gemini-3.5-flash-lite`) |

---

## 4. Google Calendar Integration (OAuth 2.0)

| Variable | Required? | Status | Purpose |
|---|---|---|---|
| `GOOGLE_CALENDAR_CLIENT_ID` | Optional | Pending Setup | OAuth 2.0 Client ID from Google Cloud Console |
| `GOOGLE_CALENDAR_CLIENT_SECRET`| Optional | Pending Setup | OAuth 2.0 Client Secret from Google Cloud Console |
| `GOOGLE_CALENDAR_REFRESH_TOKEN`| Optional | Pending Setup | Authorized OAuth Refresh Token with calendar scopes |
| `GOOGLE_CALENDAR_ID` | Optional | `primary` | Target Google Calendar ID to sync appointments |
| `DEFAULT_TIMEZONE` | Optional | `Asia/Kolkata` | Standard timezone for scheduled slots |

*If Google Calendar credentials are not configured, the connector automatically operates in **Standby Mode**, storing appointment bookings inside AdmitFlow's verified PostgreSQL/JSON database and returning conflict-free scheduling.*

---

## 5. WhatsApp Business Platform (Meta Cloud API)

| Variable | Required? | Status | Purpose |
|---|---|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | Optional | Pending Setup | Meta Cloud API Phone Number ID |
| `WHATSAPP_ACCESS_TOKEN` | Optional | Pending Setup | Permanent System User Access Token from Meta Business Manager |
| `WHATSAPP_BUSINESS_ACCOUNT_ID`| Optional | Pending Setup | Meta WhatsApp Business Account (WABA) ID |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN`| Optional | `admitflow_wa_verify_2026` | Verification token for Meta Webhook setup |

*If WhatsApp credentials are not configured, the connector operates in **Standby Mode**, verifying approved templates, checking parameter schemas, and enforcing student DPDP opt-in consent without dropping messages.*
