import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-200 py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Terms and Conditions</h1>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed bg-slate-900/60 border border-slate-800 p-8 rounded-2xl">
          <p>Last updated: November 2026</p>

          <h2 className="text-lg font-bold text-white pt-2">1. Subscription Plans & Quotas</h2>
          <p>
            AdmitFlow AI provides subscription tiers (Starter, Growth, Pro, Enterprise) on a monthly or annual billing cycle. Overages on active leads or RAG vector queries are subject to plan upgrade or fair-use policy limits.
          </p>

          <h2 className="text-lg font-bold text-white pt-2">2. Acceptable Use Policy</h2>
          <p>
            Institutes agree not to use the automated messaging channels for spam, unsolicited bulk marketing, or misleading student claims. All fees and scholarship information uploaded to the AI Knowledge Brain must accurately reflect the institute's authorized policies.
          </p>

          <h2 className="text-lg font-bold text-white pt-2">3. Uptime & SLA</h2>
          <p>
            We target a 99.9% uptime for conversational RAG widgets and webhook ingestion. Maintenance windows are scheduled during non-peak student hours (2 AM – 5 AM IST).
          </p>
        </div>
      </div>
    </div>
  );
}
