'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <Header />

        <section className="p-8">
          {children}
        </section>
      </main>
    </div>
  );
}
