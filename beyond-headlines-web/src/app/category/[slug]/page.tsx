import React from 'react';
import api from '@/lib/api';
import PublicNav from '@/components/layout/PublicNav';
import ArticleGrid from '@/components/public/ArticleGrid';
import { 
  Loader2, 
  ChevronLeft,
  Globe,
  TrendingUp,
  Layout
} from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCategoryData(slug: string) {
  try {
    // First find the category ID by slug (or the API might support slug filter)
    const catResp = await api.get('/articles?status=PUBLISHED&limit=20'); // Mocking fetch for now or actual if endpoint supports
    const filtered = catResp.data.data.filter((a: any) => a.category?.slug === slug);
    return {
      articles: filtered,
      name: filtered[0]?.category?.name || slug.charAt(0).toUpperCase() + slug.slice(1)
    };
  } catch (err) {
    return { articles: [], name: slug };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);
  return {
    title: `${name} | Beyond Headlines`,
    description: `Latest investigative reports and narrative analysis in ${name}.`
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const { articles, name } = await getCategoryData(slug);

  return (
    <div className="bg-slate-50 min-h-screen font-sans selection:bg-red-100 selection:text-red-900">
      <PublicNav />
      
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24">
        <header className="mb-16 border-b-4 border-slate-900 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
              <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-4">
                 <Globe size={12} className="animate-spin-slow" />
                 <span>Global Channel</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                 {name}
              </h1>
           </div>
           <div className="text-slate-400 font-medium max-w-xs text-sm italic border-l border-slate-200 pl-6">
              "Investigating the deep narratives and structural shifts within {name}."
           </div>
        </header>

        {articles.length > 0 ? (
          <ArticleGrid articles={articles} />
        ) : (
          <div className="bg-white rounded-3xl p-24 text-center border border-slate-200 shadow-sm">
             <Layout className="h-16 w-16 text-slate-200 mx-auto mb-6" strokeWidth={1} />
             <h2 className="text-xl font-black uppercase tracking-widest text-slate-400">Channel Quiet</h2>
             <p className="text-slate-400 font-medium mt-2">No active investigations in {name} at this time.</p>
             <Link href="/" className="mt-8 inline-flex items-center text-sm font-bold text-red-600 hover:underline">
                <ChevronLeft size={16} className="mr-1" /> Back to Main Intelligence
             </Link>
          </div>
        )}

        {/* Global Context Footer for Categories */}
        <section className="mt-24 pt-24 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-slate-900 rounded-3xl p-8 text-white">
               <TrendingUp size={24} className="text-red-500 mb-6" />
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Channel Insights</h3>
               <p className="text-sm font-medium leading-relaxed italic opacity-80 decoration-red-500/50 underline underline-offset-4">
                  "The {name} corridor is currently undergoing rapid transformation, with AI-detected clusters up 140% since last quarter."
               </p>
            </div>
            <div className="md:col-span-2 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-12">
               <div className="text-center">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mb-4">Proprietary Signal Intelligence</p>
                  <p className="text-slate-300 font-black text-4xl opacity-20 select-none">ENCRYPTED DATA STREAM</p>
               </div>
            </div>
        </section>
      </main>
    </div>
  );
}
