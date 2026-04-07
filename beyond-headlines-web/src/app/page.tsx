import React from 'react';
import api from '@/lib/api';
import PublicNav from '@/components/layout/PublicNav';
import FeaturedArticle from '@/components/public/FeaturedArticle';
import ArticleGrid from '@/components/public/ArticleGrid';
import { 
  Building2, 
  Globe, 
  ArrowRight,
  TrendingUp,
  Newspaper
} from 'lucide-react';
import Link from 'next/link';

async function getArticles() {
  try {
    const resp = await api.get('/articles?status=PUBLISHED&limit=10');
    return resp.data.data;
  } catch (err) {
    console.error('Failed to fetch articles', err);
    return [];
  }
}

export default async function Home() {
  const articles = await getArticles();
  const featured = articles[0];
  const secondary = articles.slice(1, 4);
  const tertiary = articles.slice(4);

  return (
    <div className="bg-slate-50 min-h-screen font-sans selection:bg-red-100 selection:text-red-900">
      <PublicNav />
      
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
        {/* Flagship Hero */}
        {featured ? (
          <FeaturedArticle article={featured} />
        ) : (
          <div className="bg-white rounded-3xl p-24 text-center border border-slate-200 mb-16 shadow-sm">
             <Newspaper className="h-16 w-16 text-slate-200 mx-auto mb-6" strokeWidth={1} />
             <h2 className="text-xl font-black uppercase tracking-widest text-slate-400">Dispatch Pending</h2>
             <p className="text-slate-400 font-medium mt-2">No investigative narratives have been broadcasted yet.</p>
          </div>
        )}

        {/* Categories Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
           {/* Secondary column */}
           <div className="lg:col-span-8 space-y-16">
              <ArticleGrid articles={secondary} title="Latest Investigative Analyses" />
              <ArticleGrid articles={tertiary} title="Global Dispatch Feed" />
           </div>

           {/* Sidebar / Trends */}
           <aside className="lg:col-span-4 space-y-10">
              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <TrendingUp size={100} />
                 </div>
                 <h2 className="text-sm font-black uppercase tracking-[.2em] mb-8 flex items-center border-b border-white/10 pb-4">
                    <TrendingUp size={16} className="mr-3 text-red-500" />
                    Market Indicators
                 </h2>
                 <div className="space-y-6 relative z-10">
                    <div className="flex items-center justify-between group/item">
                       <span className="text-xs font-bold text-slate-400 group-hover/item:text-white transition">Brent Crude</span>
                       <span className="text-sm font-black text-emerald-400">$84.12 (+1.2%)</span>
                    </div>
                    <div className="flex items-center justify-between group/item">
                       <span className="text-xs font-bold text-slate-400 group-hover/item:text-white transition">S&P 500 Fut</span>
                       <span className="text-sm font-black text-red-400">5,142.10 (-0.04%)</span>
                    </div>
                    <div className="flex items-center justify-between group/item">
                       <span className="text-xs font-bold text-slate-400 group-hover/item:text-white transition">BTC / USD</span>
                       <span className="text-sm font-black text-emerald-400">$64,102.30 (+8.4%)</span>
                    </div>
                 </div>
                 <button className="w-full mt-10 py-3 bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition group/btn">
                    Explore Data <ArrowRight size={12} className="inline ml-1 group-hover/btn:translate-x-1 transition-transform" />
                 </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                 <h2 className="text-sm font-black uppercase tracking-[.2em] mb-6 flex items-center text-slate-900 border-b border-slate-100 pb-4">
                    <Building2 size={16} className="mr-3 text-blue-600" />
                    Editorial Desk
                 </h2>
                 <div className="space-y-6">
                    <Link href="/login" className="flex items-start group">
                       <div className="mt-1 h-3 w-3 rounded-full bg-red-600 mr-4 group-hover:scale-125 transition" />
                       <div>
                          <div className="text-xs font-black uppercase tracking-tight text-slate-900 mb-1 group-hover:text-red-700 transition">Open for Contribution</div>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Our AI investigative pipeline is active. 14 new clusters identified today.</p>
                       </div>
                    </Link>
                    <div className="flex items-start">
                       <div className="mt-1 h-3 w-3 rounded-full bg-slate-200 mr-4" />
                       <div>
                          <div className="text-xs font-black uppercase tracking-tight text-slate-400 mb-1">Bureau Status</div>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">Operational — 24/7 Monitoring</p>
                       </div>
                    </div>
                 </div>
              </div>
           </aside>
        </div>
      </main>

      {/* Premium Footer */}
      <footer className="bg-slate-950 text-white py-24 mt-24 border-t-8 border-red-600">
         <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-16">
            <div className="col-span-1 md:col-span-2">
               <div className="text-3xl font-black uppercase tracking-tighter mb-6">
                 Beyond<span className="text-red-500">Headlines</span>
               </div>
               <p className="max-w-md text-slate-400 font-medium leading-relaxed italic border-l-2 border-slate-800 pl-6">
                  "Beyond Headlines delivers the depth that traditional journalism lacks, powered by an AI-assisted pipeline that verifies, synthesizes, and investigates global narratives in real-time."
               </p>
            </div>
            
            <div>
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6">Channels</h3>
               <ul className="space-y-4 text-sm font-bold text-slate-200">
                  <li className="hover:text-red-500 transition"><Link href="/category/politics">Geopolitics</Link></li>
                  <li className="hover:text-red-500 transition"><Link href="/category/economy">Global Economy</Link></li>
                  <li className="hover:text-red-500 transition"><Link href="/category/technology">Deep Tech</Link></li>
                  <li className="hover:text-red-500 transition"><Link href="/category/culture">Culture & Society</Link></li>
               </ul>
            </div>

            <div>
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6">Network</h3>
               <ul className="space-y-4 text-sm font-bold text-slate-200">
                  <li className="hover:text-red-500 transition cursor-pointer">About the Platform</li>
                  <li className="hover:text-red-500 transition cursor-pointer">Ethics & Governance</li>
                  <li className="hover:text-red-500 transition cursor-pointer">Privacy Framework</li>
                  <li className="hover:text-red-500 transition cursor-pointer">API Access</li>
               </ul>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-4 md:px-8 mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
            <span>© 2026 Beyond Headlines Narrative Intelligence</span>
            <span className="flex items-center mt-4 md:mt-0">
               <Globe size={12} className="mr-2" />
               Broadcasted from Silicon Valley
            </span>
         </div>
      </footer>
    </div>
  );
}
