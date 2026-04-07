'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Newspaper, 
  FileText, 
  Search, 
  PenTool, 
  ClipboardCheck, 
  Package, 
  Send,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { logout } = useAuth();
  const pathname = usePathname();

  return (
    <aside 
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-[#1a1a1a] text-slate-300 transition-all duration-300 flex flex-col fixed h-full z-20`}
    >
      <div className="p-6 flex items-center justify-between border-b border-white/5">
        {isOpen ? (
          <span className="font-bold text-xl text-white tracking-tight">B. Headlines</span>
        ) : (
          <span className="font-bold text-xl text-white tracking-tight">BH</span>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-white/10 rounded"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="flex-1 mt-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-red-600/90 text-white shadow-sm' 
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} className={isOpen ? 'mr-3' : 'mx-auto'} />
              {isOpen && <span className="font-medium text-sm">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={logout}
          className="flex items-center w-full p-3 rounded-lg hover:bg-red-950/30 hover:text-red-400 font-medium text-sm transition-colors"
        >
          <LogOut size={20} className={isOpen ? 'mr-3' : 'mx-auto'} />
          {isOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
