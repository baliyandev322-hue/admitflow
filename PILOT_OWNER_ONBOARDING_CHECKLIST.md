# AdmitFlow AI — Pilot Institute Owner Onboarding Checklist
**Target Institute**: Prerna Career Institute (IIT-JEE & NEET Academy)  
**Lead Owner**: Dr. Rajesh Verma (Director)  
**AdmitFlow Success Manager**: Senior Customer Success Architect  
**Version**: 1.0 (P6 Real-World Pilot)  

---

## Pre-Launch Setup (Day -1)
- [x] **Institute Profile & Branding**
  - Verify official institute name: `Prerna Career Institute (IIT-JEE & NEET Academy)`
  - Slug registered: `prerna-career-institute`
  - Contact email configured: `admissions@prernacareer.edu.in`
  - Emergency contact: `+91-744-2509988`
  - Logo and brand color themes set in Settings.
- [x] **Multi-Branch Hierarchy**
  - Kota Head Campus (`branch-prerna-kota` — Indraprastha Industrial Area)
  - Jaipur Center (`branch-prerna-jaipur` — Tonk Road)
- [x] **User Accounts & Role-Based Access Control (RBAC)**
  - Owner Account: `director@prernacareer.edu.in` (`INSTITUTE_OWNER`)
  - Counselor 1: `sunita.sharma@prernacareer.edu.in` (`ADMISSION_COUNSELLOR`, Kota Branch)
  - Counselor 2: `vikram.rathore@prernacareer.edu.in` (`ADMISSION_COUNSELLOR`, Jaipur Branch)
  - Counselors have CRM and scheduling access; system-wide billing and institute config restricted to Owner.
- [x] **Course Ground-Truth & Fee Schedules**
  - Target IIT-JEE 2-Year Program: ₹1,50,000 (3 installments: ₹60k, ₹50k, ₹40k)
  - NEET Achiever Dropper Batch: ₹1,30,000 (3 installments: ₹50k, ₹45k, ₹35k)
  - Maximum counselor discount limit configured: 20% (JEE) / 15% (NEET)
- [x] **Official Prospectus RAG Ingestion**
  - 2026-27 Prospectus PDF uploaded & chunked into 4 semantic vectors.
  - Refund policy indexed (15-day window, ₹10,000 deduction).
  - Hostel & mess verified (Kota & Jaipur tie-up ₹9k-₹12k/month).
  - PTSE Scholarship slabs indexed (up to 90% merit waiver).
- [x] **Website Chat Widget Embedding**
  - Script snippet placed before `</body>` on `prernacareer.edu.in`:
    ```html
    <iframe src="https://app.admitflow.ai/widget?slug=prerna-career-institute" 
            style="position:fixed;bottom:20px;right:20px;width:380px;height:600px;border:none;z-index:9999;"></iframe>
    ```
  - DPDP Consent clause verified on student lead capture form.

---

## Launch Day (Day 1)
- [ ] **End-to-End Chat Test**: Director performs live test enquiry via chat widget on mobile and desktop.
- [ ] **Lead Verification**: Confirm test inquiry immediately appears in Counselor Sunita Sharma's CRM column.
- [ ] **Counselor Briefing**: Ensure Sunita and Vikram have logged in and completed the Counselor Training Checklist.
- [ ] **Notification Check**: Verify inbound lead alerts via email or WhatsApp webhook.

---

## Week 1 Review (Day 7)
- [ ] Total visitor conversations initiated vs. contact details captured.
- [ ] Zero AI hallucination audit on fee quotes and refund queries.
- [ ] Average counselor response time to newly captured leads.
- [ ] Review booked counseling appointments and attendance rate.
