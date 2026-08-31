import React from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Download, 
  Plus, 
  FolderHeart,
  Volume2
} from 'lucide-react';
import { StoryProject } from '../types';

interface HeaderProps {
  project: StoryProject;
  onOpenSampleModal: () => void;
  onOpenNewProjectModal: () => void;
  onOpenScriptGenModal: () => void;
  onOpenExportModal: () => void;
  isGenerating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onOpenSampleModal,
  onOpenNewProjectModal,
  onOpenScriptGenModal,
  onOpenExportModal,
  isGenerating,
}) => {
  const readyChaptersCount = project.chapters.filter((c) => c.status === 'ready' && c.audioBase64).length;

  return (
    <header id="studio-header" className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-600/30 border border-amber-500/30 flex items-center justify-center shadow-inner text-amber-400">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-display font-bold text-lg text-stone-100 tracking-wide">StoryVoice</h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Soft & Warm AI Narrator
              </span>
            </div>
            <p className="text-xs text-stone-400 font-serif-book italic hidden sm:block">
              Tailored female voice generator for audiobooks, memoirs & personal storytelling
            </p>
          </div>
        </div>

        {/* Current Project Info & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            id="btn-sample-stories"
            onClick={onOpenSampleModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-750 border border-stone-700 text-stone-300 text-xs font-medium transition-colors"
            title="Choose from inspiring audiobook & memoir samples"
          >
            <FolderHeart className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Sample Stories</span>
            <span className="md:hidden">Samples</span>
          </button>

          <button
            id="btn-ai-story-gen"
            onClick={onOpenScriptGenModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/40 text-amber-300 text-xs font-medium transition-colors"
            title="Generate a new story script with AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Story Writer</span>
            <span className="sm:hidden">Write</span>
          </button>

          <button
            id="btn-new-project"
            onClick={onOpenNewProjectModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-750 border border-stone-700 text-stone-300 text-xs font-medium transition-colors"
            title="Start a blank project"
          >
            <Plus className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">New Story</span>
          </button>

          {readyChaptersCount > 0 && (
            <button
              id="btn-export-audiobook"
              onClick={onOpenExportModal}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-semibold shadow-md shadow-amber-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audiobook ({readyChaptersCount})</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
