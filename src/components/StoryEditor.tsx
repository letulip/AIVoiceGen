import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Clock, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Volume2, 
  Mic2,
  Loader2,
  FileText,
  Quote,
  Flame,
  Moon,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Chapter, StoryProject } from '../types';
import { estimateReadingTime } from '../utils/audio';
import { polishStory } from '../services/gemini';

interface StoryEditorProps {
  project: StoryProject;
  apiKey: string;
  activeChapter: Chapter;
  onUpdateChapterContent: (chapterId: string, content: string) => void;
  onAddChapter: () => void;
  onDeleteChapter: (chapterId: string) => void;
  onRenameChapter: (chapterId: string, newTitle: string) => void;
  onSelectChapter: (chapterId: string) => void;
  onGenerateNarration: (chapterId: string) => void;
  isGenerating: boolean;
  generationChapterId: string | null;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({
  project,
  apiKey,
  activeChapter,
  onUpdateChapterContent,
  onAddChapter,
  onDeleteChapter,
  onRenameChapter,
  onSelectChapter,
  onGenerateNarration,
  isGenerating,
  generationChapterId,
}) => {
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [aiActionLoading, setAiActionLoading] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const stats = estimateReadingTime(activeChapter.content);

  const handleStartRename = (chapter: Chapter, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitleId(chapter.id);
    setTempTitle(chapter.title);
  };

  const handleSaveRename = (chapterId: string) => {
    if (tempTitle.trim()) {
      onRenameChapter(chapterId, tempTitle.trim());
    }
    setEditingTitleId(null);
  };

  const insertNarrationTag = (tag: string) => {
    const textarea = document.getElementById('story-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = activeChapter.content;
    const updated = current.substring(0, start) + ` ${tag} ` + current.substring(end);

    onUpdateChapterContent(activeChapter.id, updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2);
    }, 50);
  };

  const handleAiPolish = async (action: 'polish' | 'add-pacing-cues' | 'continue-story') => {
    if (!activeChapter.content.trim()) return;
    setAiActionLoading(action);
    setAiError(null);

    try {
      const result = await polishStory(
        apiKey,
        activeChapter.content,
        project.emotion || 'warm-audiobook',
        action,
      );

      if (action === 'continue-story') {
        const newContent = activeChapter.content + '\n\n' + result;
        onUpdateChapterContent(activeChapter.id, newContent);
      } else {
        onUpdateChapterContent(activeChapter.id, result);
      }
    } catch (err: any) {
      console.error('AI Polish Error:', err);
      setAiError(err.message || 'AI assistant encountered an issue.');
    } finally {
      setAiActionLoading(null);
    }
  };

  const isCurrentGenerating = isGenerating && generationChapterId === activeChapter.id;

  return (
    <div id="story-editor-container" className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
      {/* Chapter Tabs & Management Bar */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-3 gap-2 overflow-x-auto">
        <div className="flex items-center space-x-1.5 min-w-max">
          {project.chapters.map((chap, idx) => {
            const isActive = chap.id === activeChapter.id;
            const isEditing = editingTitleId === chap.id;

            return (
              <div
                key={chap.id}
                id={`chapter-tab-${chap.id}`}
                onClick={() => onSelectChapter(chap.id)}
                className={`group flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-sm'
                    : 'bg-stone-850 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(chap.id);
                        if (e.key === 'Escape') setEditingTitleId(null);
                      }}
                      className="bg-stone-950 border border-amber-500/60 rounded px-1.5 py-0.5 text-xs text-amber-200 w-28 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRename(chap.id)}
                      className="text-emerald-400 hover:text-emerald-300 p-0.5"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setEditingTitleId(null)}
                      className="text-stone-400 hover:text-stone-200 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex items-center space-x-1">
                      {chap.status === 'ready' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Audio Generated" />
                      )}
                      {chap.status === 'generating' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" title="Generating Audio..." />
                      )}
                      <span>{chap.title || `Chapter ${idx + 1}`}</span>
                    </span>

                    <button
                      onClick={(e) => handleStartRename(chap, e)}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-amber-300 p-0.5 transition-opacity"
                      title="Rename Chapter"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>

                    {project.chapters.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChapter(chap.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-rose-400 p-0.5 transition-opacity"
                        title="Delete Chapter"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}

          <button
            id="btn-add-chapter"
            onClick={onAddChapter}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-stone-850 hover:bg-stone-800 border border-dashed border-stone-700 text-stone-400 hover:text-stone-200 text-xs transition-colors"
            title="Add a new chapter"
          >
            <Plus className="w-3 h-3" />
            <span>Add Chapter</span>
          </button>
        </div>

        {/* Word Count & Estimated Audiobook Duration */}
        <div className="flex items-center space-x-3 text-xs text-stone-400">
          <span className="flex items-center space-x-1 font-mono">
            <FileText className="w-3.5 h-3.5 text-stone-500" />
            <span>{stats.words} words</span>
          </span>
          <span className="flex items-center space-x-1 font-mono text-amber-400/90">
            <Clock className="w-3.5 h-3.5" />
            <span>~{stats.formatted} audio</span>
          </span>
        </div>
      </div>

      {/* Narration Tags Toolbar & AI Assistants */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/80">
        {/* Audiobook Narration Tags */}
        <div className="flex items-center space-x-1 overflow-x-auto text-[11px]">
          <span className="text-stone-500 mr-1 font-medium hidden sm:inline">Narration Cues:</span>
          <button
            onClick={() => insertNarrationTag('...')}
            className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-750 text-stone-300 border border-stone-750 font-serif-book"
            title="Insert gentle pause break"
          >
            ... (Pause)
          </button>
          <button
            onClick={() => insertNarrationTag('[whisper]')}
            className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-750 text-stone-300 border border-stone-750"
            title="Insert intimate whisper cue"
          >
            [whisper]
          </button>
          <button
            onClick={() => insertNarrationTag('[soft breath]')}
            className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-750 text-stone-300 border border-stone-750"
            title="Insert soft breath pause"
          >
            [soft breath]
          </button>
          <button
            onClick={() => insertNarrationTag('[warm smile]')}
            className="px-2 py-1 rounded bg-stone-850 hover:bg-stone-750 text-stone-300 border border-stone-750"
            title="Insert smiling vocal expression"
          >
            [warm smile]
          </button>
        </div>

        {/* AI Narration Polish / Director */}
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            id="btn-ai-polish"
            onClick={() => handleAiPolish('polish')}
            disabled={aiActionLoading !== null || !activeChapter.content.trim()}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 transition-colors disabled:opacity-50"
            title="Polish text rhythm and oral smoothness for audiobook narration"
          >
            {aiActionLoading === 'polish' ? (
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            ) : (
              <Wand2 className="w-3 h-3 text-amber-400" />
            )}
            <span>Audiobook Polish</span>
          </button>

          <button
            id="btn-ai-continue"
            onClick={() => handleAiPolish('continue-story')}
            disabled={aiActionLoading !== null || !activeChapter.content.trim()}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 transition-colors disabled:opacity-50"
            title="Have AI continue the narrative with 2-3 paragraphs"
          >
            {aiActionLoading === 'continue-story' ? (
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-400" />
            )}
            <span>Continue Story</span>
          </button>
        </div>
      </div>

      {aiError && (
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
          <span>{aiError}</span>
          <button onClick={() => setAiError(null)} className="text-rose-400 hover:text-rose-200">×</button>
        </div>
      )}

      {/* Main Manuscript Textarea */}
      <div className="relative">
        <textarea
          id="story-textarea"
          value={activeChapter.content}
          onChange={(e) => onUpdateChapterContent(activeChapter.id, e.target.value)}
          placeholder="Paste or write your story, audiobook chapter, memoir excerpt, or bedtime tale here..."
          rows={11}
          className="w-full bg-stone-950/90 border border-stone-800 rounded-xl p-4 text-stone-200 font-serif-book text-base sm:text-lg leading-relaxed focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all resize-y selection:bg-amber-500/30 placeholder-stone-600"
        />

        {activeChapter.status === 'error' && activeChapter.errorMessage && (
          <div className="mt-2 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Narration error:</span> {activeChapter.errorMessage}
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Button: Generate Narration Audio */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-stone-400 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Generates high-fidelity 24kHz audio via soft female voice model</span>
        </div>

        <button
          id="btn-generate-narration"
          onClick={() => onGenerateNarration(activeChapter.id)}
          disabled={isGenerating || !activeChapter.content.trim()}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg transition-all ${
            isCurrentGenerating
              ? 'bg-amber-700/60 text-amber-200 cursor-not-allowed border border-amber-500/40 animate-pulse'
              : !activeChapter.content.trim()
              ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-950/40 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isCurrentGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              <span>Synthesizing Warm Female Narration...</span>
            </>
          ) : (
            <>
              <Mic2 className="w-4 h-4 text-stone-950" />
              <span>Generate Narration for {activeChapter.title || 'Chapter'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
