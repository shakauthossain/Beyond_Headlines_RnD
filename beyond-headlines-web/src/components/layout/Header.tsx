'use client';

import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Newspaper, FileText, Search, PenTool, ClipboardCheck, Package, Send } from 'lucide-react';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'News Intelligence', href: '/dashboard/clusters', icon: Newspaper },
  { name: 'Topic Brief', href: '/dashboard/briefs', icon: FileText },
  { name: 'Research Workspace', href: '/dashboard/research', icon: Search },
  { name: 'Drafting Editor', href: '/dashboard/editor', icon: PenTool },
  { name: 'Sub-editing', href: '/dashboard/sub-editing', icon: ClipboardCheck },
  { name: 'Packaging', href: '/dashboard/packaging', icon: Package },
  { name: 'Publishing', href: '/dashboard/publishing', icon: Send },
];

export default function Header() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center space-x-2 text-slate-500">
        <span className="text-sm font-medium">Notionhive</span>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-900">
          {navItems.find(i => pathname === i.href)?.name || 'Dashboard'}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex flex-col items-end mr-2">
          <span className="text-sm font-semibold text-slate-900">{user.name}</span>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{user.role}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden">
           {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
           ) : (
            <UserIcon size={20} className="text-slate-400" />
           )}
        </div>
      </div>
    </header>
  );
}
