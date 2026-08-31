import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Download, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Music, 
  BookOpen,
  Share2,
  Check,
  FastForward,
  Headphones
} from 'lucide-react';
import { Chapter, StoryProject } from '../types';
import { base64ToBlobUrl, downloadAudioFile, formatDuration } from '../utils/audio';

interface AudioPlayerStudioProps {
  project: StoryProject;
  activeChapter: Chapter;
}

export const AudioPlayerStudio: React.FC<AudioPlayerStudioProps> = ({
  project,
  activeChapter,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Update blob URL when activeChapter audio changes
  useEffect(() => {
    if (activeChapter.audioBase64) {
      const url = base64ToBlobUrl(activeChapter.audioBase64, activeChapter.mimeType || 'audio/wav');
      setAudioUrl(url);
      setCurrentTime(0);
      setIsPlaying(false);
    } else {
      setAudioUrl(null);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }
  }, [activeChapter.id, activeChapter.audioBase64, activeChapter.mimeType]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error('Audio play error:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume || 0.8;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const handleDownload = () => {
    if (!activeChapter.audioBase64) return;
    const safeTitle = (activeChapter.title || 'StoryVoice-Chapter').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadAudioFile(activeChapter.audioBase64, `${safeTitle}.wav`, activeChapter.mimeType || 'audio/wav');
  };

  // Dynamic canvas wave visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const numBars = 48;
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 2);
        let barHeight = 4;

        if (isPlaying) {
          // Dynamic wave pattern
          const sinVal = Math.sin(phase + i * 0.25) * 0.5 + 0.5;
          const cosVal = Math.cos(phase * 0.8 + i * 0.15) * 0.5 + 0.5;
          barHeight = Math.max(6, (sinVal * 0.6 + cosVal * 0.4) * (height - 10));
        } else {
          // Static soft wave preview
          const progress = duration > 0 ? currentTime / duration : 0;
          const isPassed = i / numBars <= progress;
          barHeight = isPassed ? 10 + Math.sin(i * 0.4) * 6 : 4;
        }

        const y = (height - barHeight) / 2;

        // Gradient coloring with warm amber & gold
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          gradient.addColorStop(0, '#f59e0b');
          gradient.addColorStop(0.5, '#d97706');
          gradient.addColorStop(1, '#78350f');
        } else {
          gradient.addColorStop(0, '#78716c');
          gradient.addColorStop(1, '#44403c');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.08 * playbackSpeed;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, duration, currentTime, playbackSpeed]);

  if (!activeChapter.audioBase64) {
    return (
      <div id="audio-player-empty" className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center py-10 space-y-3">
        <div className="w-12 h-12 rounded-full bg-stone-800/80 border border-stone-700/60 flex items-center justify-center text-stone-400">
          <Headphones className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-stone-200">No Narration Audio Generated Yet</h3>
          <p className="text-xs text-stone-400 max-w-sm mt-1">
            Click <strong className="text-amber-300">Generate Narration</strong> above to record this chapter in a soft, warm female voice.
          </p>
        </div>
      </div>
    );
  }

  const speedOptions = [0.8, 1.0, 1.1, 1.25, 1.5];

  return (
    <div id="audio-player-studio" className="bg-stone-900/95 border border-stone-800 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Hidden Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Header with Title & Download */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-100 flex items-center space-x-2">
              <span>{activeChapter.title || 'Narrated Chapter'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                24kHz Studio WAV
              </span>
            </h3>
            <p className="text-xs text-stone-400">
              Voice: <strong className="text-amber-300 font-medium">{project.selectedVoiceId.replace('-', ' ')}</strong> • Warmth: {project.warmthLevel}
            </p>
          </div>
        </div>

        <button
          id="btn-download-wav"
          onClick={handleDownload}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="Download full quality master WAV audio file"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download .WAV</span>
        </button>
      </div>

      {/* Dynamic Waveform Visualizer Canvas */}
      <div className="bg-stone-950/80 rounded-xl p-3 border border-stone-800/80 flex flex-col justify-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={60}
          className="w-full h-14 rounded cursor-pointer"
          onClick={togglePlay}
        />
      </div>

      {/* Scrubber Progress Bar & Timestamps */}
      <div className="space-y-1.5">
        <input
          type="range"
          id="audio-scrub-slider"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
        />
        <div className="flex items-center justify-between text-xs font-mono text-stone-400">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Main Playback Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Playback speed buttons */}
        <div className="flex items-center space-x-1">
          <span className="text-[11px] text-stone-500 mr-1 hidden sm:inline">Speed:</span>
          {speedOptions.map((spd) => (
            <button
              key={spd}
              onClick={() => handleSpeedChange(spd)}
              className={`text-xs px-2 py-1 rounded-md transition-all font-mono ${
                playbackSpeed === spd
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-850 hover:bg-stone-800 text-stone-400'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Center Transport: -5s, Play/Pause, +5s */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleSkip(-5)}
            className="p-2 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 transition-colors"
            title="Rewind 5 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="btn-play-pause"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-950/40 transition-all hover:scale-105 active:scale-95"
            title={isPlaying ? 'Pause' : 'Play Narration'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => handleSkip(5)}
            className="p-2 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 transition-colors"
            title="Forward 5 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Volume slider */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleMute}
            className="text-stone-400 hover:text-stone-200"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-16 sm:w-20 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>

      {/* Synchronized Read-Along Manuscript Card */}
      <div className="bg-stone-950/50 rounded-xl p-4 border border-stone-800/80 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Synchronized Story Script</span>
        </div>
        <div className="max-h-36 overflow-y-auto font-serif-book text-sm sm:text-base text-stone-300 leading-relaxed pr-2 space-y-2">
          {activeChapter.content.split('\n\n').map((paragraph, pIdx) => (
            <p key={pIdx} className="hover:text-amber-200 transition-colors">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
