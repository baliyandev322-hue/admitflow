# AdmitFlow AI — DPDP Act (India) Compliance Checklist

AdmitFlow AI is architected from day one to strictly comply with the **Digital Personal Data Protection (DPDP) Act 2023** and Meta Business Messaging Policies.

---

## 1. Compliance Controls Implemented

| Requirement | Implementation in AdmitFlow AI | Status |
|---|---|:---:|
| **Notice & Explicit Consent** | When students share phone numbers in widget or chat, explicit consent checkbox is recorded with timestamp (`whatsappConsent: true`, `whatsappConsentAt`). | ✅ Verified |
| **Purpose Limitation** | Student data is only used for educational counseling, batch timings, and admission follow-ups for that specific institute. | ✅ Verified |
| **Right to Withdraw / Opt-Out** | Inbound webhook listens for `STOP`, `UNSUBSCRIBE`, or `OPT OUT`. The system immediately sets `whatsappConsent = false` and blocks future automated messages. | ✅ Verified |
| **Tenant Data Isolation** | Student records belonging to Institute A cannot be queried, exported, or viewed by Institute B under any circumstance. | ✅ Verified |
| **Data Minimization** | File uploads only accept educational marksheets (Class 10/12, Photo, ID proof) with strict 2MB limits and role-based staff access. | ✅ Verified |
| **No Authentication Faking** | AdmitFlow explicitly declares that document completeness tracking does not certify official government authenticity without sanctioned DigiLocker integration. | ✅ Verified |
| **Right to Erasure** | Admins and counselors can archive or drop lead records with audit trail logging. | ✅ Verified |

---

## 2. Recommended Privacy Notice for Institute Websites

Include this clause in your institute website admission terms:

> *"By submitting your enquiry on this website, you consent to receive admission details, batch timings, fee structures, and counselling updates via WhatsApp, SMS, or Phone from [Institute Name] and its authorized counseling partners powered by AdmitFlow AI. You may opt out at any time by replying STOP to any WhatsApp message."*
