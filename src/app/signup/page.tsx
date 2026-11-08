'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Building, User, Mail, Phone, Lock, MapPin, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [instituteName, setInstituteName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('Jaipur');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instituteName,
          ownerName,
          email,
          phone,
          password,
          city,
          address: address || `${city} Main Campus`
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('admitflow_token', data.token);
      localStorage.setItem('admitflow_user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xl font-black text-white">AdmitFlow<span className="text-indigo-400">.ai</span></span>
          </Link>
          <h1 className="text-xl font-bold text-white">Onboard Your Coaching Institute</h1>
          <p className="text-xs text-slate-400 mt-1">Setup your AI admission agent in under 2 minutes</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Institute / Academy Name</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                required
                value={instituteName}
                onChange={(e) => setInstituteName(e.target.value)}
                placeholder="e.g. Zenith Career Institute"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Director / Owner Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Dr. Anand Verma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Official Mobile / WhatsApp</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-9876543210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="director@zenith.edu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Primary City</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Kota, Jaipur, Delhi"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Headquarters Campus Area</label>
              <input 
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Gopalpura Bypass"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Creating Institute Workspace...' : 'Launch Institute AI (14-Day Free Trial)'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link href="/login" className="text-indigo-400 font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
