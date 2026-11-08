# AdmitFlow AI — Institute Owner Formal Acceptance Protocol
**Document ID**: OAP-2026-PILOT-01  
**Institute Name**: Prerna Career Institute (IIT-JEE & NEET Academy)  
**Authorized Owner**: Dr. Rajesh Verma (Director)  
**Assigned Technical Lead**: Senior SaaS Launch Engineer & Customer Success Architect  
**Current Status**: 🟡 **UNVERIFIED DEMO TENANT SPECIFICATION (SYNTHETIC BENCHMARK)**  

> [!CAUTION]
> **AUDIT CLASSIFICATION: UNVERIFIED DEMO TENANT**  
> Prerna Career Institute is an internal engineering test model. The founder has confirmed zero contact with this institute. This document functions as a standard acceptance checklist template to be executed with authentic, authorized coaching institute owners. No communication shall be sent to any synthetic contacts listed herein.  

---

> [!IMPORTANT]
> This acceptance protocol is a mandatory sign-off gateway before live student traffic is routed to the institute's widget. As per company policy, no feature or acceptance is marked "Completed" until Dr. Rajesh Verma personally executes and validates each checkpoint.

---

## 1. Owner Login & Security Credentials Verification
- [ ] **Access URL**: `https://app.admitflow.ai/login` (or Local Preview `http://localhost:3000/login`)
- [ ] **Authorized Identity**: `director@prernacareer.edu.in`
- [ ] **Initial Password Reset**: First-time login prompts immediate password change from temporary setup key.
- [ ] **Session Check**: Verify that session cookie is `httpOnly`, `SameSite=Lax`, and `Secure` over HTTPS.
- [ ] **Sign-Off Initial**: __________________ (Date: ____/____/2026)

---

## 2. Institute Profile, Branding & Multi-Branch Hierarchy
- [ ] **Institute Profile**:
  - Name: `Prerna Career Institute (IIT-JEE & NEET Academy)`
  - Emergency Admission Contact: `+91-744-2509988`
  - Slug: `prerna-career-institute`
- [ ] **Kota Main Campus (`branch-prerna-kota`)**:
  - Address: Road No. 2, Indraprastha Industrial Area, Kota, Rajasthan
  - Designated Headquarters: Yes
- [ ] **Jaipur Regional Center (`branch-prerna-jaipur`)**:
  - Address: Plot 18, Tonk Road, Near Gopalpura Flyover, Jaipur, Rajasthan
  - Designated Headquarters: No
- [ ] **Sign-Off Initial**: __________________ (Date: ____/____/2026)

---

## 3. Course Ground-Truth & Fee Schedules Approval
- [ ] **Course 1: Target IIT-JEE 2-Year Program (Class 11 to 12)**:
  - Base Fee: **₹1,50,000**
  - Installment Structure: Installment 1 = ₹60,000 | Installment 2 = ₹50,000 | Installment 3 = ₹40,000
  - Maximum Counselor Discretionary Discount: **20%**
- [ ] **Course 2: NEET Achiever Dropper Batch (Class 12 Pass)**:
  - Base Fee: **₹1,30,000**
  - Installment Structure: Installment 1 = ₹50,000 | Installment 2 = ₹45,000 | Installment 3 = ₹35,000
  - Maximum Counselor Discretionary Discount: **15%**
- [ ] **Sign-Off Initial**: __________________ (Date: ____/____/2026)

---

## 4. Official Prospectus & Policy Ingestion Approval
- [ ] **Refund Policy Ingestion**:
  - 100% tuition refund if requested within 15 calendar days from batch start date (₹10,000 administrative charge deducted).
  - 0% refund after 15 calendar days.
- [ ] **Hostel Tie-Up Rates**:
  - Indraprastha Kota & Gopalpura Jaipur partner hostels approved at ₹9,000 - ₹12,000/month (Twin sharing AC + 4 meals).
- [ ] **Scholarship Slabs**:
  - PTSE Exam merit waivers up to 90%.
  - Board exam 95%+ direct 15% discount.
  - Defence personnel children 20% concession.
- [ ] **Sign-Off Initial**: __________________ (Date: ____/____/2026)

---

## 5. Staff Role Allocation & Branch Access Controls
- [ ] **Sunita Sharma (`sunita.sharma@prernacareer.edu.in`)**:
  - Assigned Role: `ADMISSION_COUNSELLOR`
  - Assigned Branch: `branch-prerna-kota`
  - Access Scope: Only Kota leads, appointments, and follow-ups. System billing and institute settings inaccessible.
- [ ] **Vikram Rathore (`vikram.rathore@prernacareer.edu.in`)**:
  - Assigned Role: `ADMISSION_COUNSELLOR`
  - Assigned Branch: `branch-prerna-jaipur`
  - Access Scope: Only Jaipur leads, appointments, and follow-ups.
- [ ] **Sign-Off Initial**: __________________ (Date: ____/____/2026)

---

## 6. Formal Owner Declaration & Signature
```text
I, Dr. Rajesh Verma, Director of Prerna Career Institute, hereby certify that 
I have reviewed the configured academic courses, fee ground-truth, prospectus RAG chunks, 
and staff access policies. I authorize the technical deployment of the AdmitFlow AI 
web widget on our official website for the 14-Day Controlled Pilot.

Owner Signature: _____________________________________________
Date:            _____________________________________________
Institute Seal:
```
