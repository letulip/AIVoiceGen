export interface VoicePersona {
  id: string;
  name: string;
  voiceName: string; // 'Kore' | 'Zephyr' | 'Aoede' | 'Puck' | 'Charon' | 'Fenrir'
  title: string;
  archetype: string;
  description: string;
  warmthLevel: 'whisper' | 'soft-warm' | 'deep-warm' | 'expressive';
  defaultEmotion: string;
  stylePrompt: string;
  samplePhrase: string;
  badge: string;
  toneTags: string[];
  accentColor: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  audioBase64?: string;
  mimeType?: string;
  duration?: number; // in seconds
  wordCount: number;
  estimatedMinutes: number;
  status: 'idle' | 'generating' | 'ready' | 'error';
  errorMessage?: string;
  generatedAt?: string;
  voiceUsed?: string;
}

export interface StoryProject {
  id: string;
  title: string;
  author: string;
  genre: string;
  synopsis: string;
  selectedVoiceId: string;
  customStylePrompt: string;
  warmthLevel: 'whisper' | 'soft-warm' | 'deep-warm' | 'expressive';
  emotion: string;
  speed: number;
  ambientSound: 'none' | 'fireside' | 'rain' | 'wind' | 'cozy-drone';
  ambientVolume: number;
  chapters: Chapter[];
  activeChapterId: string;
  updatedAt: string;
}

export interface AmbientTrack {
  id: string;
  name: string;
  type: 'none' | 'fireside' | 'rain' | 'wind' | 'cozy-drone';
  description: string;
  iconName: string;
}

export interface StorySample {
  id: string;
  title: string;
  genre: string;
  recommendedVoiceId: string;
  synopsis: string;
  content: string;
  warmthLevel: 'whisper' | 'soft-warm' | 'deep-warm' | 'expressive';
  emotion: string;
}
