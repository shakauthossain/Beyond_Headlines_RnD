'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { TopicCluster } from '@/types';
import ClusterCard from '@/components/dashboard/ClusterCard';
import { Loader2, RefreshCcw, Search, Filter, Newspaper } from 'lucide-react';

export default function ClustersPage() {
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClusters = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    
    setError('');
    try {
      const response = await api.get('/clusters');
      setClusters(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch clusters. Is the API running?');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const filteredClusters = clusters.filter(c => 
    c.topic.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateArticle = (clusterId: string) => {
    // This will be implemented in Step 2: Topic Brief
    window.location.href = `/dashboard/briefs?clusterId=${clusterId}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">News Intelligence</h1>
          <p className="text-slate-500 mt-1 font-medium">Discover emerging stories and trending clusters from global sources.</p>
        </div>
        <button 
          onClick={() => fetchClusters(true)}
          disabled={isRefreshing}
          className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCcw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search topics or summaries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm placeholder-slate-400 text-slate-700"
          />
        </div>
        <div className="flex items-center space-x-2">
           <button className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
             <Filter size={14} className="mr-2" />
             Filter
           </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-10 w-10 text-red-600 animate-spin" />
          <p className="text-slate-500 font-medium">Analyzing news trends...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center">
           <p className="text-red-700 font-semibold mb-2">{error}</p>
           <button 
             onClick={() => fetchClusters()}
             className="text-sm font-bold text-red-600 underline hover:text-red-800"
            >
             Try again
           </button>
        </div>
      ) : filteredClusters.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-24 text-center">
          <Newspaper className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 border-b-0">No clusters found</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2 font-medium">Try adjusting your search or refresh the feed to scan for latest news.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredClusters.map((cluster) => (
            <ClusterCard 
              key={cluster.id} 
              cluster={cluster} 
              onSelect={handleCreateArticle} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
