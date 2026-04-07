'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  Loader2, 
  ShieldCheck, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layout,
  Type,
  FileSearch,
  RefreshCcw,
  Plus
} from 'lucide-react';

function SubEditingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const articleId = searchParams.get('articleId');
  
  const [article, setArticle] = useState<any>(null);
  const [subEditResult, setSubEditResult] = useState<any>(null);
  const [headlinesResult, setHeadlinesResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const [headlines, setHeadlines] = useState<string[]>(['']);
  const [selectedHeadline, setSelectedHeadline] = useState('');

  const fetchData = async () => {
    if (!articleId) return;
    setIsLoading(true);
    try {
      const resp = await api.get(`/articles/${articleId}`);
      setArticle(resp.data.data);
      setHeadlines([resp.data.data.title]);
      
      // Attempt to load existing sub-edit report if needed (for now we re-generate)
      await runSubEdit();
    } catch (err: any) {
      setError('Article not found.');
    } finally {
      setIsLoading(false);
    }
  };

  const runSubEdit = async () => {
    if (!articleId) return;
    setIsProcessing(true);
    try {
      const resp = await api.post(`/articles/${articleId}/sub-edit`);
      setSubEditResult(resp.data.data);
    } catch (err: any) {
      console.error('Sub-edit failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const runHeadlineScore = async () => {
    if (!articleId || headlines.filter(h => h.trim()).length === 0) return;
    setIsProcessing(true);
    try {
      const resp = await api.post(`/articles/${articleId}/headlines-score`, { 
        headlines: headlines.filter(h => h.trim()) 
      });
      setHeadlinesResult(resp.data.data);
    } catch (err: any) {
      console.error('Headline scoring failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateHeadline = (index: number, value: string) => {
    const next = [...headlines];
    next[index] = value;
    setHeadlines(next);
  };

  const addHeadline = () => setHeadlines([...headlines, '']);

  useEffect(() => {
    if (articleId) fetchData();
  }, [articleId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-12 w-12 text-red-600 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Senior Sub-Editor Analyzing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="mb-8 border-b border-slate-200 pb-6 flex items-center justify-between">
        <div>
           <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">
             <span>Step 4: Drafting</span>
             <ChevronRight size={10} />
             <span className="text-red-600">Step 5: Sub-Editing & Quality Control</span>
           </div>
           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Editorial Review</h1>
           <p className="text-slate-500 mt-1 font-medium">Refining clarity, verifying brand voice, and optimizing headlines.</p>
        </div>
        
        <button 
          onClick={() => router.push(`/dashboard/packaging?articleId=${articleId}`)}
          className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition shadow-lg transition-all"
        >
          Proceed to Packaging (Step 6)
          <ChevronRight size={18} className="ml-2" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Quality Analysis Column */}
        <div className="lg:col-span-12 space-y-8">
           {/* 1. Headline Scoring Section */}
           <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                 <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center">
                    <Type className="mr-2 text-red-600" size={16} />
                    Headline Optimization
                 </h2>
                 <button 
                  onClick={runHeadlineScore}
                  disabled={isProcessing}
                  className="text-[10px] font-black uppercase text-red-600 hover:text-red-700 flex items-center"
                 >
                   {isProcessing ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Zap size={12} className="mr-1 fill-red-600/20" />}
                   Score Headlines
                 </button>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Draft Options</h3>
                    {headlines.map((h, i) => (
                      <div key={i} className="flex group">
                         <input 
                          value={h}
                          onChange={(e) => updateHeadline(i, e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-l-lg px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-600/20"
                          placeholder="Enter alternative headline..."
                         />
                         <button 
                          onClick={() => setSelectedHeadline(h)}
                          className={`px-4 rounded-r-lg border-y border-r transition ${
                            selectedHeadline === h ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                          }`}
                         >
                           {selectedHeadline === h ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                         </button>
                      </div>
                    ))}
                    <button 
                      onClick={addHeadline}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center py-2"
                    >
                      <Plus size={14} className="mr-1" /> Add Variant
                    </button>
                 </div>

                 <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100 min-h-[200px]">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">AI Scoreboard</h3>
                    {headlinesResult ? (
                      <div className="space-y-4">
                         {headlinesResult.scores.map((s: any, i: number) => (
                           <div key={i} className="flex items-start">
                              <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-black text-xs ${
                                s.score >= 8 ? 'bg-emerald-500 text-white' : s.score >= 6 ? 'bg-amber-500 text-white' : 'bg-slate-300 text-white'
                              }`}>
                                {s.score}
                              </div>
                              <div className="ml-3">
                                 <div className="text-xs font-bold text-slate-800 mb-1">{s.headline}</div>
                                 <p className="text-[10px] text-slate-400 leading-tight italic">{s.feedback}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                         <FileSearch size={32} strokeWidth={1} />
                         <span className="text-[10px] uppercase font-black tracking-widest mt-2">No score available</span>
                      </div>
                    )}
                 </div>
              </div>
           </section>

           {/* 2. Sub-editing Report */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                 <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                       <Layout className="mr-3 text-blue-600" size={22} />
                       AI Clarity & Flow Audit
                    </h2>
                    
                    {subEditResult ? (
                      <div className="space-y-6">
                         {subEditResult.clarity_issues.map((issue: any, i: number) => (
                           <div key={i} className="p-5 border-l-4 border-red-500 bg-red-50/30 rounded-r-xl">
                              <div className="flex items-center text-[10px] font-black uppercase text-red-600 tracking-widest mb-2">
                                <AlertTriangle size={12} className="mr-1.5" />
                                Clarity Issue — Para {issue.paragraph_index + 1}
                              </div>
                              <p className="text-sm font-bold text-slate-900 mb-3">{issue.issue_description}</p>
                              <div className="bg-white p-3 border border-red-100 rounded text-xs font-medium text-slate-600 leading-relaxed italic">
                                "{issue.suggested_fix}"
                              </div>
                           </div>
                         ))}

                         {subEditResult.tone_issues.map((issue: any, i: number) => (
                           <div key={i} className="p-5 border-l-4 border-amber-500 bg-amber-50/30 rounded-r-xl">
                              <div className="flex items-center text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2">
                                <Zap size={12} className="mr-1.5" />
                                Tone Alignment
                              </div>
                              <p className="text-sm font-bold text-slate-900 mb-3">{issue.issue_description}</p>
                              <div className="bg-white p-3 border border-amber-100 rounded text-xs font-medium leading-relaxed italic text-slate-500">
                                Fix: {issue.suggested_fix}
                              </div>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                        <RefreshCcw size={48} className="animate-spin-slow mb-4 opacity-50" />
                        <p className="text-sm font-bold uppercase tracking-widest">Generating Audit...</p>
                      </div>
                    )}
                 </section>
              </div>

              <div className="space-y-6">
                 <section className="bg-slate-900 rounded-xl shadow-xl p-6 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <ShieldCheck size={80} />
                    </div>
                    <h3 className="font-bold text-lg mb-2 relative z-10">Compliance Check</h3>
                    <p className="text-xs text-slate-400 mb-6 font-medium leading-relaxed relative z-10">
                       Standard automated verification for style guide adherence and legal safety.
                    </p>
                    <div className="space-y-4 relative z-10">
                       <div className="flex items-center text-xs font-bold text-emerald-400">
                          <CheckCircle2 size={14} className="mr-2" />
                          Neutral Perspective Check
                       </div>
                       <div className="flex items-center text-xs font-bold text-emerald-400">
                          <CheckCircle2 size={14} className="mr-2" />
                          Source Attribution Pass
                       </div>
                       <div className="flex items-center text-xs font-bold text-slate-500">
                          <AlertTriangle size={14} className="mr-2 text-amber-500" />
                          Verify Personal Names
                       </div>
                    </div>
                 </section>
                 
                 <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <h4 className="font-bold text-sm mb-2">Need a second opinion?</h4>
                    <p className="text-xs text-blue-100 mb-4 font-medium italic">"The third paragraph seems slightly aggressive for an analytical piece."</p>
                    <button className="w-full py-2 bg-white text-blue-600 text-xs font-black rounded uppercase tracking-widest hover:bg-blue-50 transition">
                       Consult Editor-in-Chief
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function SubEditingPage() {
  return (
    <Suspense fallback={<div className="py-24 flex justify-center"><Loader2 className="animate-spin text-red-600" /></div>}>
      <SubEditingContent />
    </Suspense>
  );
}
