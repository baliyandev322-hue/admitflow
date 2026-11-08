import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-200 py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Privacy Policy & DPDP Compliance</h1>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed bg-slate-900/60 border border-slate-800 p-8 rounded-2xl">
          <p>Last updated: November 2026</p>

          <h2 className="text-lg font-bold text-white pt-2">1. Overview & Data Fiduciary Role</h2>
          <p>
            AdmitFlow AI Technologies Pvt Ltd acts as a Data Processor for educational institutes and coaching centers. Educational institutes using AdmitFlow AI are the Data Fiduciaries under the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> of India.
          </p>

          <h2 className="text-lg font-bold text-white pt-2">2. Multi-Tenant Data Isolation</h2>
          <p>
            Every educational institute's student enquiries, leads, phone numbers, and knowledge base documents are strictly isolated by unique tenant UUIDs. Student data from Institute A is cryptographically and logically inaccessible to Institute B.
          </p>

          <h2 className="text-lg font-bold text-white pt-2">3. AI & LLM Data Governance</h2>
          <p>
            We strictly do NOT use proprietary coaching institute prospectuses, fee sheets, or student conversation data to train foundation LLMs. RAG vector embeddings are queried only during the runtime inference of the respective tenant.
          </p>

          <h2 className="text-lg font-bold text-white pt-2">4. Student Consent & Communication Preferences</h2>
          <p>
            AdmitFlow AI respects opt-out signals across all messaging channels. Students can opt out of automated counselor follow-ups at any time by texting 'STOP' or communicating their preference to the admission assistant.
          </p>

          <h2 className="text-lg font-bold text-white pt-2">5. Contact Grievance Officer</h2>
          <p>
            For any DPDP compliance or data deletion inquiries, contact our Data Protection Officer at <code>dpo@admitflow.ai</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
