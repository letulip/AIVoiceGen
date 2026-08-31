import React, { useState } from 'react';
import { X, Sparkles, Wand2, Loader2, BookOpen } from 'lucide-react';

interface StoryScriptWriterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScript: (title: string, content: string) => void;
}

export const StoryScriptWriterModal: React.FC<StoryScriptWriterModalProps> = ({
  isOpen,
  onClose,
  onApplyScript,
}) => {
  const [genre, setGenre] = useState('Cozy Memoir / Intimate Reflection');
  const [theme, setTheme] = useState('A warm memory of autumn tea, old books, and quiet companionship');
  const [protagonist, setProtagonist] = useState('A reflective narrator looking back on life');
  const [targetMood, setTargetMood] = useState('Soft, comforting, nostalgic, and warm');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/story/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre,
          theme,
          protagonist,
          targetMood,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.script) {
        throw new Error(data.error || 'Failed to generate script.');
      }

      setGeneratedScript(data.script);
    } catch (err: any) {
      console.error('Script writer error:', err);
      setError(err.message || 'Could not generate story.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedScript) return;
    onApplyScript(theme.slice(0, 32) || 'New Story Chapter', generatedScript);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-100">AI Story & Audiobook Writer</h3>
              <p className="text-xs text-stone-400">Compose an atmospheric story script crafted for oral narration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-3 overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1">Story Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full text-xs bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500/70"
            >
              <option value="Cozy Memoir / Intimate Reflection">Cozy Memoir / Intimate Reflection</option>
              <option value="Bedtime Tale / Calming Sleep Story">Bedtime Tale / Calming Sleep Story</option>
              <option value="Atmospheric Fantasy / Mythic Folklore">Atmospheric Fantasy / Mythic Folklore</option>
              <option value="Personal Letter / Remembrance">Personal Letter / Remembrance</option>
              <option value="Children's Whimsical Tale">Children's Whimsical Tale</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1">Theme / Scenario</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Finding an old handwritten recipe book in the attic..."
              className="w-full text-xs bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500/70"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-300 block mb-1">Protagonist / Voice Tone</label>
            <input
              type="text"
              value={protagonist}
              onChange={(e) => setProtagonist(e.target.value)}
              placeholder="e.g. A gentle grandmother, an observant traveler..."
              className="w-full text-xs bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-amber-500/70"
            />
          </div>

          {generatedScript && (
            <div className="pt-2">
              <label className="text-xs font-semibold text-amber-300 block mb-1">Generated Audiobook Script</label>
              <textarea
                value={generatedScript}
                onChange={(e) => setGeneratedScript(e.target.value)}
                rows={6}
                className="w-full text-xs font-serif-book bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-200 focus:outline-none focus:border-amber-500/70"
              />
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-stone-800 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-medium"
          >
            Cancel
          </button>

          {!generatedScript ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Composing Story...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Write Story Script</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleApply}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold shadow-md"
            >
              <span>Load into Studio Editor</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
