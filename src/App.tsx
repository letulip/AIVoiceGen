import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VoiceSelector } from './components/VoiceSelector';
import { StoryEditor } from './components/StoryEditor';
import { AudioPlayerStudio } from './components/AudioPlayerStudio';
import { AmbienceMixer } from './components/AmbienceMixer';
import { SampleStoriesModal } from './components/SampleStoriesModal';
import { StoryScriptWriterModal } from './components/StoryScriptWriterModal';
import { AudiobookExportModal } from './components/AudiobookExportModal';
import { StoryProject, Chapter, StorySample } from './types';
import { FEMALE_VOICE_PERSONAS } from './data/voices';
import { SAMPLE_STORIES } from './data/samples';
import { estimateReadingTime } from './utils/audio';

const STORAGE_KEY = 'storyvoice_project_v1';

const defaultChapter: Chapter = {
  id: 'chap-1',
  title: 'Chapter 1: The Hearth',
  content: SAMPLE_STORIES[0].content,
  wordCount: 148,
  estimatedMinutes: 1.1,
  status: 'idle',
};

const initialProject: StoryProject = {
  id: 'proj-1',
  title: 'The Starlit Library of Alderwood',
  author: 'Narrator',
  genre: 'Cozy Fantasy / Fairy Tale',
  synopsis: 'A quiet wanderer discovers an ancient library whose ceiling mirrors the constellation map of forgotten worlds.',
  selectedVoiceId: 'aria-fireside',
  customStylePrompt: FEMALE_VOICE_PERSONAS[0].stylePrompt,
  warmthLevel: 'soft-warm',
  emotion: 'warm and comforting',
  speed: 1.0,
  ambientSound: 'none',
  ambientVolume: 0.2,
  chapters: [defaultChapter],
  activeChapterId: 'chap-1',
  updatedAt: new Date().toISOString(),
};

export default function App() {
  const [project, setProject] = useState<StoryProject>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved project from localStorage:', e);
    }
    return initialProject;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationChapterId, setGenerationChapterId] = useState<string | null>(null);

  // Modals state
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isScriptGenModalOpen, setIsScriptGenModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.warn('Failed to save project:', e);
    }
  }, [project]);

  const activeChapter = project.chapters.find((c) => c.id === project.activeChapterId) || project.chapters[0];

  // Update voice configuration
  const handleSelectVoice = (voiceId: string) => {
    const voice = FEMALE_VOICE_PERSONAS.find((v) => v.id === voiceId);
    setProject((prev) => ({
      ...prev,
      selectedVoiceId: voiceId,
      customStylePrompt: voice ? voice.stylePrompt : prev.customStylePrompt,
      warmthLevel: voice ? voice.warmthLevel : prev.warmthLevel,
      emotion: voice ? voice.defaultEmotion : prev.emotion,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSelectWarmth = (warmthLevel: 'whisper' | 'soft-warm' | 'deep-warm' | 'expressive') => {
    setProject((prev) => ({ ...prev, warmthLevel, updatedAt: new Date().toISOString() }));
  };

  const handleSelectEmotion = (emotion: string) => {
    setProject((prev) => ({ ...prev, emotion, updatedAt: new Date().toISOString() }));
  };

  const handleCustomPrompt = (customStylePrompt: string) => {
    setProject((prev) => ({ ...prev, customStylePrompt, updatedAt: new Date().toISOString() }));
  };

  const handleSpeed = (speed: number) => {
    setProject((prev) => ({ ...prev, speed, updatedAt: new Date().toISOString() }));
  };

  const handleAmbientSound = (ambientSound: 'none' | 'fireside' | 'rain' | 'wind' | 'cozy-drone') => {
    setProject((prev) => ({ ...prev, ambientSound, updatedAt: new Date().toISOString() }));
  };

  const handleAmbientVolume = (ambientVolume: number) => {
    setProject((prev) => ({ ...prev, ambientVolume, updatedAt: new Date().toISOString() }));
  };

  // Chapter editing operations
  const handleUpdateChapterContent = (chapterId: string, content: string) => {
    const { words, minutes } = estimateReadingTime(content);
    setProject((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chap) =>
        chap.id === chapterId
          ? {
              ...chap,
              content,
              wordCount: words,
              estimatedMinutes: minutes,
            }
          : chap
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleAddChapter = () => {
    const newId = `chap-${Date.now()}`;
    const newChap: Chapter = {
      id: newId,
      title: `Chapter ${project.chapters.length + 1}`,
      content: '',
      wordCount: 0,
      estimatedMinutes: 0,
      status: 'idle',
    };
    setProject((prev) => ({
      ...prev,
      chapters: [...prev.chapters, newChap],
      activeChapterId: newId,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (project.chapters.length <= 1) return;
    const remaining = project.chapters.filter((c) => c.id !== chapterId);
    setProject((prev) => ({
      ...prev,
      chapters: remaining,
      activeChapterId: prev.activeChapterId === chapterId ? remaining[0].id : prev.activeChapterId,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleRenameChapter = (chapterId: string, newTitle: string) => {
    setProject((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chap) => (chap.id === chapterId ? { ...chap, title: newTitle } : chap)),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSelectChapter = (chapterId: string) => {
    setProject((prev) => ({ ...prev, activeChapterId: chapterId }));
  };

  // Load sample story
  const handleSelectSample = (sample: StorySample) => {
    const { words, minutes } = estimateReadingTime(sample.content);
    const newChap: Chapter = {
      id: `chap-${Date.now()}`,
      title: sample.title,
      content: sample.content,
      wordCount: words,
      estimatedMinutes: minutes,
      status: 'idle',
    };

    const recommendedVoice = FEMALE_VOICE_PERSONAS.find((v) => v.id === sample.recommendedVoiceId) || FEMALE_VOICE_PERSONAS[0];

    setProject({
      id: `proj-${Date.now()}`,
      title: sample.title,
      author: 'Narrator',
      genre: sample.genre,
      synopsis: sample.synopsis,
      selectedVoiceId: sample.recommendedVoiceId,
      customStylePrompt: recommendedVoice.stylePrompt,
      warmthLevel: sample.warmthLevel,
      emotion: sample.emotion,
      speed: 1.0,
      ambientSound: 'none',
      ambientVolume: 0.2,
      chapters: [newChap],
      activeChapterId: newChap.id,
      updatedAt: new Date().toISOString(),
    });
  };

  // Apply generated AI story script
  const handleApplyScript = (title: string, content: string) => {
    const { words, minutes } = estimateReadingTime(content);
    const newChap: Chapter = {
      id: `chap-${Date.now()}`,
      title,
      content,
      wordCount: words,
      estimatedMinutes: minutes,
      status: 'idle',
    };

    setProject((prev) => ({
      ...prev,
      chapters: [...prev.chapters, newChap],
      activeChapterId: newChap.id,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Start fresh blank story
  const handleNewProject = () => {
    const newChap: Chapter = {
      id: `chap-${Date.now()}`,
      title: 'Chapter 1: The Beginning',
      content: '',
      wordCount: 0,
      estimatedMinutes: 0,
      status: 'idle',
    };
    setProject({
      id: `proj-${Date.now()}`,
      title: 'Untitled Story',
      author: 'Narrator',
      genre: 'Personal Storytelling / Memoir',
      synopsis: '',
      selectedVoiceId: 'aria-fireside',
      customStylePrompt: FEMALE_VOICE_PERSONAS[0].stylePrompt,
      warmthLevel: 'soft-warm',
      emotion: 'warm and comforting',
      speed: 1.0,
      ambientSound: 'none',
      ambientVolume: 0.2,
      chapters: [newChap],
      activeChapterId: newChap.id,
      updatedAt: new Date().toISOString(),
    });
  };

  // Main Speech Generation Trigger
  const handleGenerateNarration = async (chapterId: string) => {
    const chapter = project.chapters.find((c) => c.id === chapterId);
    if (!chapter || !chapter.content.trim() || isGenerating) return;

    const selectedVoice = FEMALE_VOICE_PERSONAS.find((v) => v.id === project.selectedVoiceId) || FEMALE_VOICE_PERSONAS[0];

    setIsGenerating(true);
    setGenerationChapterId(chapterId);

    // Set chapter status to generating
    setProject((prev) => ({
      ...prev,
      chapters: prev.chapters.map((c) => (c.id === chapterId ? { ...c, status: 'generating', errorMessage: undefined } : c)),
    }));

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: chapter.content,
          voiceName: selectedVoice.voiceName,
          stylePrompt: project.customStylePrompt || selectedVoice.stylePrompt,
          warmthLevel: project.warmthLevel,
          speed: project.speed,
          emotion: project.emotion,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.audioBase64) {
        throw new Error(data.error || 'Voice generation failed. Please try again.');
      }

      setProject((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) =>
          c.id === chapterId
            ? {
                ...c,
                audioBase64: data.audioBase64,
                mimeType: data.mimeType || 'audio/wav',
                status: 'ready',
                generatedAt: new Date().toISOString(),
                voiceUsed: selectedVoice.name,
              }
            : c
        ),
        updatedAt: new Date().toISOString(),
      }));
    } catch (err: any) {
      console.error('Narration generation error:', err);
      setProject((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) =>
          c.id === chapterId
            ? {
                ...c,
                status: 'error',
                errorMessage: err.message || 'Speech generation encountered an error.',
              }
            : c
        ),
      }));
    } finally {
      setIsGenerating(false);
      setGenerationChapterId(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Studio Header */}
      <Header
        project={project}
        onOpenSampleModal={() => setIsSampleModalOpen(true)}
        onOpenNewProjectModal={handleNewProject}
        onOpenScriptGenModal={() => setIsScriptGenModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        isGenerating={isGenerating}
      />

      {/* Main Studio Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Two-Column Grid: Voice Selector & Story Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Voice Personas & Atmosphere Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <VoiceSelector
              project={project}
              onChangeVoice={handleSelectVoice}
              onChangeWarmth={handleSelectWarmth}
              onChangeEmotion={handleSelectEmotion}
              onChangeCustomPrompt={handleCustomPrompt}
              onChangeSpeed={handleSpeed}
            />

            <AmbienceMixer
              project={project}
              onChangeAmbientSound={handleAmbientSound}
              onChangeAmbientVolume={handleAmbientVolume}
            />
          </div>

          {/* Right Column: Story Editor & Audio Player (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <StoryEditor
              project={project}
              activeChapter={activeChapter}
              onUpdateChapterContent={handleUpdateChapterContent}
              onAddChapter={handleAddChapter}
              onDeleteChapter={handleDeleteChapter}
              onRenameChapter={handleRenameChapter}
              onSelectChapter={handleSelectChapter}
              onGenerateNarration={handleGenerateNarration}
              isGenerating={isGenerating}
              generationChapterId={generationChapterId}
            />

            <AudioPlayerStudio
              project={project}
              activeChapter={activeChapter}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <SampleStoriesModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={handleSelectSample}
      />

      <StoryScriptWriterModal
        isOpen={isScriptGenModalOpen}
        onClose={() => setIsScriptGenModalOpen(false)}
        onApplyScript={handleApplyScript}
      />

      <AudiobookExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
      />
    </div>
  );
}
