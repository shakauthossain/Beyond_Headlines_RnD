'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import ResearchTabs from '@/components/dashboard/ResearchTabs';
import { 
  Loader2, 
  Search, 
  ChevronRight, 
  AlertCircle, 
  RefreshCcw, 
  Database,
  CheckCircle2,
  Brain,
  History
} from 'lucide-react';

function ResearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const articleId = searchParams.get('articleId');
  
  const [article, setArticle] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isQueueing, setIsQueueing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState('');

  const fetchSessions = async (quiet = false) => {
    if (!articleId) return;
    if (!quiet) setIsPolling(true);
    
    try {
      const resp = await api.get(`/research/${articleId}`);
      setSessions(resp.data.data);
      
      // If we are polling and find a session, stop polling
      if (quiet && resp.data.data.length > 0) {
        setIsPolling(false);
      }
    } catch (err: any) {
      console.error('Failed to fetch sessions', err);
    } finally {
      if (!quiet) setIsPolling(false);
    }
  };

  const fetchArticle = async () => {
    if (!articleId) return;
    try {
      const resp = await api.get(`/articles/${articleId}`);
      setArticle(resp.data.data);
    } catch (err: any) {
      setError('Article not found.');
    }
  };

  const startResearch = async () => {
    if (!articleId) return;
    setIsQueueing(true);
    setError('');
    
    try {
      await api.post('/research/generate', { articleId });
      setIsPolling(true);
      // Start polling every 3 seconds
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start research.');
      setIsQueueing(false);
    } finally {
      setIsQueueing(false);
    }
  };

  useEffect(() => {
    if (articleId) {
      fetchArticle();
      fetchSessions();
    }
  }, [articleId]);

  // Polling logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPolling && sessions.length === 0) {
      interval = setInterval(() => {
        fetchSessions(true);
      }, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPolling, sessions.length]);

  if (!articleId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white border border-dashed border-slate-200 rounded-xl">
        <Search className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">No Article Selected</h2>
        <p className="text-slate-500 max-w-xs text-center mt-2 font-medium">Research must be tied to an article draft. Select one from your dashboard.</p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="mt-6 inline-flex items-center text-sm font-bold text-red-600 hover:underline"
        >
          Go to Dashboard
          <ChevronRight size={16} className="ml-1" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="mb-8 border-b border-slate-200 pb-6 flex items-center justify-between">
        <div>
           <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">
             <span>Step 2: Strategy</span>
             <ChevronRight size={10} />
             <span className="text-red-600">Step 3: Research Workspace</span>
           </div>
           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI News Research</h1>
           {article && (
             <p className="text-slate-500 mt-1 font-medium italic">
                Developing: <span className="text-slate-900 not-italic font-bold">"{article.title}"</span>
             </p>
           )}
        </div>
        
        {sessions.length > 0 && (
          <button 
            onClick={() => router.push(`/dashboard/editor?articleId=${articleId}`)}
            className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-red-600 shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Advance to Drafting (Step 4)
            <ChevronRight size={18} className="ml-2" />
          </button>
        )}
      </div>

      {/* Deep Research Capability Strip */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">What Deep Research Will Do</h2>
          <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded">
            Step 3 Scope
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center mb-2">
              <Database size={14} className="text-blue-600 mr-2" />
              <p className="text-xs font-black uppercase tracking-wide text-slate-700">Source Sweep</p>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Pulls recent reporting across local and international outlets tied to your selected angle.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center mb-2">
              <CheckCircle2 size={14} className="text-emerald-600 mr-2" />
              <p className="text-xs font-black uppercase tracking-wide text-slate-700">Credibility Check</p>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Ranks evidence quality and flags whether signals are high-confidence or developing.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center mb-2">
              <History size={14} className="text-amber-600 mr-2" />
              <p className="text-xs font-black uppercase tracking-wide text-slate-700">Timeline Build</p>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Constructs a chronological event map so causal shifts and inflection points are explicit.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center mb-2">
              <Brain size={14} className="text-purple-600 mr-2" />
              <p className="text-xs font-black uppercase tracking-wide text-slate-700">Synthesis Brief</p>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Produces a newsroom-ready brief with key data points, unresolved gaps, and next questions.
            </p>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center max-w-2xl mx-auto">
          {isPolling ? (
             <div className="space-y-6">
                <div className="relative inline-block">
                  <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Database size={20} className="text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Perplexity AI Scanning Global Sources...</h3>
                  <p className="text-slate-500 mt-2 font-medium">We are querying Sonar Pro for the latest data, verifyng credibility, and building a timeline of events via Claude Haiku.</p>
                </div>
                <div className="flex items-center justify-center space-x-4 pt-4">
                   <div className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                     <CheckCircle2 size={12} className="mr-1.5" />
                     Sonar Pro Active
                   </div>
                   <div className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                     <Brain size={12} className="mr-1.5" />
                     Synthesis Engine Running
                   </div>
                </div>
             </div>
          ) : (
            <>
              <div className="bg-slate-50 p-4 rounded-full mb-6">
                <Database className="h-10 w-10 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Initialize Deep Research</h2>
              <p className="text-slate-500 mb-8 leading-relaxed font-medium">
                Our AI agents will perform real-time verification across 50+ news sources, identify key data points, and build an investigative timeline based on your chosen angle.
              </p>
              <button 
                onClick={startResearch}
                disabled={isQueueing}
                className="bg-red-600 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-xl shadow-red-100 flex items-center disabled:opacity-50"
              >
                {isQueueing ? <Loader2 className="mr-2 animate-spin" /> : <RefreshCcw className="mr-2" size={16} />}
                Invoke AI Research Engine
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <History className="mr-2 text-slate-400" size={20} />
              Recent Synthesis Report
              <span className="ml-3 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded border border-emerald-100">Verified</span>
            </h2>
            <button 
              onClick={startResearch}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center group"
            >
              <RefreshCcw size={12} className="mr-1.5 group-hover:rotate-180 transition-transform duration-500" />
              Run New Synthesis
            </button>
          </div>
          
          <ResearchTabs session={sessions[0]} />
        </div>
      )}

      {error && (
        <div className="mt-8 bg-red-50 border border-red-100 rounded-lg p-4 flex items-center text-red-700 text-sm font-medium">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense fallback={<div className="py-24 flex justify-center"><Loader2 className="animate-spin text-red-600" /></div>}>
      <ResearchContent />
    </Suspense>
  );
}
