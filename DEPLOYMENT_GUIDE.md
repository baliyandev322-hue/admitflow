# AdmitFlow AI — Production Deployment & Operations Guide

This guide provides end-to-end instructions for deploying **AdmitFlow AI** to production cloud environments (Vercel, Supabase / Neon, Docker).

---

## 1. Cloud Database Setup (Supabase or Neon PostgreSQL with pgvector)

### Option A: Supabase (Recommended)
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Database** ➔ **Extensions** and enable `vector` and `uuid-ossp`.
3. Open the **SQL Editor** in Supabase and paste the contents of `admitflow_postgres_schema.sql`.
4. Run the query. This creates all 17 tables, triggers, and Row-Level Security (RLS) policies.
5. In **Project Settings** ➔ **Database**, copy your **Connection String (URI)**.

### Option B: Neon Serverless Postgres
1. Create a project at [neon.tech](https://neon.tech).
2. Run `psql [YOUR_NEON_CONNECTION_STRING] -f admitflow_postgres_schema.sql`.

---

## 2. Frontend & API Deployment (Vercel)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: AdmitFlow AI production release"
   git push origin main
   ```
2. Import the repository in [vercel.com](https://vercel.com).
3. Set **Root Directory** to `admitflow`.
4. Configure Environment Variables in Vercel:
   - `JWT_SECRET`: Generate a 32+ character random string.
   - `NEXT_PUBLIC_APP_URL`: `https://your-domain.com`
   - `DATABASE_URL`: Your Supabase/Neon PostgreSQL connection URI.
   - `GEMINI_API_KEY`: Your Gemini API key for embeddings.
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Razorpay credentials.
5. Click **Deploy**. Vercel will build and distribute all 35 Next.js serverless routes globally.

---

## 3. Docker Self-Hosting (DigitalOcean / AWS EC2 / Hetzner)

For hosting on your own Linux VPS:
1. Clone the repository onto your server:
   ```bash
   git clone <repo_url>
   cd admitflow
   ```
2. Start the application and pgvector database containers:
   ```bash
   docker compose up -d --build
   ```
3. AdmitFlow AI will be running on port `3000`, with PostgreSQL running on port `5432`.
4. Use Nginx or Caddy as a reverse proxy for SSL/TLS certificates:
   ```caddy
   app.yourdomain.com {
       reverse_proxy localhost:3000
   }
   ```

---

## 4. WhatsApp Business Platform (Meta Cloud API) Setup

1. Create a Meta Developer App at [developers.facebook.com](https://developers.facebook.com) of type **Business**.
2. Add the **WhatsApp** product.
3. In **Configuration** ➔ **Webhooks**:
   - Callback URL: `https://your-domain.com/api/chat`
   - Verify Token: Matches your `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
4. Subscribe to the `messages` webhook field.
5. Now student WhatsApp messages will be processed by AdmitFlow AI's RAG knowledge engine and CRM in real time.

---

## 5. Security & Maintenance Checklist

* **Data Isolation**: Verify each institute uses a separate `institute_id` UUID.
* **Database Backups**: Enable automated daily snapshots in Supabase/Neon.
* **Rate Limiting**: The built-in sliding window rate limiter protects endpoints from bot spam (60 requests/min per IP).
* **Payment Security**: Raw card details are never stored; transactions process through Razorpay's PCI-DSS Level 1 compliant checkout.
