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
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [currentScanQuery, setCurrentScanQuery] = useState('');
  const [discoveryStatus, setDiscoveryStatus] = useState<'STARTED' | 'SCRAPING_DONE' | 'COMPLETED'>('STARTED');

  const fetchClusters = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    
    setError('');
    try {
      // Default to trending for a more curated experience in Phase 5
      const response = await api.get('/intelligence/trending');
      setClusters(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch clusters. Is the API running?');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const pollStatus = async (jobId: string, retryCount = 0) => {
    try {
      const response = await api.get(`/intelligence/status/${jobId}`);
      const { status } = response.data.data;

      setDiscoveryStatus(status);

      if (status === 'COMPLETED') {
        // Pipeline finished!
        setScanComplete(true);
        // Clear search term so the user can see all newly discovered clusters
        setSearchTerm(''); 
        await fetchClusters(true); 
      } else {
        // Continue polling
        setTimeout(() => pollStatus(jobId, 0), 2000);
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        // Rate limited - back off
        const delay = Math.min(1000 * Math.pow(2, retryCount + 1), 30000);
        console.warn(`Polling rate limited. Retrying in ${delay}ms...`);
        setTimeout(() => pollStatus(jobId, retryCount + 1), delay);
        setError(`Sync speed limited by server. Hold tight, retrying in ${Math.round(delay/1000)}s...`);
      } else {
        console.error('Polling error', err);
        setError('Scanning status check failed. Please check your connection or Refresh Feed.');
        setIsScanning(false);
      }
    }
  };

  const handleScan = async () => {
    if (!query.trim()) return;
    
    const activeQuery = query.trim();
    setCurrentScanQuery(activeQuery);
    setIsScanning(true);
    setScanComplete(false);
    setError('');
    
    try {
      const response = await api.post('/intelligence/scan', { query: activeQuery });
      const { jobId } = response.data.data;
      
      setQuery('');
      // Start polling for real-time completion
      pollStatus(jobId);
    } catch (err: any) {
      setError('Failed to trigger scan: ' + (err.response?.data?.message || err.message));
      setIsScanning(false);
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
    window.location.href = `/dashboard/briefs?clusterId=${clusterId}`;
  };

  return (
    <div className="space-y-8">
      {/* Intelligence Discovery Console */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Intelligence Discovery</h1>
              <p className="text-slate-500 mt-2 font-medium leading-relaxed">
                What narratives should we scan for today? Enter headlines, themes, or a specific topic to launch a targeted intelligence scan.
              </p>
            </div>
            <button 
              onClick={() => fetchClusters(true)}
              disabled={isRefreshing}
              className="self-start md:self-center inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCcw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Feed
            </button>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="e.g., 'Recent fuel price protests' or 'Tech sector layoffs in Bangladesh'..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                className="block w-full pl-12 pr-4 py-4 border-2 border-slate-100 bg-slate-50 rounded-xl focus:ring-red-500 focus:border-red-500 text-base placeholder-slate-400 text-slate-800 font-medium transition-all"
              />
            </div>
            <button 
              onClick={handleScan}
              disabled={isScanning || !query.trim()}
              className="inline-flex items-center justify-center px-8 py-4 bg-red-600 rounded-xl text-white font-bold hover:bg-red-700 shadow-md shadow-red-200 transition-all disabled:opacity-50 active:scale-95"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                'Launch Discovery Scan'
              )}
            </button>
          </div>
        </div>
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

      {/* Discovery Status Modal */}
      {(isScanning || scanComplete) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => scanComplete && setIsScanning(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 overflow-hidden transition-all transform scale-100">
            {!scanComplete ? (
              <div className="text-center space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                  <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin" />
                  <Search className="absolute inset-0 m-auto h-8 w-8 text-red-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {discoveryStatus === 'STARTED' ? 'Phase 1: Deep Search' : 'Phase 2: Narrative Clustering'}
                  </h3>
                  <p className="text-slate-500 mt-2 font-medium">
                    {discoveryStatus === 'STARTED' 
                      ? `Searching global sources for: "${currentScanQuery}"`
                      : `Analysing & grouping storylines for: "${currentScanQuery}"`}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: discoveryStatus === 'STARTED' ? '40%' : '80%' }} 
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>{discoveryStatus === 'STARTED' ? 'Scraping' : 'Clustering'}</span>
                    <span>{discoveryStatus === 'STARTED' ? '40%' : '80%'}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-medium italic">
                  This may take 15-30 seconds. Please do not close this window.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Discovery Scan Launched!</h3>
                  <p className="text-slate-500 mt-2 font-medium">
                    The intelligence job has been dispatched to our research cluster. New stories will appear in your feed shortly.
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setIsScanning(false);
                    setScanComplete(false);
                    fetchClusters(true);
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
