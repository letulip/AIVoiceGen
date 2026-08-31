import React, { useState } from 'react';
import { 
  Sparkles, 
  Play, 
  Square, 
  Volume2, 
  Sliders, 
  Heart, 
  Moon, 
  Sun, 
  Flame, 
  Feather,
  Info,
  CheckCircle2
} from 'lucide-react';
import { VoicePersona, StoryProject } from '../types';
import { FEMALE_VOICE_PERSONAS, EMOTION_PRESETS, WARMTH_LEVELS } from '../data/voices';
import { base64ToBlobUrl } from '../utils/audio';
import { generateNarration } from '../services/gemini';

interface VoiceSelectorProps {
  project: StoryProject;
  apiKey: string;
  onChangeVoice: (voiceId: string) => void;
  onChangeWarmth: (warmth: 'whisper' | 'soft-warm' | 'deep-warm' | 'expressive') => void;
  onChangeEmotion: (emotion: string) => void;
  onChangeCustomPrompt: (prompt: string) => void;
  onChangeSpeed: (speed: number) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  project,
  apiKey,
  onChangeVoice,
  onChangeWarmth,
  onChangeEmotion,
  onChangeCustomPrompt,
  onChangeSpeed,
}) => {
  const [isPreviewing, setIsPreviewing] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showAdvancedPrompt, setShowAdvancedPrompt] = useState(false);

  const selectedVoice = FEMALE_VOICE_PERSONAS.find((v) => v.id === project.selectedVoiceId) || FEMALE_VOICE_PERSONAS[0];

  const handleTestPreviewVoice = async (voice: VoicePersona, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewError(null);

    if (isPreviewing === voice.id && previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setIsPreviewing(null);
      return;
    }

    if (previewAudio) {
      previewAudio.pause();
    }

    setIsPreviewing(voice.id);

    try {
      const data = await generateNarration(apiKey, {
        text: voice.samplePhrase,
        voiceName: voice.voiceName,
        stylePrompt: voice.stylePrompt,
        warmthLevel: voice.warmthLevel,
        emotion: voice.defaultEmotion,
      });

      const audioUrl = base64ToBlobUrl(data.audioBase64, data.mimeType || 'audio/wav');
      const audio = new Audio(audioUrl);
      setPreviewAudio(audio);

      audio.onended = () => {
        setIsPreviewing(null);
      };

      audio.onerror = () => {
        setIsPreviewing(null);
        setPreviewError('Audio playback error');
      };

      await audio.play();
    } catch (err: any) {
      console.error('Preview error:', err);
      setIsPreviewing(null);
      setPreviewError(err.message || 'Voice test preview unavailable.');
    }
  };

  return (
    <div id="voice-selector-panel" className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Feather className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-100 uppercase tracking-wider">Female Voice Personas</h2>
            <p className="text-xs text-stone-400">Tuned for warm, engaging storytelling and audiobooks</p>
          </div>
        </div>

        <button
          onClick={() => setShowAdvancedPrompt(!showAdvancedPrompt)}
          className="text-xs text-amber-400/80 hover:text-amber-300 flex items-center space-x-1 underline-offset-2 hover:underline"
        >
          <Sliders className="w-3 h-3" />
          <span>{showAdvancedPrompt ? 'Hide Directives' : 'Voice Directives'}</span>
        </button>
      </div>

      {previewError && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center justify-between">
          <span>{previewError}</span>
          <button onClick={() => setPreviewError(null)} className="text-rose-400 hover:text-rose-200">×</button>
        </div>
      )}

      {/* Voice Persona Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FEMALE_VOICE_PERSONAS.map((voice) => {
          const isSelected = voice.id === project.selectedVoiceId;
          const isThisPreviewing = isPreviewing === voice.id;

          return (
            <div
              key={voice.id}
              id={`voice-card-${voice.id}`}
              onClick={() => onChangeVoice(voice.id)}
              className={`group relative rounded-xl p-4 border transition-all cursor-pointer text-left flex flex-col justify-between ${
                isSelected
                  ? `bg-stone-850 border-amber-500/60 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40`
                  : `bg-stone-900/60 border-stone-800/80 hover:border-stone-700 hover:bg-stone-850/60`
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isSelected ? 'bg-amber-500 text-stone-950 shadow-sm' : 'bg-stone-800 text-amber-400'
                    }`}>
                      {voice.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-stone-100 text-sm">{voice.name}</span>
                        <span className="text-[10px] text-stone-400 font-mono">({voice.voiceName})</span>
                      </div>
                      <span className="text-xs text-amber-300/90 font-serif-book italic block">
                        {voice.title}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )}
                </div>

                <p className="text-xs text-stone-300/90 leading-relaxed mb-3">
                  {voice.description}
                </p>

                {/* Tone Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {voice.toneTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800/90 text-stone-300 border border-stone-750"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Voice Preview Trigger */}
              <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between">
                <span className="text-[10px] text-amber-400/80 font-medium">{voice.badge}</span>
                <button
                  id={`btn-preview-voice-${voice.id}`}
                  onClick={(e) => handleTestPreviewVoice(voice, e)}
                  className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md transition-all ${
                    isThisPreviewing
                      ? 'bg-amber-500 text-stone-950 font-semibold'
                      : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700'
                  }`}
                  title="Play short 5-second voice audition"
                >
                  {isThisPreviewing ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>Playing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current text-amber-400" />
                      <span>Hear Audition</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warmth & Intimacy Level Controls */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Warmth & Intimacy Timbre</span>
          </span>
          <span className="text-[11px] text-amber-400 font-normal">
            Current: {WARMTH_LEVELS.find((w) => w.id === project.warmthLevel)?.label}
          </span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {WARMTH_LEVELS.map((lvl) => {
            const isSelected = project.warmthLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                id={`warmth-btn-${lvl.id}`}
                onClick={() => onChangeWarmth(lvl.id as any)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500/70 text-amber-200 ring-1 ring-amber-500/40'
                    : 'bg-stone-850/70 border-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-0.5">
                  {lvl.id === 'whisper' && <Moon className="w-3.5 h-3.5 text-indigo-300" />}
                  {lvl.id === 'soft-warm' && <Sun className="w-3.5 h-3.5 text-amber-300" />}
                  {lvl.id === 'deep-warm' && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                  {lvl.id === 'expressive' && <Sparkles className="w-3.5 h-3.5 text-pink-300" />}
                  <span className="text-xs font-medium">{lvl.label}</span>
                </div>
                <p className="text-[10px] text-stone-400 line-clamp-1">{lvl.subtext}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Emotion & Atmosphere Preset Chips */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-stone-300 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Storytelling Emotion & Mood</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {EMOTION_PRESETS.map((emo) => {
            const isSelected = project.emotion === emo.label.toLowerCase() || project.emotion === emo.id;
            return (
              <button
                key={emo.id}
                id={`emotion-btn-${emo.id}`}
                onClick={() => onChangeEmotion(emo.label.toLowerCase())}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 font-semibold border-amber-400 shadow-sm'
                    : 'bg-stone-850 border-stone-800 text-stone-300 hover:border-stone-700 hover:text-stone-100'
                }`}
                title={emo.description}
              >
                {emo.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Custom Voice Directives Drawer */}
      {showAdvancedPrompt && (
        <div className="pt-3 border-t border-stone-800 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-stone-300 flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Custom Voice Directives (System Guidance)</span>
            </label>
            <button
              onClick={() => onChangeCustomPrompt(selectedVoice.stylePrompt)}
              className="text-[11px] text-stone-400 hover:text-stone-200 underline"
            >
              Reset to Voice Default
            </button>
          </div>
          <textarea
            id="input-custom-voice-prompt"
            value={project.customStylePrompt || selectedVoice.stylePrompt}
            onChange={(e) => onChangeCustomPrompt(e.target.value)}
            rows={2}
            className="w-full text-xs bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/70"
            placeholder="e.g. Speak with gentle pauses after dialogues, warm bedside comfort tone..."
          />
        </div>
      )}
    </div>
  );
};
