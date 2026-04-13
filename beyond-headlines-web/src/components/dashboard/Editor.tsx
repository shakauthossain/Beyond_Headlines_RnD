'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import { 
  Sparkles, 
  Save, 
  RotateCcw, 
  Search, 
  PenTool, 
  MessageSquare, 
  PlusCircle,
  Loader2,
  CheckCircle,
  ChevronRight,
  List
} from 'lucide-react';
import api from '@/lib/api';

interface EditorProps {
  articleId: string;
  initialContent?: any;
  title: string;
  onSave: (content: any) => void;
}

export default function Editor({ articleId, initialContent, title, onSave }: EditorProps) {
  const [isAssisting, setIsAssisting] = useState(false);
  const [assistResult, setAssistResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your investigative piece here...',
      }),
      CharacterCount,
    ],
    content: initialContent || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[500px] px-8 py-4',
      },
    },
  });

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      const content = editor.getJSON();
      await api.patch(`/articles/${articleId}`, { body: content });
      await api.post(`/articles/${articleId}/autosave`, { body: content, title });
      onSave(content);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  const runAIAssist = async (mode: 'outline' | 'assist' | 'counterpoint') => {
    if (!editor) return;
    setIsAssisting(true);
    setAssistResult(null);

    try {
      const text = editor.getText();
      const response = await api.post(`/articles/${articleId}/assist`, { mode, text });
      setAssistResult({ mode, data: response.data.data });
    } catch (err) {
      console.error('AI Assist failed', err);
    } finally {
      setIsAssisting(false);
    }
  };

  const applyOutline = () => {
    if (!editor || !assistResult || assistResult.mode !== 'outline') return;
    
    let html = '';
    assistResult.data.sections.forEach((s: any) => {
      html += `<h2>${s.label}</h2><p><em>Note: ${s.direction}</em></p><p></p>`;
    });
    
    editor.commands.setContent(html);
    setAssistResult(null);
  };

  const applySuggestion = (suggestion: string) => {
    if (!editor) return;
    editor.commands.insertContent(suggestion);
    setAssistResult(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Main Editor Column */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
          {/* Editor Header / Toolbar */}
          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <div className="flex items-center space-x-1">
                <button 
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`p-1.5 rounded hover:bg-slate-200 font-bold ${editor?.isActive('bold') ? 'bg-slate-200' : ''}`}
                >B</button>
                <button 
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`p-1.5 rounded hover:bg-slate-200 italic ${editor?.isActive('italic') ? 'bg-slate-200' : ''}`}
                >I</button>
                <button 
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  className={`p-1.5 rounded hover:bg-slate-200 underline ${editor?.isActive('underline') ? 'bg-slate-200' : ''}`}
                >U</button>
                <div className="h-4 w-px bg-slate-300 mx-1" />
                <button 
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`p-1.5 rounded hover:bg-slate-200 ${editor?.isActive('heading', { level: 2 }) ? 'bg-slate-200' : ''}`}
                >H2</button>
                <button 
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`p-1.5 rounded hover:bg-slate-200 ${editor?.isActive('bulletList') ? 'bg-slate-200' : ''}`}
                ><List size={18} /></button>
             </div>

             <div className="flex items-center space-x-4">
               {lastSaved && (
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center">
                   <CheckCircle size={10} className="mr-1 text-emerald-500" />
                   Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
               )}
               <button 
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
               >
                 {isSaving ? <Loader2 size={12} className="mr-2 animate-spin" /> : <Save size={12} className="mr-2" />}
                 Save Draft
               </button>
             </div>
          </div>

          <EditorContent editor={editor} className="flex-1" />
          
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest">
            <span>{editor?.storage.characterCount.words()} Words</span>
            <span>{editor?.storage.characterCount.characters()} Characters</span>
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <div className="lg:col-span-4 space-y-6 sticky top-24">
        <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-white/5">
          <div className="p-4 bg-red-600 flex items-center justify-between">
            <h3 className="text-white font-bold text-sm flex items-center uppercase tracking-wider">
              <Sparkles size={16} className="mr-2 fill-white/20" />
              Claude 4.5 Editor Assist
            </h3>
          </div>

          <div className="p-6 space-y-5">
            <button 
              onClick={() => runAIAssist('outline')}
              disabled={isAssisting}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition group"
            >
              <div className="flex items-center">
                <PlusCircle size={18} className="mr-3 text-red-500" />
                <div className="text-left">
                  <div className="text-sm font-bold">Generate Outline</div>
                  <div className="text-[10px] text-slate-400 font-medium tracking-tight">Structured from Step 3 Research</div>
                </div>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button 
              onClick={() => runAIAssist('assist')}
              disabled={isAssisting}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition group"
            >
              <div className="flex items-center">
                <PenTool size={18} className="mr-3 text-blue-500" />
                <div className="text-left">
                  <div className="text-sm font-bold">Improve Clarity</div>
                  <div className="text-[10px] text-slate-400 font-medium tracking-tight">Fix flow & optimize tone</div>
                </div>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button 
              onClick={() => runAIAssist('counterpoint')}
              disabled={isAssisting}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition group"
            >
              <div className="flex items-center">
                <MessageSquare size={18} className="mr-3 text-amber-500" />
                <div className="text-left">
                  <div className="text-sm font-bold">Stellman Counterpoint</div>
                  <div className="text-[10px] text-slate-400 font-medium tracking-tight">Challenge your own narrative</div>
                </div>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* AI Result Area */}
          {isAssisting && (
            <div className="px-6 pb-6 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="text-red-500 animate-spin" size={24} />
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Editor processing...</span>
            </div>
          )}

          {assistResult && (
            <div className="px-6 pb-8 animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  {assistResult.mode === 'outline' && (
                    <>
                      <h4 className="text-xs font-black text-slate-400 uppercase mb-3 tracking-widest">Suggested Structure</h4>
                      <div className="space-y-3 mb-5">
                         {assistResult.data.sections.map((s: any, i: number) => (
                           <div key={i} className="text-[11px] text-slate-300 border-l border-red-500 pl-3 py-0.5">
                              <span className="font-bold text-white tracking-tight">{s.label}</span>
                              <p className="opacity-60">{s.direction}</p>
                           </div>
                         ))}
                      </div>
                      <button 
                        onClick={applyOutline}
                        className="w-full py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition"
                      >Apply to Editor</button>
                    </>
                  )}

                  {assistResult.mode === 'assist' && (
                    <>
                      <h4 className="text-xs font-black text-slate-400 uppercase mb-3 tracking-widest italic">AI Suggestion</h4>
                      <p className="text-sm text-white mb-3 bg-red-950/20 p-3 border border-red-500/10 rounded font-medium italic">
                        "{assistResult.data.suggested}"
                      </p>
                      <button 
                        onClick={() => applySuggestion(assistResult.data.suggested)}
                        className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition"
                      >Replace Selected</button>
                    </>
                  )}

                  {assistResult.mode === 'counterpoint' && (
                    <>
                      <h4 className="text-xs font-black uppercase mb-3 tracking-widest text-amber-500 flex items-center">
                         <AlertCircle size={10} className="mr-1" />
                         Alternative View
                      </h4>
                      <p className="text-sm text-slate-300 mb-4 bg-amber-950/20 p-3 border border-amber-500/10 rounded font-medium">
                        {assistResult.data.counterpoint}
                      </p>
                      <button 
                        onClick={() => applySuggestion(`\n\n> **Counter-perspective:** ${assistResult.data.counterpoint}\n\n`)}
                        className="w-full py-2 bg-white text-black text-xs font-bold rounded hover:bg-slate-200 transition"
                      >Insert as Quote</button>
                    </>
                  )}
               </div>
            </div>
          )}
        </div>

        {/* Quick Research Link */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group">
           <div className="flex items-center">
             <div className="p-2 bg-slate-50 rounded-lg mr-3 group-hover:bg-red-50 transition">
               <Search size={18} className="text-slate-400 group-hover:text-red-500 transition" />
             </div>
             <div>
                <div className="text-sm font-bold text-slate-900 leading-tight">View Research</div>
                <div className="text-[10px] text-slate-500 font-medium tracking-tight">Access Step 3 data</div>
             </div>
           </div>
           <a 
             href={`/dashboard/research?articleId=${articleId}`} 
             target="_blank" 
             className="text-slate-400 hover:text-slate-600 transition"
           >
             <ChevronRight size={18} />
           </a>
        </div>
      </div>
    </div>
  );
}

// Minimal stub for AlertCircle if needed
const AlertCircle = ({ className, size }: { className?: string, size: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
