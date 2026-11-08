# AdmitFlow AI — 14-Day Controlled Pilot Daily Observation Runbook
**Institute**: Prerna Career Institute (IIT-JEE & NEET Academy)  
**Pilot Window**: Day 1 to Day 14  
**Primary Operators**: Dr. Rajesh Verma (Director), Sunita Sharma (Kota), Vikram Rathore (Jaipur)  
**Lead Engineer / Auditor**: Senior SaaS Launch Engineer  
**Privacy Status**: Strictly DPDP Act 2023 Compliant (All student PII masked)  

---

## 1. Daily Observation Tracking Matrix (Day 1 to Day 14)

| Day | Real Enquiries | Leads Captured | Grounded RAG Accuracy (%) | Out-of-Scope / Unanswered | Avg Counselor Latency | Counselling Appointments | Follow-ups Completed | Opt-outs (STOP) | Errors / 500s | Daily Status |
|---|---|---|---|---|---|---|---|---|---|---|
| **Day 1**  | [Count] | [Count] | [Rate %] | [Count] | [Mins] | [Count] | [Count] | [Count] | [Count] | 🟡 Awaiting Live Day 1 |
| **Day 2**  | -- | -- | -- | -- | -- | -- | -- | -- | -- | ⚪ Pending |
| **Day 3**  | -- | -- | -- | -- | -- | -- | -- | -- | -- | ⚪ Pending |
| **Day 4**  | -- | -- | -- | -- | -- | -- | -- | -- | -- | ⚪ Pending |
| **Day 5**  | -- | -- | -- | -- | -- | -- | -- | -- | -- | ⚪ Pending |
| **Day 6**  | -- | -- | -- | -- | -- | -- | -- | -- | -- | ⚪ Pending |
| **Day 7**  | -- | -- | -- | -- | -- | -- | -- | -- | -- | ⚪ Weekly Sync 1 |
| **Day 8**  | -- | -- | -- | -- | -- | -- | -- | -- | -- | ⚪ Pending |
| **Day 9**  | -- | -- | -- | -- | -- | -- | -- | -- | -- | ⚪ Pending |
| **Day 10** | -- | -- | -- | -- | -- | -- | -- | -- | -- | ⚪ Pending |
| **Day 11** | -- | -- | -- | -- | -- | -- | -- | -- | -- | ⚪ Pending |
| **Day 12** | -- | -- | -- | -- | -- | -- | -- | -- | -- | ⚪ Pending |
| **Day 13** | -- | -- | -- | -- | -- | -- | -- | -- | -- | ⚪ Pending |
| **Day 14** | -- | -- | -- | -- | -- | -- | -- | -- | -- | ⚪ Final Review |

> [!NOTE]
> All metrics in this runbook must strictly reflect real database records. Zero placeholder or fabricated figures are permitted.

---

## 2. Unanswered & Out-of-Scope Question Logging Protocol
When the AI assistant answers with fallback grounding ("I am sorry, this specific information is not in the official prospectus..."):
1. The question text is automatically recorded in the `unanswered_queries` audit stream.
2. The Center Manager reviews the log during the 01:30 PM sync.
3. If valid institute policy exists, a new RAG knowledge chunk is authored in the Knowledge Brain within 2 hours.

---

## 3. Mandatory Student Privacy & Masking Rules (DPDP Act 2023)
In compliance with the Digital Personal Data Protection Act:
- **Phone Numbers**: Must be masked in all analytical dashboards and exported CSVs (`+91-98****9988`).
- **Email Addresses**: Must be masked (`a***@gmail.com`).
- **Student Minors**: All communications must record voluntary parental/guardian consent timestamp.
- **Immediate Opt-Out**: Upon receiving an inbound `STOP`, student record is flagged `whatsappConsent = false` and excluded from subsequent outreach.
