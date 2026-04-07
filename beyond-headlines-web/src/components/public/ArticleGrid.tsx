'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronRight, 
  Clock, 
  MapPin, 
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface ArticleGridProps {
  articles: any[];
  title?: string;
}

export default function ArticleGrid({ articles, title }: ArticleGridProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="space-y-10">
      {title && (
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
           <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
             {title}
           </h2>
           <Link href={`/category/${articles[0]?.category?.slug}`} className="text-xs font-black uppercase tracking-widest text-red-600 hover:text-slate-900 transition flex items-center">
             View Channel <ChevronRight size={14} className="ml-1" />
           </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
         {articles.map((article, i) => (
           <article key={article.id || i} className="group flex flex-col h-full border-b border-slate-100 pb-10 lg:border-none lg:pb-0">
             <Link href={`/articles/${article.slug}`} className="flex flex-col h-full">
                {/* Category & Time */}
                <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                   <span className="text-red-600">{article.category?.name || 'In-Brief'}</span>
                   <span>/</span>
                   <span className="flex items-center">
                      <Clock size={10} className="mr-1" />
                      {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                   </span>
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4 group-hover:text-red-700 transition">
                   {article.title}
                </h3>

                {/* Excerpt */}
                <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6 line-clamp-3">
                   {article.summary || article.body?.substring(0, 150) || "Comprehensive investigation into current global trends and market shifts..."}
                </p>

                {/* Footer Metadata */}
                <div className="mt-auto pt-6 flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center font-black text-[10px] text-slate-400 border border-slate-200 uppercase">
                         {article.author?.name?.charAt(0) || 'E'}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                         {article.author?.name || 'Bureau'}
                      </span>
                   </div>
                   
                   <div className="flex items-center text-slate-300 group-hover:text-red-600 transition">
                      <ChevronRight size={16} />
                   </div>
                </div>
             </Link>
           </article>
         ))}
      </div>
    </section>
  );
}
