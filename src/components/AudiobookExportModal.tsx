import React from 'react';
import { X, Download, FileText, CheckCircle2, Music, Sparkles } from 'lucide-react';
import { StoryProject } from '../types';
import { downloadAudioFile, formatDuration } from '../utils/audio';

interface AudiobookExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: StoryProject;
}

export const AudiobookExportModal: React.FC<AudiobookExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  if (!isOpen) return null;

  const readyChapters = project.chapters.filter((c) => c.status === 'ready' && c.audioBase64);
  const totalWords = project.chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);

  const handleDownloadChapter = (chapter: any) => {
    if (!chapter.audioBase64) return;
    const safeName = (chapter.title || 'Chapter').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadAudioFile(chapter.audioBase64, `${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${safeName}.wav`, chapter.mimeType || 'audio/wav');
  };

  const handleDownloadAllChapters = () => {
    readyChapters.forEach((chap, idx) => {
      setTimeout(() => {
        handleDownloadChapter(chap);
      }, idx * 400);
    });
  };

  const handleExportManuscriptText = () => {
    let textDoc = `# ${project.title}\nAuthor: ${project.author || 'Narrator'}\nVoice: ${project.selectedVoiceId}\nWarmth: ${project.warmthLevel}\n\n---\n\n`;
    project.chapters.forEach((chap, idx) => {
      textDoc += `## ${chap.title || `Chapter ${idx + 1}`}\n\n${chap.content}\n\n---\n\n`;
    });

    const blob = new Blob([textDoc], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Manuscript.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-100">Export Audiobook Production</h3>
              <p className="text-xs text-stone-400">{readyChapters.length} of {project.chapters.length} chapters narrated</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto pr-1">
          {/* Project Summary Banner */}
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 space-y-2">
            <h4 className="text-sm font-semibold text-amber-300 font-serif-book">{project.title}</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-400">
              <span>Voice: <strong className="text-stone-200">{project.selectedVoiceId}</strong></span>
              <span>Warmth: <strong className="text-stone-200">{project.warmthLevel}</strong></span>
              <span>Total Words: <strong className="text-stone-200">{totalWords}</strong></span>
            </div>
          </div>

          {/* Chapter List */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider block">
              Audiobook Chapter Tracks
            </label>
            {project.chapters.map((chap, idx) => {
              const hasAudio = Boolean(chap.audioBase64 && chap.status === 'ready');
              return (
                <div
                  key={chap.id}
                  className="p-3 rounded-xl bg-stone-850/60 border border-stone-800 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5">
                    {hasAudio ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-stone-600" />
                    )}
                    <div>
                      <span className="text-xs font-medium text-stone-200">{chap.title || `Chapter ${idx + 1}`}</span>
                      <span className="text-[10px] text-stone-500 font-mono block">
                        {chap.wordCount || 0} words {hasAudio ? '• 24kHz Studio WAV' : '• Pending narration'}
                      </span>
                    </div>
                  </div>

                  {hasAudio && (
                    <button
                      onClick={() => handleDownloadChapter(chap)}
                      className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs flex items-center space-x-1 border border-stone-750 transition-colors"
                      title="Download chapter WAV"
                    >
                      <Download className="w-3 h-3" />
                      <span>.WAV</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            onClick={handleExportManuscriptText}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 text-xs font-medium border border-stone-750"
          >
            <FileText className="w-3.5 h-3.5 text-stone-400" />
            <span>Export Manuscript (.MD)</span>
          </button>

          <div className="w-full sm:w-auto flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs"
            >
              Close
            </button>
            {readyChapters.length > 0 && (
              <button
                onClick={handleDownloadAllChapters}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All ({readyChapters.length}) Chapters</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
