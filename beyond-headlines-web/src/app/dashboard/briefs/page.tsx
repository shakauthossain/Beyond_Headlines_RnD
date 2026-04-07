'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import AngleSelector from '@/components/dashboard/AngleSelector';
import { Loader2, Newspaper, ChevronRight, AlertCircle, RefreshCcw } from 'lucide-react';

function BriefsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clusterId = searchParams.get('clusterId');
  
  const [brief, setBrief] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchBrief = async () => {
    if (!clusterId) {
      setError('No cluster selected. Go back to News Intelligence.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/research/topic-brief', { clusterId });
      setBrief(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate brief. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrief();
  }, [clusterId]);

  const handleConfirmAngle = async (angle: string) => {
    setIsSubmitting(true);
    try {
      // Step 2.3 logic: Create draft article
      const response = await api.post('/articles', {
        title: brief.suggested_angles.find((a: any) => a.title === angle)?.title || angle,
        angle: angle,
        status: 'DRAFT',
        // In a real app we'd map the cluster to category here if we could
      });
      
      const article = response.data.data;
      // Navigate to Step 3: Research Workspace
      router.push(`/dashboard/research?articleId=${article.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create article draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!clusterId && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white border border-dashed border-slate-200 rounded-xl">
        <Newspaper className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">No Cluster Selected</h2>
        <p className="text-slate-500 max-w-xs text-center mt-2 font-medium">Select a news cluster from the News Intelligence dashboard first.</p>
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
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-red-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Newspaper size={20} className="text-red-400" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900">Claude 4.5 Sonnet Generating Brief...</h2>
          <p className="text-slate-500 mt-2 font-medium">Analyzing headlines, extracting stakeholders, and identifying unique angles.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center max-w-2xl mx-auto">
        <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="text-red-700" size={24} />
        </div>
        <h3 className="text-lg font-bold text-red-900 mb-2">{error}</h3>
        <p className="text-red-700/80 mb-6 text-sm">This can happen if the AI model is at capacity or the cluster data is incomplete.</p>
        <button 
          onClick={() => fetchBrief()}
          className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-sm"
        >
          <RefreshCcw size={16} className="mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="mb-8 border-b border-slate-200 pb-6 flex items-center justify-between">
        <div>
           <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">
             <span>Step 1: News Intelligence</span>
             <ChevronRight size={10} />
             <span className="text-red-600">Step 2: Topic Brief & Angle</span>
           </div>
           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Editorial Strategy</h1>
        </div>
      </div>

      <AngleSelector 
        brief={brief} 
        onConfirm={handleConfirmAngle}
        isSubmitting={isSubmitting} 
      />
    </div>
  );
}

export default function BriefsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 text-red-600 animate-spin" />
      </div>
    }>
      <BriefsContent />
    </Suspense>
  );
}
