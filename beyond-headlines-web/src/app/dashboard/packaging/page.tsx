'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  Loader2, 
  Package, 
  ChevronRight, 
  AlertCircle, 
  MessageCircle,
  Quote,
  Image as ImageIcon,
  CheckCircle2,
  Copy,
  Download,
  Share2,
  Globe
} from 'lucide-react';

function PackagingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const articleId = searchParams.get('articleId');
  
  const [article, setArticle] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchData = async () => {
    if (!articleId) return;
    setIsLoading(true);
    try {
      const resp = await api.get(`/articles/${articleId}`);
      setArticle(resp.data.data);
      await generateAssets();
    } catch (err: any) {
      setError('Article not found.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAssets = async () => {
    if (!articleId) return;
    setIsProcessing(true);
    try {
      const resp = await api.post(`/articles/${articleId}/packaging`);
      setResult(resp.data.data);
    } catch (err: any) {
      console.error('Packaging failed', err);
      setError('Failed to generate packaging assets.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    if (articleId) fetchData();
  }, [articleId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-12 w-12 text-red-600 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Generating Distribution Assets...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="mb-8 border-b border-slate-200 pb-6 flex items-center justify-between">
        <div>
           <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">
             <span>Step 5: Sub-editing</span>
             <ChevronRight size={10} />
             <span className="text-red-600">Step 6: Packaging & Distribution</span>
           </div>
           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Packaging</h1>
           <p className="text-slate-500 mt-1 font-medium font-serif italic text-lg">"{article?.title}"</p>
        </div>
        
        <button 
          onClick={() => router.push(`/dashboard/publishing?articleId=${articleId}`)}
          className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-lg"
        >
          Final Publishing Step (Step 7)
          <ChevronRight size={18} className="ml-2" />
        </button>
      </div>

      {!result && !isProcessing ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-2xl mx-auto">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Package Distribution Assets</h3>
          <p className="text-slate-500 mb-6 font-medium">Generate social captions, image concepts, and SEO metadata assets for this piece.</p>
          <button 
            onClick={generateAssets}
            className="px-8 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition"
          >
            Invoke Packaging Agent
          </button>
        </div>
      ) : isProcessing ? (
        <div className="bg-white rounded-xl border border-slate-200 p-20 text-center animate-pulse">
           <Loader2 className="h-10 w-10 text-red-600 animate-spin mx-auto mb-4" />
           <p className="text-sm font-black uppercase text-slate-400 tracking-widest">Claude Haiku is packaging assets...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {/* Visual & Quotes Column */}
           <div className="lg:col-span-7 space-y-8">
              {/* Image Concept */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center">
                       <ImageIcon className="mr-2 text-blue-600" size={16} />
                       Visual Concept
                    </h2>
                    <button className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 flex items-center">
                       <Download size={12} className="mr-1" /> Save Concept
                    </button>
                 </div>
                 <div className="p-8">
                    <div className="bg-slate-900 aspect-video rounded-xl mb-6 flex items-center justify-center text-slate-700 overflow-hidden relative group">
                        <ImageIcon size={48} strokeWidth={1} className="opacity-20 group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-x-0 bottom-0 p-6 bg-linear-to-t from-black/80 to-transparent">
                           <p className="text-white text-xs font-medium leading-relaxed italic opacity-90">
                             "Conceptual visualization of the editorial angle."
                           </p>
                        </div>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium bg-blue-50/50 p-6 rounded-xl border border-blue-100 italic text-sm">
                       {result.image_concept}
                    </p>
                 </div>
              </section>

              {/* Pull Quotes */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center">
                       <Quote className="mr-2 text-amber-600" size={16} />
                       Lead Pull Quotes
                    </h2>
                 </div>
                 <div className="p-8 space-y-6">
                    {result.pull_quotes.map((q: any, i: number) => (
                      <div key={i} className="relative pl-8 border-l-2 border-slate-100 group">
                         <div className="absolute left-0 top-0 -translate-x-1/2 bg-white p-1 text-amber-300">
                            <Quote size={16} fill="currentColor" />
                         </div>
                         <p className="text-slate-900 font-serif font-medium italic text-lg leading-snug mb-2 group-hover:text-red-700 transition">{q.quote}</p>
                         <button 
                           onClick={() => copyToClipboard(q.quote, `quote-${i}`)}
                           className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 flex items-center"
                         >
                            {copiedField === `quote-${i}` ? <CheckCircle2 size={10} className="mr-1 text-emerald-500" /> : <Copy size={10} className="mr-1" />}
                            Copy Quote
                         </button>
                      </div>
                    ))}
                 </div>
              </section>
           </div>

           {/* Social Distribution Column */}
           <div className="lg:col-span-5 space-y-6">
              <section className="bg-slate-900 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Share2 size={120} />
                 </div>
                 <h2 className="text-lg font-black uppercase tracking-widest mb-8 border-b border-white/10 pb-4">Social Copy</h2>
                 
                 <div className="space-y-8">
                    {/* Twitter */}
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center text-[#1DA1F2] text-xs font-black uppercase tracking-tighter">
                             <Globe size={14} className="mr-2" /> Twitter / X
                          </div>
                          <button 
                            onClick={() => copyToClipboard(result.social_captions.twitter, 'twitter')}
                            className="text-[10px] font-bold text-slate-500 hover:text-white transition"
                          >
                            {copiedField === 'twitter' ? 'Copied!' : 'Copy'}
                          </button>
                       </div>
                       <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-medium leading-relaxed text-slate-300">
                          {result.social_captions.twitter}
                       </div>
                    </div>

                    {/* LinkedIn */}
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center text-[#0A66C2] text-xs font-black uppercase tracking-tighter">
                             <Share2 size={14} className="mr-2" /> LinkedIn
                          </div>
                          <button 
                            onClick={() => copyToClipboard(result.social_captions.linkedin, 'linkedin')}
                            className="text-[10px] font-bold text-slate-500 hover:text-white transition"
                          >
                            {copiedField === 'linkedin' ? 'Copied!' : 'Copy'}
                          </button>
                       </div>
                       <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-medium leading-relaxed text-slate-300">
                          {result.social_captions.linkedin}
                       </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center text-[#25D366] text-xs font-black uppercase tracking-tighter">
                             <MessageCircle size={14} className="mr-2 fill-current" /> WhatsApp Forward
                          </div>
                          <button 
                            onClick={() => copyToClipboard(result.social_captions.whatsapp, 'whatsapp')}
                            className="text-[10px] font-bold text-slate-500 hover:text-white transition"
                          >
                            {copiedField === 'whatsapp' ? 'Copied!' : 'Copy'}
                          </button>
                       </div>
                       <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-medium leading-relaxed text-slate-300 italic">
                          {result.social_captions.whatsapp}
                       </div>
                    </div>
                 </div>
              </section>

              <div className="bg-emerald-600 rounded-2xl p-8 text-white shadow-xl relative group overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={60} />
                 </div>
                 <h4 className="font-bold text-lg mb-2 relative z-10">Packaging Finalized</h4>
                 <p className="text-xs text-emerald-100 mb-6 font-medium leading-relaxed relative z-10">
                    All assets have been generated and synced to the central article object. You can now proceed to the final manual review.
                 </p>
                 <div className="flex items-center space-x-2 relative z-10">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Ready for Step 7</span>
                 </div>
              </div>
           </div>
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

export default function PackagingPage() {
  return (
    <Suspense fallback={<div className="py-24 flex justify-center"><Loader2 className="animate-spin text-red-600" /></div>}>
      <PackagingContent />
    </Suspense>
  );
}
