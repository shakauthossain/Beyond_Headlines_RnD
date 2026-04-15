'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import { 
  Sparkles, 
  Save, 
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

interface SectionItem {
  id: string;
  title: string;
  note: string;
  body: string;
  headingIndex: number;
  bodyStartIndex: number;
  endIndex: number;
}

interface PendingSectionChange {
  sectionId: string;
  sectionTitle: string;
  originalBody: string;
  proposedBody: string;
}

const hasMeaningfulSectionBody = (body: string, note: string) => {
  const cleaned = (body || '').trim();
  if (!cleaned) return false;

  const normalizedBody = cleaned.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedNote = (note || '').toLowerCase().replace(/\s+/g, ' ').trim();

  if (!normalizedNote) return normalizedBody.length > 40;
  return normalizedBody !== normalizedNote && normalizedBody.length > Math.max(40, normalizedNote.length + 20);
};

const buildParagraphNodes = (text: string) => {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return [{ type: 'paragraph' }];
  }

  return blocks.map((block) => ({
    type: 'paragraph',
    content: [{ type: 'text', text: block }],
  }));
};

type DiffTokenKind = 'same' | 'removed' | 'added';

interface DiffToken {
  kind: DiffTokenKind;
  value: string;
}

const tokenizeWithWhitespace = (text: string) => text.split(/(\s+)/).filter((token) => token.length > 0);

const diffTokens = (original: string, proposed: string): DiffToken[] => {
  const a = tokenizeWithWhitespace(original);
  const b = tokenizeWithWhitespace(proposed);

  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j]
        ? 1 + dp[i + 1][j + 1]
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const result: DiffToken[] = [];

  const push = (kind: DiffTokenKind, value: string) => {
    if (!value) return;
    const last = result[result.length - 1];
    if (last && last.kind === kind) {
      last.value += value;
      return;
    }
    result.push({ kind, value });
  };

  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      push('same', a[i]);
      i += 1;
      j += 1;
      continue;
    }

    if (dp[i + 1][j] >= dp[i][j + 1]) {
      push('removed', a[i]);
      i += 1;
    } else {
      push('added', b[j]);
      j += 1;
    }
  }

  while (i < m) {
    push('removed', a[i]);
    i += 1;
  }
  while (j < n) {
    push('added', b[j]);
    j += 1;
  }

  return result;
};

const buildDiffPreviewNodes = (original: string, proposed: string) => {
  const tokens = diffTokens(original, proposed);

  const content = tokens
    .filter((token) => token.value.length > 0)
    .map((token) => {
      if (token.kind === 'removed') {
        return {
          type: 'text',
          text: token.value,
          marks: [{ type: 'strike' }],
        };
      }

      if (token.kind === 'added') {
        return {
          type: 'text',
          text: token.value,
          marks: [{ type: 'underline' }],
        };
      }

      return {
        type: 'text',
        text: token.value,
      };
    });

  if (content.length === 0) {
    return [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'No textual changes detected for this section.' }],
      },
    ];
  }

  return [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Change Preview: only changed words are highlighted.',
          marks: [{ type: 'italic' }],
        },
      ],
    },
    {
      type: 'paragraph',
      content,
    },
  ];
};

export default function Editor({ articleId, initialContent, title, onSave }: EditorProps) {
  const [isAssisting, setIsAssisting] = useState(false);
  const [assistResult, setAssistResult] = useState<any>(null);
  const [assistError, setAssistError] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [convoPrompt, setConvoPrompt] = useState('');
  const [isDraftConfirmed, setIsDraftConfirmed] = useState(false);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, 'pending' | 'generating' | 'ready' | 'failed' | 'approved'>>({});
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [isCompletingAllSections, setIsCompletingAllSections] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [bridgeMessage, setBridgeMessage] = useState('');
  const [pendingSectionChange, setPendingSectionChange] = useState<PendingSectionChange | null>(null);
  const bridgeAttemptedRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
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

    if (pendingSectionChange) {
      setAssistError('Accept or reject the pending section rewrite before saving.');
      return;
    }

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
    setAssistError('');
    setAssistResult(null);

    try {
      const fullText = editor.getText().trim();
      const text = (mode === 'assist' || mode === 'counterpoint') ? selectedText.trim() : fullText;

      if ((mode === 'assist' || mode === 'counterpoint') && !text) {
        setAssistError('Select a sentence or paragraph in the editor before running this assist action.');
        return;
      }

      if ((mode === 'assist' || mode === 'counterpoint') && !isDraftConfirmed) {
        setAssistError('Confirm draft first, then use Improve Clarity and Steelman Counterpoint.');
        return;
      }

      const timeoutByMode: Record<string, number> = {
        outline: 60000,
        assist: 45000,
        counterpoint: 45000,
      };

      const response = await api.post(
        `/articles/${articleId}/assist`,
        { mode, text },
        { timeout: timeoutByMode[mode] ?? 60000 },
      );
      setAssistResult({ mode, data: response.data.data });
    } catch (err: any) {
      console.error('AI Assist failed', err);
      if (err?.code === 'ECONNABORTED' || String(err?.message || '').toLowerCase().includes('timeout')) {
        setAssistError('AI is taking longer than expected. Please retry, or run the action on a smaller section.');
      } else {
        setAssistError(err?.response?.data?.message || 'AI assist failed. Please retry.');
      }
    } finally {
      setIsAssisting(false);
    }
  };

  const runSectionAssist = async (mode: 'complete_section' | 'rewrite_section', section: SectionItem) => {
    if (!editor) return;

    setAssistError('');
    setAssistResult(null);
    setIsAssisting(true);
    setSectionStatuses((prev) => ({ ...prev, [section.id]: 'generating' }));

    try {
      if (pendingSectionChange) {
        setAssistError('Resolve the pending section rewrite (accept/reject) before editing another section.');
        setSectionStatuses((prev) => ({ ...prev, [section.id]: 'failed' }));
        return;
      }

      if (mode === 'rewrite_section' && !convoPrompt.trim()) {
        setAssistError('Write a conversational prompt first, then run section rewrite.');
        setSectionStatuses((prev) => ({ ...prev, [section.id]: 'failed' }));
        return;
      }

      const payload = mode === 'complete_section'
        ? {
            mode,
            sectionTitle: section.title,
            sectionNote: section.note,
            sectionBody: section.body,
          }
        : {
            mode,
            sectionTitle: section.title,
            sectionBody: section.body,
            prompt: convoPrompt.trim(),
          };

      const response = await api.post(
        `/articles/${articleId}/assist`,
        payload,
        { timeout: 90000 },
      );

      if (mode === 'complete_section') {
        await replaceSectionBody(section.id, response?.data?.data?.completed || '');
        setSectionStatuses((prev) => ({ ...prev, [section.id]: 'ready' }));
      } else {
        const revised = response?.data?.data?.revised || '';
        await replaceSectionBody(section.id, revised, {
          persist: false,
          bodyNodes: buildDiffPreviewNodes(section.body, revised),
        });
        setPendingSectionChange({
          sectionId: section.id,
          sectionTitle: section.title,
          originalBody: section.body,
          proposedBody: revised,
        });
        setAssistError('Preview applied in editor. Accept or reject this section rewrite below.');
        setSectionStatuses((prev) => ({ ...prev, [section.id]: 'ready' }));
      }

      setSelectedSectionId(section.id);
    } catch (err: any) {
      console.error('Section assist failed', err);
      setSectionStatuses((prev) => ({ ...prev, [section.id]: 'failed' }));
      setAssistError(err?.response?.data?.message || 'Section assist failed. Please retry.');
    } finally {
      setIsAssisting(false);
    }
  };

  const completeAllSectionsSequentially = async () => {
    if (sections.length === 0 || isCompletingAllSections) return;

    if (pendingSectionChange) {
      setAssistError('Resolve the pending section rewrite (accept/reject) before running Complete All Sections.');
      return;
    }

    setAssistError('');
    setIsCompletingAllSections(true);

    try {
      const processedIds = new Set<string>();
      let guard = 0;
      while (guard < 50) {
        guard += 1;

        const latest = extractSections();
        const next = latest.find((s) => {
          if (processedIds.has(s.id)) return false;

          const status = sectionStatuses[s.id] ?? 'pending';
          const alreadyReadyByContent = hasMeaningfulSectionBody(s.body, s.note);

          if (status === 'approved' || status === 'ready') return false;
          if (alreadyReadyByContent) return false;
          return true;
        });

        if (!next) break;

        setSelectedSectionId(next.id);
        await runSectionAssist('complete_section', next);
        processedIds.add(next.id);
      }
    } finally {
      setIsCompletingAllSections(false);
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

    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.chain().focus().insertContentAt({ from, to }, suggestion).run();
    } else {
      editor.commands.insertContent(suggestion);
    }

    setAssistResult(null);
    setAssistError('');
  };

  const buildLocalScaffold = () => {
    const sections = [
      { label: 'Lead', direction: 'State the most important development and immediate stakes.' },
      { label: 'What Happened', direction: 'Summarize verified events, actors, and timeline in clear sequence.' },
      { label: 'Why It Matters', direction: 'Explain implications for markets, policy, and Bangladesh exposure.' },
      { label: 'Evidence & Data', direction: 'Add strongest facts, figures, and source-backed context.' },
      { label: 'Counterview', direction: 'Present the strongest opposing interpretation fairly.' },
      { label: 'What to Watch', direction: 'Close with likely scenarios and concrete indicators to track.' },
    ];

    let html = `<p><strong>${title}</strong></p>`;
    for (const section of sections) {
      html += `<h2>${section.label}</h2><p><em>Note: ${section.direction}</em></p><p></p>`;
    }
    return html;
  };

  const extractSections = (): SectionItem[] => {
    if (!editor) return [];
    const doc = editor.getJSON() as any;
    const nodes: any[] = doc?.content || [];
    const found: SectionItem[] = [];
    const slugCounts: Record<string, number> = {};

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node?.type !== 'heading' || node?.attrs?.level !== 2) continue;

      const titleText = Array.isArray(node.content)
        ? node.content.map((c: any) => c.text || '').join('').trim()
        : '';
      if (!titleText) continue;

      let j = i + 1;
      let note = '';
      if (nodes[j]?.type === 'paragraph') {
        const paraText = (nodes[j]?.content || []).map((c: any) => c.text || '').join('').trim();
        if (/^note\s*:/i.test(paraText)) {
          note = paraText.replace(/^note\s*:\s*/i, '').trim();
          j += 1;
        }
      }

      const bodyStartIndex = j;
      while (j < nodes.length && !(nodes[j]?.type === 'heading' && nodes[j]?.attrs?.level === 2)) {
        j += 1;
      }

      const bodyText = nodes
        .slice(bodyStartIndex, j)
        .map((n: any) => (n?.content || []).map((c: any) => c.text || '').join('').trim())
        .filter(Boolean)
        .join('\n\n');

      const slugBase = titleText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
      const nextCount = (slugCounts[slugBase] || 0) + 1;
      slugCounts[slugBase] = nextCount;

      found.push({
        id: `${slugBase}-${nextCount}`,
        title: titleText,
        note,
        body: bodyText,
        headingIndex: i,
        bodyStartIndex,
        endIndex: j,
      });
    }

    return found;
  };

  const replaceSectionBody = async (
    sectionId: string,
    newBodyText: string,
    options?: { persist?: boolean; bodyNodes?: any[] },
  ) => {
    if (!editor) return;

    const snapshot = extractSections();
    const target = snapshot.find((s) => s.id === sectionId);
    if (!target) return;

    const doc = editor.getJSON() as any;
    const nodes: any[] = doc?.content || [];
    const bodyNodes = options?.bodyNodes ?? buildParagraphNodes(newBodyText);
    const nextContent = [
      ...nodes.slice(0, target.bodyStartIndex),
      ...bodyNodes,
      ...nodes.slice(target.endIndex),
    ];

    editor.commands.setContent({ type: 'doc', content: nextContent });

    if (options?.persist === false) {
      return;
    }

    try {
      const content = editor.getJSON();
      await api.patch(`/articles/${articleId}`, { body: content });
      await api.post(`/articles/${articleId}/autosave`, { body: content, title });
      onSave(content);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Section save failed', err);
      setAssistError('Section updated locally, but autosave failed. Please click Save Draft.');
    }
  };

  const acceptPendingSectionChange = async () => {
    if (!pendingSectionChange) return;

    setAssistError('');
    setIsAssisting(true);

    try {
      await replaceSectionBody(pendingSectionChange.sectionId, pendingSectionChange.proposedBody);
      setSectionStatuses((prev) => ({ ...prev, [pendingSectionChange.sectionId]: 'ready' }));
      setPendingSectionChange(null);
      setAssistError('Section rewrite accepted and saved.');
    } catch (err) {
      console.error('Accept pending section change failed', err);
      setAssistError('Failed to save accepted section rewrite. Please retry.');
    } finally {
      setIsAssisting(false);
    }
  };

  const rejectPendingSectionChange = async () => {
    if (!pendingSectionChange) return;

    try {
      await replaceSectionBody(pendingSectionChange.sectionId, pendingSectionChange.originalBody, { persist: false });
      setSectionStatuses((prev) => ({ ...prev, [pendingSectionChange.sectionId]: 'ready' }));
      setPendingSectionChange(null);
      setAssistError('Rewrite rejected. Original section restored.');
    } catch (err) {
      console.error('Reject pending section change failed', err);
      setAssistError('Failed to reject section rewrite. Please retry.');
    }
  };

  useEffect(() => {
    if (!editor || bridgeAttemptedRef.current) return;

    const initialText = editor.getText().trim();
    if (initialText.length > 0) {
      bridgeAttemptedRef.current = true;
      return;
    }

    const seedFromOutline = async () => {
      bridgeAttemptedRef.current = true;
      setBridgeMessage('Seeding draft from Step 3 research...');

      // Fill immediately so the editor is never blank while waiting for AI.
      const localHtml = buildLocalScaffold();
      editor.commands.setContent(localHtml);
      const localContent = editor.getJSON();
      try {
        await api.patch(`/articles/${articleId}`, { body: localContent });
        await api.post(`/articles/${articleId}/autosave`, { body: localContent, title });
        onSave(localContent);
        setLastSaved(new Date());
      } catch (err) {
        console.error('Local scaffold save failed', err);
      }

      try {
        const requestOutline = async () => api.post(
          `/articles/${articleId}/assist`,
          { mode: 'outline', text: '' },
          { timeout: 20000 },
        );

        let response;
        try {
          response = await requestOutline();
        } catch {
          // API may still be warming up right after container restart.
          await new Promise((resolve) => setTimeout(resolve, 1200));
          response = await requestOutline();
        }

        const sections = response?.data?.data?.sections;

        if (Array.isArray(sections) && sections.length > 0) {
          let html = `<p><strong>${title}</strong></p>`;
          for (const section of sections) {
            html += `<h2>${section.label}</h2><p><em>Note: ${section.direction}</em></p><p></p>`;
          }

          editor.commands.setContent(html);

          const content = editor.getJSON();
          await api.patch(`/articles/${articleId}`, { body: content });
          await api.post(`/articles/${articleId}/autosave`, { body: content, title });
          onSave(content);
          setLastSaved(new Date());
          setBridgeMessage('Draft scaffold generated from research.');
          return;
        }

        setBridgeMessage('Using starter scaffold. Click Generate Outline to refine.');
      } catch (err) {
        console.error('Auto-seed bridge failed', err);
        setBridgeMessage('Using starter scaffold. AI refine unavailable right now.');
      }
    };

    seedFromOutline();
  }, [articleId, editor, onSave, title]);

  useEffect(() => {
    if (!editor) return;

    const updateSelection = () => {
      const { from, to } = editor.state.selection;
      setSelectedText(from !== to ? editor.state.doc.textBetween(from, to, '\n').trim() : '');
    };

    updateSelection();
    editor.on('selectionUpdate', updateSelection);
    editor.on('transaction', updateSelection);

    return () => {
      editor.off('selectionUpdate', updateSelection);
      editor.off('transaction', updateSelection);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const updateSectionsFromDoc = () => {
      const nextSections = extractSections();
      setSections(nextSections);

      setSectionStatuses((prev) => {
        const next: Record<string, 'pending' | 'generating' | 'ready' | 'failed' | 'approved'> = {};
        for (const s of nextSections) {
          const existing = prev[s.id];
          const derivedReady = hasMeaningfulSectionBody(s.body, s.note);

          if (existing === 'approved') {
            next[s.id] = 'approved';
          } else if (existing === 'generating') {
            next[s.id] = 'generating';
          } else if (derivedReady) {
            next[s.id] = 'ready';
          } else {
            next[s.id] = existing ?? 'pending';
          }
        }
        return next;
      });

      if (nextSections.length > 0 && (!selectedSectionId || !nextSections.some((s) => s.id === selectedSectionId))) {
        setSelectedSectionId(nextSections[0].id);
      }
    };

    updateSectionsFromDoc();
    editor.on('transaction', updateSectionsFromDoc);

    return () => {
      editor.off('transaction', updateSectionsFromDoc);
    };
  }, [editor, selectedSectionId]);

  const hasSelection = selectedText.length > 0;
  const selectedSection = sections.find((s) => s.id === selectedSectionId) || null;

  const getEffectiveSectionStatus = (section: SectionItem) => {
    const raw = sectionStatuses[section.id] ?? 'pending';
    if (raw === 'approved' || raw === 'generating' || raw === 'failed') {
      return raw;
    }

    // If section already has meaningful body text, it should be considered ready
    // even when stale state still says pending.
    return hasMeaningfulSectionBody(section.body, section.note) ? 'ready' : 'pending';
  };

  const statusText = (status: 'pending' | 'generating' | 'ready' | 'failed' | 'approved') => {
    if (status === 'generating') return 'Generating';
    if (status === 'ready') return 'Ready';
    if (status === 'failed') return 'Failed';
    if (status === 'approved') return 'Approved';
    return 'Pending';
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
                   Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
               <button
                onClick={() => setIsDraftConfirmed((v) => !v)}
                className={`inline-flex items-center px-3 py-1.5 border rounded text-xs font-bold transition shadow-sm ${
                  isDraftConfirmed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
               >
                 {isDraftConfirmed ? 'Draft Confirmed' : 'Confirm Draft'}
               </button>
             </div>
          </div>

          <EditorContent editor={editor} className="flex-1" />

          {bridgeMessage && (
            <div className="px-6 py-2 text-[11px] font-medium text-slate-500 border-t border-slate-100 bg-slate-50/50">
              {bridgeMessage}
            </div>
          )}
          
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest">
            <span>{editor?.storage.characterCount.words()} Words</span>
            <span>{editor?.storage.characterCount.characters()} Characters</span>
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20 self-start">
        <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-white/5 flex flex-col lg:max-h-[calc(100vh-6rem)]">
          <div className="p-4 bg-red-600 flex items-center justify-between">
            <h3 className="text-white font-bold text-sm flex items-center uppercase tracking-wider">
              <Sparkles size={16} className="mr-2 fill-white/20" />
              Claude 4.5 Editor Assist
            </h3>
          </div>

          <div className="assistant-scroll flex-1 overflow-y-auto px-4 py-4 space-y-4">
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

            <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section-Wise Drafting</p>
                <span className="text-[10px] font-bold text-slate-300">{sections.length} sections</span>
              </div>

              <div className="max-h-44 overflow-auto space-y-1 pr-1">
                {sections.map((section) => (
                  (() => {
                    const effectiveStatus = getEffectiveSectionStatus(section);
                    return (
                  <div
                    key={section.id}
                    className={`w-full p-2 rounded border text-xs transition ${selectedSectionId === section.id ? 'border-red-500/50 bg-red-950/20 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedSectionId(section.id)}
                        className="flex-1 text-left"
                      >
                        <span className="font-semibold truncate block">{section.title}</span>
                      </button>

                      <span className={`text-[10px] font-bold ${effectiveStatus === 'failed' ? 'text-red-300' : effectiveStatus === 'ready' ? 'text-emerald-300' : effectiveStatus === 'generating' ? 'text-amber-300' : effectiveStatus === 'approved' ? 'text-blue-300' : 'text-slate-400'}`}>
                        {statusText(effectiveStatus)}
                      </span>

                      <button
                        onClick={() => runSectionAssist('complete_section', section)}
                        disabled={isAssisting || effectiveStatus === 'generating' || !!pendingSectionChange}
                        className="px-2 py-1 rounded border border-white/20 text-[10px] font-bold hover:bg-white/10 disabled:opacity-50"
                        title={effectiveStatus === 'ready' || effectiveStatus === 'approved' ? 'Regenerate this section' : 'Generate this section'}
                      >
                        {effectiveStatus === 'ready' || effectiveStatus === 'approved' ? 'Regenerate' : 'Generate'}
                      </button>
                    </div>
                  </div>
                    );
                  })()
                ))}
              </div>

              <button
                onClick={completeAllSectionsSequentially}
                disabled={isAssisting || isCompletingAllSections || sections.length === 0 || !!pendingSectionChange}
                className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {isCompletingAllSections ? 'Completing Sections...' : 'Complete All Sections'}
              </button>

              <button
                onClick={() => {
                  if (!selectedSection) return;
                  setSectionStatuses((prev) => ({ ...prev, [selectedSection.id]: 'approved' }));
                }}
                disabled={!selectedSection || (selectedSection && getEffectiveSectionStatus(selectedSection) !== 'ready')}
                className="w-full py-2 bg-slate-700 text-white text-xs font-bold rounded hover:bg-slate-600 transition disabled:opacity-50"
              >
                Approve Selected Section
              </button>
            </div>

            <button
              onClick={() => runAIAssist('assist')}
              disabled={isAssisting || !hasSelection || !isDraftConfirmed}
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
              disabled={isAssisting || !hasSelection || !isDraftConfirmed}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition group"
            >
              <div className="flex items-center">
                <MessageSquare size={18} className="mr-3 text-amber-500" />
                <div className="text-left">
                  <div className="text-sm font-bold">Steelman Counterpoint</div>
                  <div className="text-[10px] text-slate-400 font-medium tracking-tight">Challenge your own narrative</div>
                </div>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {!hasSelection && (
              <div className="text-[10px] font-medium text-slate-400 bg-white/5 border border-white/10 rounded p-2">
                Select text in the editor to enable Improve Clarity and Steelman Counterpoint.
              </div>
            )}

            {!isDraftConfirmed && (
              <div className="text-[10px] font-medium text-amber-300 bg-amber-950/20 border border-amber-500/20 rounded p-2">
                Confirm draft first to unlock Improve Clarity and Steelman Counterpoint.
              </div>
            )}

            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section Prompt</label>
              <textarea
                value={convoPrompt}
                onChange={(e) => setConvoPrompt(e.target.value)}
                placeholder="e.g., Rewrite this section with a skeptical tone and tighter logic."
                className="w-full min-h-[74px] rounded-lg bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-500 text-xs p-3 focus:outline-none focus:ring-1 focus:ring-red-500/50"
              />
              <button
                onClick={() => selectedSection && runSectionAssist('rewrite_section', selectedSection)}
                disabled={isAssisting || !selectedSection || !convoPrompt.trim() || !!pendingSectionChange}
                className="w-full py-2 bg-white text-black text-xs font-bold rounded hover:bg-slate-200 transition disabled:opacity-50"
              >
                Apply Prompt as Preview
              </button>

              {pendingSectionChange && (
                <div className="rounded-lg border border-amber-400/30 bg-amber-950/20 p-3 space-y-2">
                  <p className="text-[10px] font-semibold text-amber-200">
                    Previewing rewrite for: <span className="font-bold">{pendingSectionChange.sectionTitle}</span>
                  </p>
                  <p className="text-[10px] text-amber-100/80">
                    The proposed text is visible in the editor. Accept to keep it, or reject to restore the original section.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={acceptPendingSectionChange}
                      disabled={isSaving}
                      className="w-full py-2 bg-emerald-600 text-white text-[10px] font-bold rounded hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      Keep
                    </button>
                    <button
                      onClick={rejectPendingSectionChange}
                      disabled={isSaving}
                      className="w-full py-2 bg-slate-700 text-white text-[10px] font-bold rounded hover:bg-slate-600 transition disabled:opacity-50"
                    >
                      Undo
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* AI Result Area */}
            {isAssisting && (
              <div className="pt-1 pb-2 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="text-red-500 animate-spin" size={24} />
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Editor processing...</span>
              </div>
            )}

            {assistError && (
              <div className="pb-2">
                <div className="text-[11px] font-semibold text-red-300 bg-red-950/30 border border-red-500/20 rounded p-2">
                  {assistError}
                </div>
              </div>
            )}

            {assistResult && (
              <div className="pb-3 animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
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
                      >Replace Selection</button>
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
