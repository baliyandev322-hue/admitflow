# AdmitFlow AI — Vertical AI Admission & Lead Conversion Platform

**AdmitFlow AI** is a complete, intelligent, multi-tenant AI Admission Management and Lead Conversion Platform designed specifically for coaching institutes, competitive exam centers (IIT-JEE / NEET / UPSC), coding academies, and skill development academies.

---

## 🌟 Why AdmitFlow AI?

In India, **62% to 78% of coaching center student enquiries drop off** due to delayed responses after 7 PM, repetitive questions handled manually, and sporadic follow-ups on personal counselor phones. 

AdmitFlow AI replaces horizontal chatbots (WATI, Interakt) and heavy enterprise CRMs with a **Vertical AI Operating System**:
1. **RAG Knowledge Brain**: Grounded in your uploaded PDF brochures and fee sheets with 100% data privacy and zero hallucination.
2. **Multilingual Agent**: Understands natural Hinglish (*"NEET dropper batch ki fees kitni hai?"*), Hindi, and English.
3. **Next Best Action Engine**: Prescribes the highest-converting next step for every stalled student lead.
4. **Lead Drop-Off Intelligence**: Automatically flags funnel bottlenecks and overdue counselor callbacks.
5. **Human-In-The-Loop Automation**: AI drafts follow-up messages for counselor review and one-click dispatch.
6. **Multi-Branch Intelligence**: Compare center-level conversions across Kota, Jaipur, Delhi, Bengaluru, etc.

---

## 🏗️ Architecture & Modules

```
admitflow/
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Module 1: High-converting SaaS Marketing Website
│   │   ├── login/page.tsx               # Module 2: Authentication
│   │   ├── signup/page.tsx              # Module 3: Institute Onboarding
│   │   ├── dashboard/page.tsx           # Module 11 & 12: Real Analytics & Drop-off Intelligence
│   │   ├── crm/page.tsx                 # Module 7: Lead Management Pipeline CRM
│   │   ├── knowledge/page.tsx           # Module 6: RAG Knowledge Brain (PDF / Vector Chunks)
│   │   ├── chat-sandbox/page.tsx        # Module 4: Multilingual AI Chat Sandbox
│   │   ├── scheduler/page.tsx           # Module 9: Counseling Calendar & Slot Scheduler
│   │   ├── followups/page.tsx           # Module 8: Follow-up Queue & Human Approval
│   │   ├── branches/page.tsx            # Module E: Multi-Branch Hub
│   │   ├── billing/page.tsx             # Module 13: Subscriptions (Razorpay test integration)
│   │   ├── settings/page.tsx            # Module 10: Integrations & Web Widget Snippet
│   │   ├── widget/page.tsx              # Clean embeddable student widget iframe
│   │   └── api/                         # 17 Production REST API Routes
│   ├── lib/
│   │   ├── db.ts                        # Storage engine with tenant isolation & seed data
│   │   ├── types.ts                     # TypeScript schemas & DB models
│   │   ├── auth.ts                      # JWT session management & Role-Based Access Control
│   │   ├── rag.ts                       # Semantic vector embeddings & Cosine similarity engine
│   │   └── agent.ts                     # AI Orchestrator & The 12 Reusable Business Skills
│   └── tests/
│       └── test_suite.ts                # Production Test Suite (Workflows A to F)
```

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- Node.js v18+ or v20+
- npm v9+

### 2. Installation
```bash
cd admitflow
npm install
```

### 3. Environment Configuration
Create `.env.local` in `admitflow/`:
```env
PORT=3000
JWT_SECRET=admitflow-super-secure-production-key-2026
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Add for live Gemini embeddings (Falls back to local high-dimensional vector engine automatically)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Running the Automated Test Suite
Run the automated test suite verifying all 6 real business workflows (A through F):
```bash
npx tsx src/tests/test_suite.ts
```
Expected output:
```
================ TEST SUMMARY REPORT ================
✅ PASSED [WORKFLOW A] RAG Retrieval & Course Fee Answering
✅ PASSED [WORKFLOW B] Enquiry Submission, CRM Lead Capture & Duplicate Detection
✅ PASSED [WORKFLOW C] Counselling Appointment & Conflict/Double-Booking Prevention
✅ PASSED [WORKFLOW D] Follow-up Task Automation & Human Approval Enforcement
✅ PASSED [WORKFLOW E] Owner Analytics Dashboard Real Database Query
✅ PASSED [WORKFLOW F] Multi-Tenant Data & RAG Knowledge Isolation Guard
Total: 6 | Passed: 6 | Failed: 0
```

### 5. Running the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Pre-Seeded Demo Accounts

You can test the application immediately using the pre-configured accounts:

| Role | Email | Password | Institute / Branch |
|---|---|---|---|
| **Institute Owner / Director** | `rajesh@apexacademy.in` | `Password123!` | Apex Academy (Kota / Jaipur / Delhi) |
| **Admission Counselor** | `priya@apexacademy.in` | `Password123!` | Apex Academy (Kota Campus) |
| **Branch Manager** | `sunil@apexacademy.in` | `Password123!` | Apex Academy (Jaipur Campus) |
| **Bootcamp Founder** | `pooja@codecraft.tech` | `Password123!` | CodeCraft AI Academy (Bengaluru) |

---

## 🗄️ Production PostgreSQL Deployment (Supabase / Neon / AWS RDS)

The complete enterprise PostgreSQL + `pgvector` migration script with Row-Level Security (RLS) is provided at:
`admitflow_postgres_schema.sql`

To deploy to PostgreSQL:
```bash
psql -h your-db-host -U postgres -d admitflow -f admitflow_postgres_schema.sql
```

---

## 📋 The 12 Reusable AI Agent Skills
1. `answer_enquiry(query, language)`: Grounded RAG answering with zero fee hallucinations.
2. `qualify_lead(leadId, context)`: Evaluates student intent and dynamically updates lead score.
3. `create_lead(payload)`: Captures student details, avoids phone duplicates, assigns counselor.
4. `update_lead(leadId, updates)`: Updates stages across the admission funnel.
5. `retrieve_course_details(courseName)`: Fetches verified curriculum and batch details.
6. `retrieve_fee_details(courseId)`: Calculates installments and early-bird scholarship discounts.
7. `check_batch_availability(courseId, branchId)`: Checks enrolled count vs seat capacity.
8. `schedule_counselling(payload)`: Books 1-on-1 counselor appointment and prevents double bookings.
9. `create_followup(payload)`: Creates scheduled reminder with human approval requirement.
10. `generate_lead_report()`: Compiles conversion metrics, drop-off rates, and pipeline values.
11. `identify_dropoffs()`: Detects stalled leads silent for >48 hours and suggests intervention.
12. `recommend_next_action(leadId)`: Prescribes next best step for counselor.
