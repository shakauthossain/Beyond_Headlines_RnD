'use client';

import React, { useState } from 'react';
import { Loader2, Check, ChevronRight, AlertCircle, Lightbulb, Users, MessageSquare } from 'lucide-react';

interface TopicBrief {
  issue_summary: string;
  key_questions: string[];
  stakeholders: { name: string; position: string }[];
  viewpoints: { perspective: string; argument: string }[];
  suggested_angles: { title: string; reasoning: string; target_audience: string }[];
}

interface AngleSelectorProps {
  brief: TopicBrief;
  onConfirm: (angle: string) => void;
  isSubmitting: boolean;
}

export default function AngleSelector({ brief, onConfirm, isSubmitting }: AngleSelectorProps) {
  const [selectedAngle, setSelectedAngle] = useState('');
  const [customAngle, setCustomAngle] = useState('');

  const handleConfirm = () => {
    const finalAngle = selectedAngle === 'custom' ? customAngle : selectedAngle;
    if (finalAngle) {
      onConfirm(finalAngle);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Issue Summary */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
          <Info className="mr-2 text-red-600" size={20} />
          Editorial Brief: Issue Summary
        </h2>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
          {brief.issue_summary}
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. Key Questions */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <MessageSquare className="mr-2 text-blue-600" size={18} />
            Key Questions to Answer
          </h2>
          <ul className="space-y-3">
            {brief.key_questions.map((q, i) => (
              <li key={i} className="flex items-start text-sm text-slate-600 font-medium">
                <span className="text-red-500 mr-2 font-bold">•</span>
                {q}
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Stakeholders */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <Users className="mr-2 text-emerald-600" size={18} />
            Primary Stakeholders
          </h2>
          <div className="space-y-4">
            {brief.stakeholders.map((s, i) => (
              <div key={i} className="flex flex-col border-l-2 border-slate-100 pl-4 py-1">
                <span className="text-sm font-bold text-slate-800">{s.name}</span>
                <span className="text-xs text-slate-500 font-medium">{s.position}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 4. Select Angle */}
      <section className="bg-slate-900 rounded-xl shadow-xl p-8 text-white ring-1 ring-white/10">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <Lightbulb className="mr-2 text-yellow-400" size={20} />
          Step 2: Decide the Narrative Angle
        </h2>
        
        <div className="grid grid-cols-1 gap-4 mb-8">
          {brief.suggested_angles.map((angle, i) => (
            <button
              key={i}
              onClick={() => { setSelectedAngle(angle.title); setCustomAngle(''); }}
              className={`text-left p-5 rounded-lg border transition-all duration-200 ${
                selectedAngle === angle.title 
                  ? 'bg-red-600 border-red-500 shadow-lg ring-1 ring-red-400' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{angle.title}</h3>
                {selectedAngle === angle.title && <Check size={20} className="text-white" />}
              </div>
              <p className="text-sm text-slate-300 mb-3 font-medium opacity-90">{angle.reasoning}</p>
              <div className="inline-flex items-center text-[10px] uppercase tracking-widest font-black text-white/50 bg-black/20 px-2 py-1 rounded">
                Target: {angle.target_audience}
              </div>
            </button>
          ))}

          <button
            onClick={() => setSelectedAngle('custom')}
            className={`text-left p-5 rounded-lg border transition-all duration-200 ${
              selectedAngle === 'custom' 
                ? 'bg-red-600 border-red-500 shadow-lg' 
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">Custom Angle</h3>
              {selectedAngle === 'custom' && <Check size={20} className="text-white" />}
            </div>
            {selectedAngle === 'custom' && (
              <textarea
                autoFocus
                className="w-full mt-2 bg-black/20 border border-white/20 rounded p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/40"
                placeholder="Describe your unique perspective or investigative angle..."
                rows={3}
                value={customAngle}
                onChange={(e) => setCustomAngle(e.target.value)}
              />
            )}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || (!selectedAngle) || (selectedAngle === 'custom' && !customAngle)}
            className="bg-white text-slate-900 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-bold flex items-center transition-all shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Initializing Article...
              </>
            ) : (
              <>
                Confirm Angle & Start Draft
                <ChevronRight size={20} className="ml-1" />
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

// Minimal stub for info icon if lucide doesn't have it under Info
const Info = ({ className, size }: { className: string, size: number }) => (
  <AlertCircle className={className} size={size} />
);
