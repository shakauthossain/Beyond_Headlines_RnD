'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Globe
} from 'lucide-react';

interface FeaturedArticleProps {
  article: any;
}

export default function FeaturedArticle({ article }: FeaturedArticleProps) {
  if (!article) return null;

  return (
    <section className="group relative overflow-hidden bg-white border-y border-slate-200 lg:border-none lg:rounded-3xl lg:shadow-2xl lg:shadow-slate-100 mb-16">
      <Link href={`/articles/${article.slug}`} className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[500px]">
        {/* Visual Content Column */}
        <div className="lg:col-span-7 relative bg-slate-900 overflow-hidden order-1 lg:order-2">
           <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-10" />
           <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Globe size={200} strokeWidth={1} className="text-white" />
           </div>
           
           <div className="absolute bottom-0 left-0 p-8 md:p-12 z-20 w-full max-w-2xl">
              <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-red-500 tracking-[0.2em] mb-4 bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                 <TrendingUp size={12} className="animate-pulse" />
                 <span>Lead Analysis</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.05] group-hover:text-red-400 transition-colors">
                 {article.title}
              </h2>
           </div>
        </div>

        {/* Text Content Column */}
        <div className="lg:col-span-5 p-8 md:p-12 lg:p-16 flex flex-col justify-center order-2 lg:order-1 bg-white">
           <div className="mb-6">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] block mb-2">
                {article.category?.name || 'In-Depth'}
              </span>
              <div className="h-1 w-12 bg-red-600" />
           </div>

           <p className="text-lg md:text-xl font-medium text-slate-600 leading-relaxed font-serif italic mb-8 first-letter:text-4xl first-letter:font-black first-letter:text-slate-900 first-letter:mr-1 first-letter:float-left">
              {article.summary || "Click to read our deep investigative coverage of this evolving global narrative, featuring real-time data verification and expert synthesis."}
           </p>

           <div className="flex items-center justify-between mt-auto pt-8 border-t border-slate-100">
              <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-400 border border-slate-200">
                    {article.author?.name?.charAt(0) || 'E'}
                 </div>
                 <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-900 leading-tight">
                       {article.author?.name || 'Beyond Headlines Bureau'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                       Senior Investigative Analyst
                    </div>
                 </div>
              </div>
              
              <div className="flex items-center text-red-600 font-bold text-xs uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                 Full Story <ChevronRight size={14} className="ml-1" />
              </div>
           </div>
        </div>
      </Link>
    </section>
  );
}
