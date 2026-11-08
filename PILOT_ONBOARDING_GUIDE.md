# AdmitFlow AI — First Pilot Onboarding Guide

Welcome to the AdmitFlow AI Pilot Program! This guide walks institute owners and operational heads through onboarding their coaching academy in under 15 minutes.

---

## 1. Quick Onboarding Checklist (15-Minute Setup)

1. **Create Institute Account:**
   * Navigate to `/signup` on your AdmitFlow domain.
   * Provide Institute Name (e.g. *Apex Academy*), Headquarters City, Owner Email, and Admin Password (min. 8 characters).
   * Your secure institute tenant workspace is immediately provisioned with a 14-day Pro trial.

2. **Configure Campuses / Branches (`/branches`):**
   * Default headquarters campus is created automatically.
   * Add physical branch centers (e.g. *Kota Vigyan Nagar Center*, *Jaipur Gopalpura Center*).

3. **Define Academic Courses & Ground-Truth Fees (`/knowledge`):**
   * Add each program (e.g. *Target JEE Main + Advanced 2027*, *NEET Dropper Achiever Batch*).
   * Enter Base Fee, Minimum Initial Installment, and Maximum Discount %.
   * *The AI agent will never quote fees outside these exact values.*

4. **Upload Knowledge Prospectus (`/knowledge`):**
   * Upload official admission brochure, fee refund policy, hostel details, and scholarship test rules.
   * AdmitFlow RAG engine chunks and indexes vectors into semantic embeddings within 10 seconds.

5. **Invite Admission Counselors (`/settings`):**
   * Create counselor accounts with role `ADMISSION_COUNSELLOR`.
   * Assign primary branch centers to balance inquiry distribution.

6. **Embed Website Chat Widget (`/settings`):**
   * Copy the 1-line script tag and paste before `</body>` on your WordPress, Webflow, or custom website:
     ```html
     <script src="https://your-admitflow-domain.com/api/widget/embed.js" data-institute-slug="your-slug"></script>
     ```

---

## 2. Testing the Pilot Experience

* Open `/chat-sandbox` from the sidebar.
* Ask queries in English, Hindi, and Hinglish:
  * *"Dropper batch ki timings aur hostel fee kitni hai?"*
  * *"Is there any scholarship for Class 10 board toppers?"*
* Verify that the AI cites your prospectus and never invents unverified policies.
