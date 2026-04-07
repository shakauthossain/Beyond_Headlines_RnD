'use client';

import React from 'react';
import { TopicCluster } from '@/types';
import { Users, Zap, TrendingUp, ChevronRight, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface ClusterCardProps {
  cluster: TopicCluster;
  onSelect: (id: string) => void;
}

export default function ClusterCard({ cluster, onSelect }: ClusterCardProps) {
  const getSentimentStyles = (sentiment: string) => {
    switch (sentiment) {
      case 'critical':
        return { 
          bg: 'bg-red-50', 
          text: 'text-red-700', 
          border: 'border-red-100',
          icon: AlertCircle
        };
      case 'supportive':
        return { 
          bg: 'bg-emerald-50', 
          text: 'text-emerald-700', 
          border: 'border-emerald-100',
          icon: CheckCircle2
        };
      default:
        return { 
          bg: 'bg-slate-50', 
          text: 'text-slate-700', 
          border: 'border-slate-100',
          icon: Info
        };
    }
  };

  const sentiment = getSentimentStyles(cluster.sentiment);
  const SentimentIcon = sentiment.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group h-full">
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center border ${sentiment.bg} ${sentiment.text} ${sentiment.border}`}>
              <SentimentIcon size={12} className="mr-1" />
              {cluster.sentiment}
            </div>
            {cluster.is_emerging && (
              <div className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 flex items-center">
                <Zap size={12} className="mr-1 fill-blue-700" />
                Emerging
              </div>
            )}
          </div>
          <div className="flex items-center text-slate-500 font-medium text-sm">
            <Users size={14} className="mr-1.5" />
            {cluster.article_count} sources
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-red-600 transition-colors">
          {cluster.topic}
        </h3>
        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed mb-4">
          {cluster.summary}
        </p>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center">
          <TrendingUp size={10} className="mr-1" />
          Discovered {new Date(cluster.createdAt).toLocaleDateString()}
        </span>
        <button 
          onClick={() => onSelect(cluster.id)}
          className="bg-white text-slate-900 border border-slate-200 hover:bg-red-600 hover:text-white hover:border-red-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center transition-all duration-200"
        >
          Create Article
          <ChevronRight size={16} className="ml-1" />
        </button>
      </div>
    </div>
  );
}
