import React from 'react';
import { X, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { SAMPLE_STORIES } from '../data/samples';
import { StorySample } from '../types';

interface SampleStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: StorySample) => void;
}

export const SampleStoriesModal: React.FC<SampleStoriesModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-100">Curated Storytelling Samples</h3>
              <p className="text-xs text-stone-400">Select a pre-written story tailored for soft, warm voice narration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-3 pr-1">
          {SAMPLE_STORIES.map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                onSelectSample(sample);
                onClose();
              }}
              className="p-4 rounded-xl bg-stone-850/70 border border-stone-800 hover:border-amber-500/50 hover:bg-stone-800/80 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {sample.genre}
                  </span>
                  <h4 className="text-sm font-semibold text-stone-100 mt-1.5 group-hover:text-amber-300 transition-colors">
                    {sample.title}
                  </h4>
                  <p className="text-xs text-stone-300/80 mt-1">{sample.synopsis}</p>
                </div>
                <div className="flex items-center space-x-1 text-xs text-amber-400 font-medium group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-3">
                  <span>Load</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
