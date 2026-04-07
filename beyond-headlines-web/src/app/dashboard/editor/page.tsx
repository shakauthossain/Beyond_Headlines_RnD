'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Editor from '@/components/dashboard/Editor';
import { 
  Loader2, 
  PenTool, 
  ChevronRight, 
  AlertCircle, 
  FileText,
  Eye,
  Settings
} from 'lucide-react';

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const articleId = searchParams.get('articleId');
  
  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchArticle = async () => {
    if (!articleId) {
      setError('No article ID provided.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/articles/${articleId}`);
      setArticle(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load article.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const handleSave = (content: any) => {
    console.log('Autosaved content', content);
  };

  if (!articleId && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white border border-dashed border-slate-200 rounded-xl">
        <PenTool className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">No Draft Selected</h2>
        <p className="text-slate-500 max-w-xs text-center mt-2 font-medium">Please select a draft from your dashboard or complete the Research step.</p>
        <button 
          onClick={() => router.push('/dashboard/clusters')}
          className="mt-6 inline-flex items-center text-sm font-bold text-red-600 hover:underline"
        >
          Go to News Intelligence
          <ChevronRight size={16} className="ml-1" />
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-12 w-12 text-red-600 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Initializing Editor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center max-w-2xl mx-auto">
        <AlertCircle className="text-red-600 h-12 w-12 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-900 mb-2">{error}</h3>
        <button 
          onClick={() => fetchArticle()}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition"
        >
          Retry Load
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24">
      <div className="mb-8 border-b border-slate-200 pb-6 flex items-center justify-between">
        <div>
           <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">
             <span>Step 3: Research</span>
             <ChevronRight size={10} />
             <span className="text-red-600">Step 4: Tiptap Drafting</span>
           </div>
           <div className="flex items-center space-x-3">
             <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
               {article.title}
             </h1>
             <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded mt-1 border border-slate-200">
               {article.status}
             </span>
           </div>
        </div>
        
        <div className="flex items-center space-x-3">
           <button className="p-2 text-slate-400 hover:text-slate-600 transition">
             <Eye size={20} />
           </button>
           <button className="p-2 text-slate-400 hover:text-slate-600 transition">
             <Settings size={20} />
           </button>
           <button 
            onClick={() => router.push(`/dashboard/sub-editing?articleId=${articleId}`)}
            className="ml-4 inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-lg transition-all"
           >
             Move to Sub-Editing (Step 5)
             <ChevronRight size={18} className="ml-2" />
           </button>
        </div>
      </div>

      <Editor 
        articleId={articleId!} 
        title={article.title}
        initialContent={article.body} 
        onSave={handleSave} 
      />
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="py-24 flex justify-center"><Loader2 className="animate-spin text-red-600" /></div>}>
      <EditorContent />
    </Suspense>
  );
}
