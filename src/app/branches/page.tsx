'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { 
  Building2, Plus, MapPin, Phone, Mail, 
  TrendingUp, Users, CheckCircle2, X 
} from 'lucide-react';

export default function BranchesPage() {
  const [session, setSession] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchAnalytics, setBranchAnalytics] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const fetchBranches = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const m = await meRes.json();
        setSession(m);
        setBranches(m.branches || []);
      }

      const aRes = await fetch('/api/analytics');
      if (aRes.ok) {
        const aData = await aRes.json();
        setBranchAnalytics(aData.branchStats || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city, address, phone, email })
      });
      if (res.ok) {
        setShowAddModal(false);
        setName('');
        setCity('');
        setAddress('');
        fetchBranches();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add branch');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      <Sidebar user={session?.user} institute={session?.institute} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav 
          institute={session?.institute}
          branches={session?.branches || []}
          title="Multi-Branch Management & Comparison"
          subtitle="Cross-city center tracking, admissions attribution & counselor coverage"
        />

        <main className="p-6 space-y-6 flex-1 max-w-7xl w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white">Active Institute Centers</h2>
              <p className="text-xs text-slate-400">Total {branches.length} campuses connected to AdmitFlow AI</p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 self-start sm:self-auto transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Branch Center</span>
            </button>
          </div>

          {/* Branch Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {branches.map((b) => {
              const stats = branchAnalytics.find(s => s.branchId === b.id) || {
                totalLeads: 0,
                admissions: 0,
                conversionRate: '0.0'
              };

              return (
                <div key={b.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                        {b.city}
                      </span>
                      {b.isHeadquarters && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Headquarters
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-white">{b.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{b.address}</span>
                      </p>
                    </div>

                    {/* Stats pill */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                      <div className="p-2 rounded-xl bg-slate-950">
                        <div className="text-xs font-bold text-white">{stats.totalLeads}</div>
                        <div className="text-[10px] text-slate-400">Leads</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950">
                        <div className="text-xs font-bold text-emerald-400">{stats.admissions}</div>
                        <div className="text-[10px] text-slate-400">Admissions</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950">
                        <div className="text-xs font-bold text-indigo-400">{stats.conversionRate}%</div>
                        <div className="text-[10px] text-slate-400">Conv %</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800">
                    <span>Phone: {b.phone || 'N/A'}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> AI Active
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* ADD BRANCH MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-base">Register New Branch Center</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBranch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pune Kothrud Center"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Campus Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 4th Floor, City Pride Mall Complex, Kothrud"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Center Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91-20-41002000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Center Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pune@institute.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold"
                >
                  Save Branch Center
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
