"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { TopicCluster } from "@/types";
import ClusterCard from "@/components/dashboard/ClusterCard";
import { Loader2, RefreshCcw, Search, Filter, Newspaper, AlertTriangle, CheckCircle2, X } from "lucide-react";

// --- CONSTANTS ---
const CATEGORIES = ['politics', 'crime', 'finance', 'business', 'technology', 'health', 'sports', 'environment', 'international', 'culture'];
const REGIONS = ['bangladesh_national', 'dhaka', 'chittagong', 'sylhet', 'rajshahi', 'south_asia', 'international'];
const TIMEFRAMES = [
  { value: 'last_24h', label: 'Past 24 Hours' },
  { value: 'last_week', label: 'Past Week' },
  { value: 'last_month', label: 'Past Month' },
  { value: 'any', label: 'Anytime' }
];

export default function ClustersPage() {
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Scaping/Scanning State
  const [isAnalyzingIntent, setIsAnalyzingIntent] = useState(false);
  const [showIntentPopup, setShowIntentPopup] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [currentScanQuery, setCurrentScanQuery] = useState("");
  
  // Intent Configuration
  const [intentParams, setIntentParams] = useState({
    category: 'business',
    region: 'bangladesh_national',
    timeframe: 'last_week',
    searchSlug: '',
    refinedQuery: ''
  });
  const [confidences, setConfidences] = useState({
    category: 1.0,
    region: 1.0,
    timeframe: 1.0
  });

  const [discoveryStatus, setDiscoveryStatus] = useState<any>("STARTED");

  const fetchClusters = async (quiet = false, category: string | null = null) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    setError("");
    try {
      const response = await api.get("/intelligence/trending", {
        params: { category }
      });
      setClusters(response.data.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch clusters. Is the API running?",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const pollStatus = async (jobId: string) => {
    try {
      const response = await api.get(`/search/status/${jobId}`);
      const { status, isFinished, results } = response.data.data;

      setDiscoveryStatus(status);

      if (isFinished) {
        setScanComplete(true);
        setIsScanning(false);
        // Refresh feed with the category we just scanned to ensure we see the new clusters
        await fetchClusters(true, intentParams.category); 
      } else {
        setTimeout(() => pollStatus(jobId), 2000);
      }
    } catch (err: any) {
      console.error("Polling error", err);
      setError("Scanning status check failed. Please check connection.");
      setIsScanning(false);
    }
  };

  const handleLaunchSearch = async () => {
    if (!query.trim()) return;
    
    setIsAnalyzingIntent(true);
    setError("");
    
    try {
      const response = await api.post("/search/intent", { query: query.trim() });
      const { category, region, timeframe, searchSlug, refinedQuery, confidence } = response.data.data;
      
      setIntentParams({ category, region, timeframe, searchSlug, refinedQuery });
      setConfidences(confidence);
      setCurrentScanQuery(query.trim());
      setShowIntentPopup(true);
    } catch (err: any) {
      setError("Failed to classify intent. Please try again.");
    } finally {
      setIsAnalyzingIntent(false);
    }
  };

  const handleConfirmScrape = async () => {
    setShowIntentPopup(false);
    setIsScanning(true);
    setScanComplete(false);
    
    try {
      const response = await api.post("/search/run", {
        query: currentScanQuery,
        ...intentParams
      });
      
      const { jobId, cached } = response.data.data;
      
      if (cached) {
          // Instant resolution if cached
          setScanComplete(true);
          setIsScanning(false);
          await fetchClusters(true);
      } else {
          pollStatus(jobId);
      }
    } catch (err: any) {
      setError("Failed to launch scrape job.");
      setIsScanning(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const filteredClusters = clusters.filter((c) => {
    const termMatch =
      c.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.summary.toLowerCase().includes(searchTerm.toLowerCase());

    // Fix 4: Relevance Suppression (Keyword Overlap)
    if (currentScanQuery && currentScanQuery.trim() !== "") {
      const queryTokens = currentScanQuery
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length > 3); // Ignore small words like 'on', 'the', 'us'
      
      const content = (c.topic + " " + c.summary).toLowerCase();
      const hasOverlap = queryTokens.some((token) => content.includes(token));
      
      return termMatch && hasOverlap;
    }

    return termMatch;
  });

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
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Intelligence Discovery
              </h1>
              <p className="text-slate-500 mt-2 font-medium leading-relaxed">
                Enter a topic or headline to launch a targeted intelligence
                scan across global and local news sources.
              </p>
            </div>
            <button
              onClick={() => fetchClusters(true)}
              disabled={isRefreshing}
              className="self-start md:self-center inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCcw
                size={16}
                className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
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
                onKeyPress={(e) => e.key === "Enter" && handleLaunchSearch()}
                className="block w-full pl-12 pr-4 py-4 border-2 border-slate-100 bg-slate-50 rounded-xl focus:ring-red-500 focus:border-red-500 text-base placeholder-slate-400 text-slate-800 font-medium transition-all"
              />
            </div>
            <button
              onClick={handleLaunchSearch}
              disabled={isAnalyzingIntent || isScanning || !query.trim()}
              className="inline-flex items-center justify-center px-8 py-4 bg-red-600 rounded-xl text-white font-bold hover:bg-red-700 shadow-md shadow-red-200 transition-all disabled:opacity-50 active:scale-95"
            >
              {isAnalyzingIntent ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Intent...
                </>
              ) : (
                "Launch Discovery Scan"
              )}
            </button>
          </div>

          {currentScanQuery && !showIntentPopup && (
            <div className="mt-6 flex items-center animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="inline-flex items-center px-4 py-2 bg-red-50 border border-red-100 rounded-full group transition-all hover:bg-red-100/50">
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest mr-2">
                  Topic:
                </span>
                <span className="text-sm font-black text-red-700">
                  {currentScanQuery}
                </span>
                <button
                  onClick={() => {
                    setCurrentScanQuery("");
                    fetchClusters();
                  }}
                  className="ml-3 p-1 hover:bg-red-200 rounded-full transition-colors"
                >
                  <RefreshCcw size={14} className="text-red-600" />
                </button>
              </div>
            </div>
          )}
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
          <h3 className="text-lg font-bold text-slate-900 border-b-0">
            No clusters found
          </h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2 font-medium">
            Try adjusting your search or refresh the feed to scan for latest news.
          </p>
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

      {/* --- MODAL 1: Intent Confirmation Overlay --- */}
      {showIntentPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowIntentPopup(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900">Verify Search Intent</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Refine your scanner targets</p>
              </div>
              <button onClick={() => setShowIntentPopup(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-tighter">Your Query</span>
                <p className="text-slate-800 font-bold text-lg leading-snug">"{currentScanQuery}"</p>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {/* Category Selection */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-black text-slate-700 ml-1">News Category</label>
                    {confidences.category < 0.7 && (
                      <span className="flex items-center text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase leading-none">
                        <AlertTriangle size={10} className="mr-1" /> AI Unsure
                      </span>
                    )}
                  </div>
                  <select
                    value={intentParams.category}
                    onChange={(e) => setIntentParams({...intentParams, category: e.target.value})}
                    className={`w-full p-4 bg-slate-50 border-2 rounded-2xl text-slate-800 font-bold focus:ring-red-500 focus:border-red-500 transition-all appearance-none cursor-pointer ${
                      confidences.category < 0.7 ? 'border-amber-400' : 'border-slate-100'
                    }`}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Region Selection */}
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                    <label className="text-sm font-black text-slate-700 ml-1">Region Target</label>
                    {confidences.region < 0.7 && (
                      <span className="flex items-center text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase leading-none">
                        <AlertTriangle size={10} className="mr-1" /> AI Unsure
                      </span>
                    )}
                  </div>
                  <select
                    value={intentParams.region}
                    onChange={(e) => setIntentParams({...intentParams, region: e.target.value})}
                    className={`w-full p-4 bg-slate-50 border-2 rounded-2xl text-slate-800 font-bold focus:ring-red-500 focus:border-red-500 transition-all appearance-none cursor-pointer ${
                      confidences.region < 0.7 ? 'border-amber-400' : 'border-slate-100'
                    }`}
                  >
                    {REGIONS.map(reg => (
                      <option key={reg} value={reg}>{reg.replace('_', ' ').charAt(0).toUpperCase() + reg.replace('_', ' ').slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Timeframe Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 ml-1">Recency Filter</label>
                  <select
                    value={intentParams.timeframe}
                    onChange={(e) => setIntentParams({...intentParams, timeframe: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-800 font-bold focus:ring-red-500 focus:border-red-500 transition-all appearance-none cursor-pointer"
                  >
                    {TIMEFRAMES.map(tf => (
                      <option key={tf.value} value={tf.value}>{tf.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={handleConfirmScrape}
                  className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-lg hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-[0.98] flex items-center justify-center"
                >
                  Confirm & Launch Sync
                  <CheckCircle2 size={20} className="ml-2" />
                </button>
                <button
                  onClick={() => setShowIntentPopup(false)}
                  className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                >
                  Cancel and Modify Query
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Execution Status Overlay --- */}
      {(isScanning || scanComplete) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 overflow-hidden text-center space-y-8 animate-in zoom-in-95 duration-200">
            {!scanComplete ? (
              <>
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                  <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin" />
                  <Newspaper className="absolute inset-0 m-auto h-8 w-8 text-red-600" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900">Deterministic Sync Underway</h3>
                  <p className="text-slate-500 mt-3 font-medium text-sm">
                    {discoveryStatus === "scraping"
                      ? `Browsing global sources for ${intentParams.category} news...`
                      : discoveryStatus === "clustering" 
                      ? `AI is grouping narratives for your briefing...`
                      : `Finalising discovery results...`}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: discoveryStatus === "completed" ? "100%" : discoveryStatus === "clustering" ? "85%" : "45%" }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>
                      {discoveryStatus === "scraping" ? "Phase 1: Scraping" : "Phase 2: AI Clustering"}
                    </span>
                    <span>{discoveryStatus === "completed" ? "Done" : "Syncing"}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900">Sync Complete</h3>
                  <p className="text-slate-500 mt-3 font-medium text-sm leading-relaxed">
                    Intelligence dispatched to our research cluster. Filtered news results are now appearing in your feed.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsScanning(false);
                    setScanComplete(false);
                    setQuery("");
                  }}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  Return to Dashboard
                </button>
              </>
            )}
            
            {!scanComplete && (
               <p className="text-xs text-slate-400 font-bold italic tracking-tight">
                Deterministic architecture: no hallucinations, pure headlines only.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
