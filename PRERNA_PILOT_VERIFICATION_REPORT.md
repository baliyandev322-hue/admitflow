# AdmitFlow AI — Prerna Data Provenance Audit & Hardening Report
**Document ID**: PVR-2026-PROVENANCE-AUDIT  
**Target Entity**: Prerna Career Institute (`inst-prerna-pilot`)  
**Audit Classification**: ⚠️ **UNVERIFIED_DEMO_TENANT (SYNTHETIC BENCHMARK DATA)**  
**Executive Disclosure**: The AdmitFlow founder has confirmed zero affiliation, prior contact, or authorization with Prerna Career Institute. This tenant was created entirely by engineering during development as a multi-branch simulation model. It is **NOT** a customer, confirmed prospect, or authorized pilot partner.

---

## 1. Data Provenance & Lineage Audit

Every database record associated with `inst-prerna-pilot` has been audited for lineage and source:

| Data Entity Category | Record Identifier | Value / Description | Source / Lineage | Classification |
|---|---|---|---|---|
| **Institute Profile** | `inst-prerna-pilot` | Prerna Career Institute (IIT-JEE & NEET Academy) | Created in `src/lib/pilot/prerna_seed.ts` (Phase 6) | 🔴 **Synthetic / Demo Data** |
| **Website & Slug** | `prerna-career-institute` | `https://demo.admitflow.invalid` | Safe RFC 2606 demo placeholder | 🔴 **Synthetic / Demo Data** |
| **Headquarters Branch** | `branch-prerna-kota` | Indraprastha Main Campus (Demo) | Fabricated multi-branch scenario | 🔴 **Synthetic / Demo Data** |
| **Regional Branch** | `branch-prerna-jaipur` | Tonk Road Center (Demo) | Fabricated multi-branch scenario | 🔴 **Synthetic / Demo Data** |
| **Owner Account** | `user-prerna-owner` | Dr. Rajesh Verma (Demo Persona) (`director@prerna-demo.invalid`) | Fictitious persona created for RBAC testing | 🔴 **Synthetic / Demo Data** |
| **Counselor 1** | `user-prerna-counsellor-sunita` | Sunita Sharma (Demo Persona) (`sunita.sharma@prerna-demo.invalid`) | Fictitious counselor persona | 🔴 **Synthetic / Demo Data** |
| **Counselor 2** | `user-prerna-counsellor-vikram` | Vikram Rathore (Demo Persona) (`vikram.rathore@prerna-demo.invalid`) | Fictitious counselor persona | 🔴 **Synthetic / Demo Data** |
| **Course 1** | `course-prerna-jee-2yr` | Target IIT-JEE 2-Yr (Base: ₹1,50,000) | Modeled fee structure for coaching benchmarks | 🔴 **Synthetic / Demo Data** |
| **Course 2** | `course-prerna-neet-dropper` | NEET Achiever Dropper (Base: ₹1,30,000) | Modeled fee structure for coaching benchmarks | 🔴 **Synthetic / Demo Data** |
| **Prospectus** | `doc-prerna-prospectus-2026` | 4 Vector Chunks (Fees, Refund, Hostels, PTSE) | Seeded markdown string in `prerna_seed.ts` | 🔴 **Synthetic / Demo Data** |
| **Student Lead** | `lead-1794125136164` | "Aarav Sharma" (`aarav.jee27@gmail.com`) | Injected by automated test `phase6_pilot_acceptance_test` | 🔴 **Synthetic / Demo Data** |
| **Appointments** | `apt-1794125136253`, `apt-1794125136220` | Scheduled counseling session records | Injected by automated test `phase6_pilot_acceptance_test` | 🔴 **Synthetic / Demo Data** |

---

## 2. Exact Counts: Individual Synthetic Records vs. Entity Categories

To eliminate ambiguous reporting terminology, here is the exact forensic distinction between **Entity Categories** and **Individual Records**:

| Entity Category | Database Table / Field | Individual Records Count | Notes on Origin |
|---|---|:---:|---|
| **1. Institutes** | `institutes` | **2** | Primary seed + test idempotency record |
| **2. Branches** | `branches` | **2** | Kota HQ (`branch-prerna-kota`) & Jaipur (`branch-prerna-jaipur`) |
| **3. Users** | `users` | **3** | Owner (Dr. Verma) + 2 Counselors (Sunita, Vikram) |
| **4. Courses** | `courses` | **4** | JEE 2-Yr & NEET Dropper (with seed duplicates) |
| **5. Batches** | `batches` | **2** | Kota Morning Super-50 & Jaipur FastTrack |
| **6. Knowledge Documents** | `knowledge_documents` | **1** | `doc-prerna-prospectus-2026` |
| **7. Document Chunks** | `document_chunks` | **4** | Fees, Refund, Hostel, Scholarship vector chunks |
| **8. Leads** | `leads` | **1** | Test student "Aarav Sharma" |
| **9. Lead Activities** | `lead_activities` | **70** | Automated test event logging (status changes, queries, counseling) |
| **10. Appointments** | `appointments` | **2** | Test appointment bookings |
| **11. Follow-ups** | `followups` | **1** | Automated test follow-up record |
| **12. Pilot Tracking** | `pilot_tracking` | **1** | `pilot-track-prerna` (`UNVERIFIED_DEMO_TENANT`) |
| **TOTALS** | **12 Entity Categories** | **93 Individual Records** | **100% Synthetic / Zero Real Customer Data** |

---

## 3. Safe Demo Placeholders Enforced (RFC 2606 & Dummy Numbers)

All realistic-looking synthetic email addresses and phone numbers have been replaced with safe, unroutable demo placeholders:

- **Email Domain**: Replaced `.edu.in` with `.invalid` (RFC 2606 reserved top-level domain). No email server on the internet can route or deliver to `.invalid`.
  - Institute: `admissions@prerna-demo.invalid`
  - Owner: `director@prerna-demo.invalid`
  - Counselor 1: `sunita.sharma@prerna-demo.invalid`
  - Counselor 2: `vikram.rathore@prerna-demo.invalid`
  - Branch Emails: `kota-branch@prerna-demo.invalid`, `jaipur-branch@prerna-demo.invalid`
- **Phone Numbers**: Replaced realistic digits (`+91-98290...`, `+91-744...`) with reserved non-dialable dummy numbers:
  - Institute: `+91-00000-00000`
  - Kota Campus: `+91-00000-00001`
  - Jaipur Center: `+91-00000-00002`
  - Staff: `+91-00000-00010`, `+91-00000-00011`, `+91-00000-00012`
- **Website**: `https://demo.admitflow.invalid`

---

## 4. Production Seed Blocking (Gated Environment)

- `seedPrernaPilotInstitute()` in `src/lib/pilot/prerna_seed.ts` is now strictly restricted:
  - If `process.env.NODE_ENV === 'production'` and `process.env.ALLOW_DEMO_SEED !== 'true'`, the function immediately aborts and returns `{ blockedInProduction: true, institute: null }`.
  - Automatic synthetic tenant creation in a production deployment is 100% prevented.

---

## 5. Server-Side Communication Blocking (`src/lib/safety.ts`)

A centralized server-side safety enforcement barrier (`checkOutboundCommunication`) is active across all communication pathways:

1. **WhatsApp Meta Connector (`src/lib/mcp/whatsapp.ts`)**:
   - `sendApprovedTemplate()` verifies `checkOutboundCommunication(this.instituteId)`.
   - Any message attempt for `inst-prerna-pilot` or `UNVERIFIED_DEMO_TENANT` returns `success: false`, `status: 'BLOCKED_NO_CONSENT'`, and `liveMetaDispatch: false`.
2. **Google Calendar Connector (`src/lib/mcp/calendar.ts`)**:
   - `createEvent()` verifies `checkOutboundCommunication(this.instituteId)`.
   - Throws error: `BLOCKED_DEMO_TENANT_COMMUNICATION: Outbound communication blocked for UNVERIFIED_DEMO_TENANT.`
3. **Counselor Follow-up Dispatch (`src/app/api/followups/route.ts`)**:
   - Approving or completing a follow-up for `UNVERIFIED_DEMO_TENANT` returns `HTTP 403 Forbidden` with code `BLOCKED_DEMO_TENANT_COMMUNICATION`.
4. **Target Address Interceptor**:
   - Any communication attempt to `.invalid`, `.example`, `.test`, or `+91-00000...` dummy numbers is rejected immediately.

---

## 6. Apex Academy 18 Leads Audit & Tenant Isolation

- **Preservation Check**: Apex Academy (`inst-apex-001`) has exactly **18 leads** in `data/admitflow_db.json`. Zero records were modified or deleted.
- **Tenant Isolation**:
  - Unauthenticated access to `/api/leads` returns **HTTP 401 Unauthorized**.
  - Users from other tenants (`inst-codecraft-002`, `inst-prerna-pilot`) querying `/api/leads` receive **0 leads** from Apex Academy.
  - Apex Academy's owner (`rajesh@apexacademy.in`) successfully retrieves all 18 leads under their own tenant.
  - Public widget endpoints do not expose or leak any CRM leads or student PII.

---

## 7. Public Widget & Demo Safeguards

1. **Header Identification**:
   - `/widget?slug=prerna-career-institute` displays a prominent **`DEMO SANDBOX`** badge in the widget header.
2. **Bottom Disclaimer**:
   - A persistent footer notice is displayed:
     > *"⚠️ Synthetic Testing Sandbox: Demo data only. Not an active customer or commercial agreement."*
3. **Internal Console Warning**:
   - Tab 3 of `/sales` displays the `UNVERIFIED_DEMO_TENANT` classification banner, explicitly reminding internal staff that this is a technical sandbox.

---

## 8. Grounded Retrieval Audit & Removal of Unsupported "0.0% Hallucination" Claim

- **Correction**: Previous heuristic claims of a "0.0% Hallucination Rate" based on 3 unit test regex assertions have been fully retracted.
- **Accurate Evaluation Findings**:
  - Unit tests verified keyword matching (*fees, installments, hostel, refund*) against the seeded demo chunks.
  - A formal multi-query evaluation benchmark (e.g. 500+ query test harness) is required before certifying statistical accuracy in production.
