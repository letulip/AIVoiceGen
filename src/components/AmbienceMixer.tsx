import React, { useEffect } from 'react';
import { 
  Flame, 
  CloudRain, 
  Wind, 
  Disc, 
  Volume2, 
  VolumeX, 
  Headphones,
  Sliders
} from 'lucide-react';
import { StoryProject } from '../types';
import { ambientEngine } from '../utils/audio';

interface AmbienceMixerProps {
  project: StoryProject;
  onChangeAmbientSound: (sound: 'none' | 'fireside' | 'rain' | 'wind' | 'cozy-drone') => void;
  onChangeAmbientVolume: (volume: number) => void;
}

export const AmbienceMixer: React.FC<AmbienceMixerProps> = ({
  project,
  onChangeAmbientSound,
  onChangeAmbientVolume,
}) => {
  const options = [
    { id: 'none', label: 'Pure Studio (No Ambience)', icon: VolumeX },
    { id: 'fireside', label: 'Crackling Hearth', icon: Flame, tag: 'Cozy' },
    { id: 'rain', label: 'Rain on Window', icon: CloudRain, tag: 'Sleep' },
    { id: 'wind', label: 'Autumn Breeze', icon: Wind, tag: 'Ethereal' },
    { id: 'cozy-drone', label: 'Warm Vinyl Drone', icon: Disc, tag: 'Memoir' },
  ];

  // Sync ambient sound engine with project state
  useEffect(() => {
    ambientEngine.play(project.ambientSound, project.ambientVolume);
  }, [project.ambientSound, project.ambientVolume]);

  const handleSelectSound = (sound: 'none' | 'fireside' | 'rain' | 'wind' | 'cozy-drone') => {
    onChangeAmbientSound(sound);
  };

  const handleVolume = (vol: number) => {
    onChangeAmbientVolume(vol);
  };

  return (
    <div id="ambience-mixer-panel" className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-wider">Atmospheric Background Mixer</h3>
            <p className="text-xs text-stone-400">Layer gentle acoustic ambiance under the narration voice</p>
          </div>
        </div>

        {project.ambientSound !== 'none' && (
          <div className="flex items-center space-x-2">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={project.ambientVolume}
              onChange={(e) => handleVolume(parseFloat(e.target.value))}
              className="w-20 sm:w-28 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              title="Ambient sound volume"
            />
            <span className="text-[11px] font-mono text-stone-400 w-8">
              {Math.round((project.ambientVolume / 0.5) * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {options.map((opt) => {
          const isSelected = project.ambientSound === opt.id;
          const Icon = opt.icon;

          return (
            <button
              key={opt.id}
              id={`ambience-opt-${opt.id}`}
              onClick={() => handleSelectSound(opt.id as any)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/40'
                  : 'bg-stone-850 border-stone-800 hover:border-stone-700 text-stone-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-stone-400'}`} />
                {opt.tag && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-amber-300/80 font-mono">
                    {opt.tag}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium line-clamp-1">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
