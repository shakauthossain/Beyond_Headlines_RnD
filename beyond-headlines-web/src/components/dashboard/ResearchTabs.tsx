'use client';

import React, { useState } from 'react';
import { ResearchSession } from '@/types';
import { 
  History, 
  ExternalLink, 
  Clock, 
  Database, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar,
  Layers,
  Search
} from 'lucide-react';

interface ResearchTabsProps {
  session: ResearchSession;
}

export default function ResearchTabs({ session }: ResearchTabsProps) {
  const [activeTab, setActiveTab] = useState<'sources' | 'timeline' | 'data' | 'gaps'>('sources');

  const tabs = [
    { id: 'sources', label: 'Primary Sources', icon: Database },
    { id: 'timeline', label: 'Event Timeline', icon: Clock },
    { id: 'data', label: 'Key Data Points', icon: Layers },
    { id: 'gaps', label: 'Information Gaps', icon: AlertTriangle },
  ] as const;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-slate-100 bg-slate-50/50">
        <nav className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-bold transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                }`}
              >
                <Icon size={16} className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-8">
        {activeTab === 'sources' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">Expertise & Credibility Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {session.sources.map((s, i) => (
                <div key={i} className="p-4 border border-slate-100 rounded-lg bg-slate-50/30 hover:border-slate-200 transition">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900 line-clamp-1">{s.title}</span>
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-red-600">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{s.summary}</p>
                  <div className="flex items-center space-x-2">
                    <div className={`text-[10px] uppercase tracking-tighter font-black px-2 py-0.5 rounded flex items-center ${
                       s.credibility === 'High' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      <ShieldCheck size={10} className="mr-1" />
                      {s.credibility} Tier
                    </div>
                    <span className="text-[10px] text-slate-400 italic">
                      Source: {s.domain || (s.url && s.url.startsWith('http') ? (new URL(s.url).hostname) : 'Unknown')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {session.timeline.map((event, i) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 group-hover:bg-red-600 group-hover:text-white transition-all duration-500 shadow-sm z-10 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                   <Calendar size={14} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm ring-1 ring-slate-900/5">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-black text-xs text-red-600 uppercase tracking-widest">{event.date}</div>
                  </div>
                  <div className="text-slate-600 text-sm font-medium">{event.event}</div>
                  <div className="mt-2 text-[10px] text-slate-400 uppercase tracking-tighter font-bold">{event.impact}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'data' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {session.dataPoints.map((dp, i) => (
              <div key={i} className="p-6 border border-slate-100 rounded-xl bg-white shadow-sm hover:ring-2 hover:ring-red-100 transition-all">
                <div className="text-3xl font-black text-red-600 mb-2">{dp.value}</div>
                <div className="text-sm font-bold text-slate-900 mb-1">{dp.metric}</div>
                <div className="text-xs text-slate-500 font-medium leading-relaxed">{dp.context}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'gaps' && (
          <div className="space-y-4">
            <div className="p-6 bg-slate-900 rounded-xl text-white mb-8 border-l-4 border-amber-500">
               <h4 className="text-lg font-black mb-2 flex items-center">
                 <AlertTriangle className="text-amber-500 mr-2" size={20} />
                 Investigative Priority: Unknown Factors
               </h4>
               <p className="text-slate-400 text-sm leading-relaxed">
                 The following areas lack sufficient verifiable documentation. Editorial discretion is advised for these angles.
               </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {session.gaps.map((gap, i) => (
                <div key={i} className="flex items-start p-5 border border-amber-100 bg-amber-50/30 rounded-xl">
                  <div className="bg-amber-100 p-2 rounded-lg mr-4">
                    <Search className="text-amber-700" size={16} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 mb-1">{gap.topic}</h5>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{gap.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
