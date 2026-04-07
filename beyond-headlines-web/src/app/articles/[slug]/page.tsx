import React from 'react';
import type { Metadata } from 'next';
import api from '@/lib/api';
import { renderTiptapJson } from '@/lib/render';
import PublicNav from '@/components/layout/PublicNav';
import { 
  Clock, 
  User, 
  Share2, 
  MessageCircle, 
  ChevronLeft,
  ArrowRight,
  Quote,
  Zap,
  ShieldCheck,
  TrendingUp,
  Globe
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: { slug: string };
}

async function getArticle(slug: string) {
  try {
    const resp = await api.get(`/articles/${slug}`);
    return resp.data.data;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: 'Article Not Found | Beyond Headlines' };

  return {
    title: `${article.title} | Beyond Headlines`,
    description: article.summary || article.excerpt,
    openGraph: {
      title: article.title,
      description: article.summary || article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt || article.createdAt,
      authors: [article.author?.name],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicNav />
        <div className="max-w-xl mx-auto py-32 text-center">
          <Globe className="h-12 w-12 text-slate-200 mx-auto mb-6" />
          <h1 className="text-2xl font-black uppercase text-slate-900 mb-4">Narrative Not Found</h1>
          <p className="text-slate-500 font-medium mb-8">The requested investigative piece has been archived or does not exist.</p>
          <Link href="/" className="inline-flex items-center text-sm font-bold text-red-600 hover:scale-105 transition">
             <ChevronLeft size={16} className="mr-1" /> Return to Intelligence Feed
          </Link>
        </div>
      </div>
    );
  }

  const htmlBody = renderTiptapJson(article.body);
  const research = article.researchSessions?.[0];

  return (
    <div className="bg-white min-h-screen font-sans selection:bg-red-100 selection:text-red-900">
      <PublicNav />

      <article className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-24">
        {/* Editorial Header */}
        <header className="mb-12 md:mb-20 text-center">
           <div className="flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-6">
              <Link href={`/category/${article.category?.slug}`} className="hover:underline">{article.category?.name || 'In-Depth'}</Link>
              <span>/</span>
              <span>{article.tone || 'ANALYTICAL'} DISPATCH</span>
           </div>
           
           <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.05] mb-8 text-balance">
              {article.title}
           </h1>

           <div className="flex flex-col md:flex-row items-center justify-center md:space-x-8 space-y-4 md:space-y-0 text-xs font-bold text-slate-400 border-y border-slate-100 py-6">
              <div className="flex items-center">
                 <User size={14} className="mr-2 text-slate-900" />
                 By <span className="text-slate-900 ml-1 uppercase tracking-widest">{article.author?.name || 'Bureau'}</span>
              </div>
              <div className="flex items-center">
                 <Clock size={14} className="mr-2" />
                 {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div className="flex items-center space-x-4">
                 <Share2 size={14} className="hover:text-slate-900 cursor-pointer transition" />
                 <Globe size={14} className="hover:text-red-600 cursor-pointer transition" />
              </div>
           </div>
        </header>

        {/* Lead Summary */}
        <div className="max-w-2xl mx-auto mb-16">
           <p className="text-xl md:text-2xl font-medium text-slate-600 leading-relaxed font-serif italic border-l-4 border-red-600 pl-8 py-2">
              {article.summary || article.excerpt}
           </p>
        </div>

        {/* Main Body Content */}
        <div className="max-w-2xl mx-auto">
           <div 
             className="prose prose-slate prose-lg max-w-none 
                        prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900
                        prose-p:font-serif prose-p:text-slate-800 prose-p:leading-[1.8] prose-p:mb-8
                        prose-blockquote:border-red-600 prose-blockquote:bg-slate-50 prose-blockquote:py-6 prose-blockquote:rounded-r-xl
                        prose-strong:text-slate-950 prose-a:text-red-600 prose-img:rounded-3xl"
             dangerouslySetInnerHTML={{ __html: htmlBody }} 
           />
           
           {/* Verification Footnote */}
           <div className="mt-20 p-8 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row items-center justify-between group">
              <div className="flex items-center mb-4 md:mb-0">
                 <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4 ring-1 ring-slate-200">
                    <ShieldCheck size={24} className="text-emerald-500" />
                 </div>
                 <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Integrity Verified</div>
                    <div className="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition">Powered by Beyond Headlines Intelligence</div>
                 </div>
              </div>
              <Link href="/ethics" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 flex items-center transition">
                 Learn about our process <ArrowRight size={10} className="ml-1" />
              </Link>
           </div>
        </div>

        {/* Investigative Sidebar / Extras */}
        {research && (
           <div className="max-w-5xl mx-auto mt-24 border-t border-slate-100 pt-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8">
                 <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center">
                    <TrendingUp size={16} className="mr-3 text-red-600" />
                    Global Context & Timeline
                 </h2>
                 <div className="space-y-6">
                    {/* Simplified Timeline */}
                    {(research.timeline as any[]).slice(0, 3).map((item, i) => (
                      <div key={i} className="flex group">
                         <div className="w-32 shrink-0 text-xs font-black text-slate-400 font-serif italic pt-1">{item.date}</div>
                         <div className="border-l border-slate-200 pl-8 pb-8 relative">
                            <div className="absolute left-0 top-2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-200 group-hover:bg-red-600 transition" />
                            <h4 className="text-sm font-bold text-slate-900 mb-1">{item.label}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">{item.direction}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="lg:col-span-4">
                 <div className="bg-slate-900 rounded-3xl p-8 text-white">
                    <Zap size={24} className="text-amber-400 mb-6" />
                    <h3 className="text-lg font-black uppercase tracking-tight mb-4">Key Data Points</h3>
                    <div className="space-y-4">
                       {(research.dataPoints as any[]).map((point, i) => (
                         <div key={i} className="border-b border-white/10 pb-3 last:border-none">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{point.source}</div>
                            <div className="text-sm font-medium italic opacity-90">"{point.point}"</div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}
      </article>

      {/* Recommended Footer */}
      <section className="bg-slate-50 py-24 border-t border-slate-100">
         <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-12">Continue Investigating</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
               {/* Mock recommended stories */}
               <div className="group">
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Next in Economy</div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-red-700 transition">Global Market Shifts in the Energy Transition</h3>
                  <Link href="/" className="mt-4 inline-flex items-center text-[10px] font-black uppercase text-slate-400 group-hover:text-slate-900 transition">
                     Read Full Report <ArrowRight size={10} className="ml-1" />
                  </Link>
               </div>
               <div className="group">
                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Trending in Tech</div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-red-700 transition">Artificial Intelligence Governance: New Global Standards</h3>
                  <Link href="/" className="mt-4 inline-flex items-center text-[10px] font-black uppercase text-slate-400 group-hover:text-slate-900 transition">
                     Read Full Report <ArrowRight size={10} className="ml-1" />
                  </Link>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
