'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  Loader2, 
  Send, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2,
  Globe,
  Lock,
  Calendar,
  FileCheck,
  ExternalLink,
  ChevronLeft,
  XCircle,
  Eye,
  Rocket
} from 'lucide-react';

function PublishingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const articleId = searchParams.get('articleId');
  
  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [checks, setChecks] = useState({
    factual: false,
    formatting: false,
    packaging: true,
    legal: false
  });

  const fetchData = async () => {
    if (!articleId) return;
    setIsLoading(true);
    try {
      const resp = await api.get(`/articles/${articleId}`);
      setArticle(resp.data.data);
    } catch (err: any) {
      setError('Article not found.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!articleId || !Object.values(checks).every(v => v)) return;
    setIsPublishing(true);
    try {
      await api.patch(`/articles/${articleId}`, { 
        status: 'PUBLISHED',
        publishedAt: new Date().toISOString()
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError('Publishing failed. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    if (articleId) fetchData();
  }, [articleId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-12 w-12 text-red-600 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Editorial Check-off...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center animate-in zoom-in duration-700">
         <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-50 ring-4 ring-white">
            <Rocket className="text-emerald-600" size={40} />
         </div>
         <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4 text-balance">The Story is Live.</h1>
         <p className="text-slate-500 font-medium text-lg mb-10 leading-relaxed">
            "{article?.title}" has been successfully broadcast to the public news feed.
         </p>
         
         <div className="flex flex-col gap-4">
            <button 
              onClick={() => router.push('/dashboard/clusters')}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-xl"
            >
               Return to News Intelligence
            </button>
            <a 
              href={`/articles/${article?.slug}`} 
              target="_blank"
              className="inline-flex items-center justify-center py-4 bg-white border border-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition"
            >
               View Article Live <ExternalLink size={16} className="ml-2" />
            </a>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="mb-12 border-b border-slate-200 pb-8 flex items-center justify-between">
        <div>
           <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">
             <span>Step 6: Packaging</span>
             <ChevronRight size={10} />
             <span className="text-red-600">Step 7: Final Review & Publish</span>
           </div>
           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Final Dispatch</h1>
           <p className="text-slate-500 mt-1 font-medium italic">Ready to broadcast: "{article?.title}"</p>
        </div>
        
        <button 
          onClick={() => router.back()}
          className="p-3 text-slate-400 hover:text-slate-600 transition"
        >
          <XCircle size={24} strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
         {/* Review Check-off */}
         <div className="md:col-span-12">
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
               <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center">
                     <FileCheck className="mr-2 text-blue-600" size={18} />
                     Editorial Quality Assurance
                  </h2>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Required for Release</span>
               </div>
               
               <div className="p-8 space-y-4">
                  <label className="flex items-center p-5 rounded-xl border border-slate-100 bg-slate-50/30 hover:border-blue-100 transition cursor-pointer group">
                     <input 
                      type="checkbox" 
                      onChange={() => setChecks({...checks, factual: !checks.factual})}
                      checked={checks.factual}
                      className="w-6 h-6 border-2 border-slate-200 rounded text-red-600 focus:ring-red-600 mr-6" 
                     />
                     <div className="flex-1">
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">Factual Verification</div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">I have verified all data points, timeline events, and source attributions for accuracy.</p>
                     </div>
                  </label>

                  <label className="flex items-center p-5 rounded-xl border border-slate-100 bg-slate-50/30 hover:border-blue-100 transition cursor-pointer">
                     <input 
                      type="checkbox" 
                      onChange={() => setChecks({...checks, formatting: !checks.formatting})}
                      checked={checks.formatting}
                      className="w-6 h-6 border-2 border-slate-200 rounded text-red-600 focus:ring-red-600 mr-6" 
                     />
                     <div className="flex-1">
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">Clarity & Style</div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">The article follows brand style guides and the AI-suggested clarity fixes have been addressed.</p>
                     </div>
                  </label>

                  <label className="flex items-center p-5 rounded-xl border border-slate-100 bg-slate-50/30 hover:border-blue-100 transition cursor-pointer">
                     <input 
                      type="checkbox" 
                      onChange={() => setChecks({...checks, legal: !checks.legal})}
                      checked={checks.legal}
                      className="w-6 h-6 border-2 border-slate-200 rounded text-red-600 focus:ring-red-600 mr-6" 
                     />
                     <div className="flex-1">
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">Neutrality & Legal Safety</div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">The tone remains objective and avoids potential libel or undocumented claims.</p>
                     </div>
                  </label>
               </div>
            </section>

            <section className="flex flex-col md:flex-row items-center gap-6 justify-between bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
               <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                     <Globe size={32} strokeWidth={1} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-slate-900">Visibility: Public Dispatch</h3>
                     <p className="text-sm font-medium text-slate-500">Upon confirmation, this article will be indexed and shared across all active news feeds.</p>
                  </div>
               </div>

               <button 
                onClick={handlePublish}
                disabled={isPublishing || !Object.values(checks).every(v => v)}
                className="w-full md:w-auto px-12 py-4 bg-red-600 text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-xl shadow-red-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none transform active:scale-95"
               >
                 {isPublishing ? (
                    <>
                       <Loader2 size={18} className="mr-2 animate-spin" />
                       Broadcasting...
                    </>
                 ) : (
                    <>
                       <Send size={18} className="mr-2" />
                       Confirm Dispatch
                    </>
                 )}
               </button>
            </section>
         </div>
      </div>

      {error && (
        <div className="mt-8 bg-red-50 border border-red-100 rounded-lg p-4 flex items-center text-red-700 text-sm font-medium">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}
    </div>
  );
}

export default function PublishingPage() {
  return (
    <Suspense fallback={<div className="py-24 flex justify-center"><Loader2 className="animate-spin text-red-600" /></div>}>
      <PublishingContent />
    </Suspense>
  );
}
