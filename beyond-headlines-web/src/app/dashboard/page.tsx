'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, FileText, Clock, CheckCircle } from 'lucide-react';

const stats = [
  { name: 'Emerging Clusters', value: '12', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Drafts in Progress', value: '4', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
  { name: 'Pending Review', value: '2', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
  { name: 'Published Today', value: '1', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}</h1>
        <p className="text-slate-500 mt-1">Here's an overview of the editorial pipeline today.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Recent Clusters</h3>
          <div className="space-y-4">
            <p className="text-sm text-slate-500 italic">No clusters discovered yet. The scraper is running...</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Your Drafts</h3>
          <div className="space-y-4">
            <p className="text-sm text-slate-500 italic">You don't have any active drafts. Head to News Intelligence to start.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
