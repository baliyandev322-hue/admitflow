'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('rajesh@apexacademy.in');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
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
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-white">AdmitFlow<span className="text-indigo-400">.ai</span></span>
          </Link>
          <h1 className="text-xl font-bold text-white">Sign In to Your Institute</h1>
          <p className="text-xs text-slate-400 mt-1">Access admission pipelines, counselor queues & AI brain</p>
        </div>

        {/* Demo credentials pill */}
        <div className="mb-6 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300">
          <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-indigo-400" /> Demo Credentials Pre-filled:
          </div>
          <div className="space-y-0.5 text-[11px] text-slate-300">
            <div><strong>Director:</strong> rajesh@apexacademy.in (Password123!)</div>
            <div><strong>Counselor:</strong> priya@apexacademy.in (Password123!)</div>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="director@institute.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <span className="text-[11px] text-indigo-400 hover:underline cursor-pointer">Forgot?</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          New institute?{' '}
          <Link href="/signup" className="text-indigo-400 font-semibold hover:underline">
            Register your coaching center
          </Link>
        </div>
      </div>
    </div>
  );
}
