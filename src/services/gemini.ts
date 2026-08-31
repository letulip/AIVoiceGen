import type { GoogleGenAI as GoogleGenAIClient } from '@google/genai';

const TEXT_MODEL = 'gemini-3.7-flash';
const TTS_MODEL = 'gemini-3.1-flash-tts-preview';

export interface NarrationRequest {
  text: string;
  voiceName: string;
  stylePrompt?: string;
  warmthLevel?: 'whisper' | 'soft-warm' | 'deep-warm' | 'expressive';
  emotion?: string;
}

export interface NarrationResult {
  audioBase64: string;
  mimeType: string;
  sampleRate: number;
}

export interface StoryScriptRequest {
  genre: string;
  theme: string;
  protagonist: string;
  targetMood: string;
}

async function createClient(apiKey: string): Promise<GoogleGenAIClient> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error('Add your Gemini API key from the key button in the header first.');
  }

  const { GoogleGenAI } = await import('@google/genai');
  return new GoogleGenAI({ apiKey: trimmedKey });
}

function decodeBase64(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, Math.min(index + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }

  return window.btoa(binary);
}

function pcmToWavBase64(pcmBase64: string, sampleRate = 24000): string {
  const pcm = decodeBase64(pcmBase64);
  const wav = new Uint8Array(44 + pcm.length);
  const view = new DataView(wav.buffer);

  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeText(0, 'RIFF');
  view.setUint32(4, 36 + pcm.length, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, pcm.length, true);
  wav.set(pcm, 44);

  return encodeBase64(wav);
}

function getStyleDirective(request: NarrationRequest): string {
  const warmthDirectives = {
    whisper: 'Use an intimate, breathy, gentle whisper with soft articulation for a quiet bedtime story.',
    'deep-warm': 'Use a rich, resonant, deeply comforting female tone that conveys wisdom and closeness.',
    expressive: 'Use lively, warm, melodious narration with vivid emotion and a natural storytelling cadence.',
    'soft-warm': 'Use a soft, warm, heartfelt female voice with natural breathing pauses and a comforting cadence.',
  };

  const parts = [
    warmthDirectives[request.warmthLevel || 'soft-warm'],
    request.emotion ? `Emotional atmosphere: ${request.emotion}.` : '',
    request.stylePrompt?.trim() || '',
  ];

  return parts.filter(Boolean).join(' ');
}

export async function generateNarration(
  apiKey: string,
  request: NarrationRequest,
): Promise<NarrationResult> {
  const ai = await createClient(apiKey);
  const prompt = `${getStyleDirective(request)}\n\nRead the following storytelling text:\n"${request.text.trim()}"`;
  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: request.voiceName || 'Kore' },
        },
      },
    },
  });

  const audioPart = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data,
  );
  const rawBase64 = audioPart?.inlineData?.data;
  if (!rawBase64) {
    throw new Error('Gemini did not return narration audio. Try a shorter chapter or another voice.');
  }

  const sourceMimeType = audioPart.inlineData?.mimeType || 'audio/pcm;rate=24000';
  const sampleRateMatch = sourceMimeType.match(/rate=(\d+)/);
  const sampleRate = sampleRateMatch ? Number.parseInt(sampleRateMatch[1], 10) : 24000;
  const isWav = sourceMimeType.includes('wav');

  return {
    audioBase64: isWav ? rawBase64 : pcmToWavBase64(rawBase64, sampleRate),
    mimeType: 'audio/wav',
    sampleRate,
  };
}

export async function polishStory(
  apiKey: string,
  text: string,
  tone: string,
  action: 'polish' | 'add-pacing-cues' | 'continue-story',
): Promise<string> {
  const ai = await createClient(apiKey);
  const prompts = {
    polish: `Polish this text specifically for a soft, warm audiobook narrator. Improve oral rhythm, remove tongue-twisters, enhance imagery and flow, and make paragraph breaks feel like natural breaths. Preserve the original meaning. Tone: ${tone}.\n\nOriginal text:\n${text}\n\nRespond only with the polished narration text.`,
    'add-pacing-cues': `Add natural speech pacing to this storytelling text using subtle ellipses, em dashes, and paragraph breaks where useful. Preserve the words and meaning.\n\nText:\n${text}\n\nReturn only the formatted text.`,
    'continue-story': `Continue this story in the same atmospheric, immersive, heartfelt style. Write two or three engaging paragraphs ready for audiobook narration.\n\nContext:\n${text}\n\nReturn only the continuation.`,
  };
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompts[action],
    config: {
      systemInstruction: 'You are an expert audiobook director and literary editor specializing in warm, engaging narration.',
      temperature: 0.7,
    },
  });

  const result = response.text?.trim();
  if (!result) throw new Error('Gemini did not return revised story text.');
  return result;
}

export async function generateStoryScript(
  apiKey: string,
  request: StoryScriptRequest,
): Promise<string> {
  const ai = await createClient(apiKey);
  const prompt = `Write an evocative, immersive storytelling opening and chapter of about 250–400 words, crafted for a soft, warm, intimate audiobook voice.

Genre: ${request.genre || 'Cozy Fiction / Memoir'}
Theme: ${request.theme || 'A nostalgic memory of autumn in a quiet bookstore'}
Protagonist / Character: ${request.protagonist || 'A reflective narrator'}
Mood: ${request.targetMood || 'Soft, soothing, warm, comforting, engaging'}

Use rich sensory details, a soothing rhythm, and poetic depth. Return only the script.`;
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      systemInstruction: 'You are a master fiction author and audiobook scriptwriter.',
      temperature: 0.8,
    },
  });

  const result = response.text?.trim();
  if (!result) throw new Error('Gemini did not return a story script.');
  return result;
}
