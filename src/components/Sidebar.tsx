'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Database, Bot, Calendar, 
  CheckSquare, Building2, CreditCard, Settings, Sparkles, 
  LogOut, ExternalLink, Cpu, X 
} from 'lucide-react';

interface SidebarProps {
  user?: any;
  institute?: any;
}

export default function Sidebar({ user, institute }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setMobileOpen(prev => !prev);
    window.addEventListener('admitflow:toggle-sidebar', handleToggle);
    return () => window.removeEventListener('admitflow:toggle-sidebar', handleToggle);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = [
    { label: 'Dashboard & Insights', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Lead CRM Pipeline', href: '/crm', icon: Users },
    { label: 'Knowledge Brain (RAG)', href: '/knowledge', icon: Database },
    { label: 'AI Chat Sandbox', href: '/chat-sandbox', icon: Bot },
    { label: 'Counseling Scheduler', href: '/scheduler', icon: Calendar },
    { label: 'Follow-up Queue', href: '/followups', icon: CheckSquare },
    { label: 'Multi-Branch Hub', href: '/branches', icon: Building2 },
    { label: 'MCP & Integrations', href: '/integrations', icon: Cpu },
    { label: 'Billing & Plan', href: '/billing', icon: CreditCard },
    { label: 'Settings & Widget', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignored
    }
    localStorage.removeItem('admitflow_token');
    localStorage.removeItem('admitflow_user');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 min-h-screen transition-transform duration-200
        ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        md:static md:translate-x-0
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-extrabold text-white leading-none">AdmitFlow<span className="text-indigo-400">.ai</span></div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px]">
                {institute?.name || 'Apex Academy'}
              </div>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white md:hidden transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {user?.role === 'SUPER_ADMIN' && (
            <Link
              href="/sales"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all mb-2 ${
                pathname === '/sales'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-purple-400 bg-purple-950/20 border border-purple-800/40 hover:bg-purple-900/40'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-purple-400" />
              <span>B2B Sales CRM</span>
            </Link>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Live Widget Preview link */}
        <div className="p-3">
          <Link 
            href="/widget" 
            target="_blank"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Web Widget
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Link>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold text-white truncate">{user?.name || 'Rajesh Sharma'}</div>
              <div className="text-[10px] text-indigo-400 font-medium tracking-wide">
                {user?.role?.replace('_', ' ') || 'INSTITUTE OWNER'}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
