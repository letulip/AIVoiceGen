import React, { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, KeyRound, ShieldCheck, Trash2, X } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  apiKey: string;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, apiKey, onClose, onSave }) => {
  const [draftKey, setDraftKey] = useState(apiKey);

  useEffect(() => {
    if (isOpen) setDraftKey(apiKey);
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(draftKey.trim());
    onClose();
  };

  const handleClear = () => {
    setDraftKey('');
    onSave('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg space-y-5 rounded-2xl border border-stone-800 bg-stone-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-amber-400">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-100">Connect Gemini</h2>
              <p className="mt-1 text-xs leading-relaxed text-stone-400">
                GitHub Pages has no private server, so StoryVoice sends requests directly from this browser.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-200" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          <label htmlFor="gemini-api-key" className="text-xs font-semibold text-stone-300">
            Gemini API key
          </label>
          <input
            id="gemini-api-key"
            type="password"
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSave();
            }}
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste your API key"
            className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2.5 font-mono text-sm text-stone-200 outline-none focus:border-amber-500/70"
          />
        </div>

        <div className="space-y-2 rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-3 text-xs text-stone-300">
          <div className="flex items-center gap-2 text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-semibold">Stored only for this browser tab</span>
          </div>
          <p className="leading-relaxed text-stone-400">
            The key is kept in session storage, is never committed to GitHub, and is cleared when the tab session ends. Use a restricted key and monitor its quota.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300"
          >
            Get a key in Google AI Studio
            <ExternalLink className="h-3 w-3" />
          </a>

          <div className="flex items-center gap-2">
            {apiKey && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-2 text-xs text-stone-300 hover:bg-stone-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!draftKey.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-stone-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Save for this tab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
