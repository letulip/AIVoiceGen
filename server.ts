import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy initializer for Google GenAI client
let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

/**
 * Creates a valid 44-byte WAV header for 16-bit mono PCM at specified sample rate.
 */
function pcmToWavBuffer(pcmBuffer: Buffer, sampleRate: number = 24000, numChannels: number = 1, bitsPerSample: number = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF chunk descriptor
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4); // ChunkSize
  header.write("WAVE", 8);

  // "fmt " sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22); // NumChannels
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(byteRate, 28); // ByteRate
  header.writeUInt16LE(blockAlign, 32); // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34); // BitsPerSample

  // "data" sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40); // Subchunk2Size

  return Buffer.concat([header, pcmBuffer]);
}

// Health Check API
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: "gemini-3.1-flash-tts-preview",
  });
});

/**
 * Endpoint to generate soft, warm female voice narration
 */
app.post("/api/tts/generate", async (req, res) => {
  try {
    const {
      text,
      voiceName = "Kore", // Kore, Zephyr, Aoede, Puck, etc.
      stylePrompt = "Speak with a soft, warm, gentle, and engaging female voice. Pace is relaxed, soothing, and expressive for audiobook storytelling.",
      warmthLevel = "high", // 'whisper', 'soft-warm', 'deep-warm', 'expressive'
      speed = 1.0,
      emotion = "cozy",
    } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Text content is required for voice generation." });
    }

    const ai = getGenAI();

    // Construct tailored instruction prompt for Gemini TTS
    let styleDirective = "";
    if (warmthLevel === "whisper") {
      styleDirective = "In an intimate, breathy, gentle whisper, perfect for a quiet bedtime story. Soft articulation.";
    } else if (warmthLevel === "deep-warm") {
      styleDirective = "In a rich, resonant, deeply comforting and warm female tone, conveying wisdom and closeness.";
    } else if (warmthLevel === "expressive") {
      styleDirective = "In a lively yet warm and melodious female narration voice, capturing vivid emotions and natural storytelling cadence.";
    } else {
      // default soft-warm
      styleDirective = "In a soft, warm, engaging, and heartfelt female voice, with natural breathing pauses and comforting cadence.";
    }

    if (emotion) {
      styleDirective += ` Emotional atmosphere: ${emotion}.`;
    }

    if (stylePrompt && stylePrompt.trim()) {
      styleDirective += ` ${stylePrompt.trim()}`;
    }

    // Build the prompt for gemini-3.1-flash-tts-preview
    const fullPrompt = `${styleDirective}\n\nRead the following storytelling text:\n"${text.trim()}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: fullPrompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName || "Kore",
            },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(
      (part: any) => part.inlineData && part.inlineData.data
    );

    if (!audioPart || !audioPart.inlineData?.data) {
      throw new Error("No audio data was returned by the voice generation model.");
    }

    const rawBase64 = audioPart.inlineData.data;
    const mimeType = audioPart.inlineData.mimeType || "audio/pcm;rate=24000";

    // If it's raw PCM, wrap it in a proper WAV container
    let finalBase64Audio = rawBase64;
    let finalMimeType = mimeType;

    if (mimeType.includes("pcm") || !mimeType.includes("wav")) {
      const pcmBuffer = Buffer.from(rawBase64, "base64");
      // Standard sample rate for gemini-3.1-flash-tts-preview is 24000Hz
      const sampleRateMatch = mimeType.match(/rate=(\d+)/);
      const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 24000;
      const wavBuffer = pcmToWavBuffer(pcmBuffer, sampleRate, 1, 16);
      finalBase64Audio = wavBuffer.toString("base64");
      finalMimeType = "audio/wav";
    }

    res.json({
      success: true,
      audioBase64: finalBase64Audio,
      mimeType: finalMimeType,
      voiceName,
      textLength: text.length,
      sampleRate: 24000,
    });
  } catch (error: any) {
    console.error("TTS Generation Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate speech audio.",
      details: error?.toString(),
    });
  }
});

/**
 * AI Storytelling Assistant: Polishes text for audiobook narration (adds cadence cues, phonetic smoothness, atmospheric pacing)
 */
app.post("/api/story/polish", async (req, res) => {
  try {
    const { text, tone = "warm-audiobook", action = "polish" } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required." });
    }

    const ai = getGenAI();

    let systemInstruction = "You are an expert audiobook director and literary editor specializing in soft, warm, engaging female narration.";
    let prompt = "";

    if (action === "polish") {
      prompt = `Polish this text specifically to make it sound exquisite when read aloud by a soft, warm female narrator. 
Improve oral rhythm, remove tongue-twisters or harsh consonant clusters, enhance imagery and poetic flow, and format paragraphs into natural breath phrases.

Tone requested: ${tone}.
Keep the original meaning and core story intact, but make it sound magical and smooth to listen to.

Original text:
${text}

Respond only with the polished narration text.`;
    } else if (action === "add-pacing-cues") {
      prompt = `Review this storytelling text and suggest natural pacing annotations or breath breaks (e.g. subtle ellipses '...' for reflective pauses, em-dashes '—' for suspense, and clean paragraph breaks for chapter flow) optimized for a warm female audiobook reader.

Text:
${text}

Return the formatted text with natural speech pacing.`;
    } else if (action === "continue-story") {
      prompt = `Continue the following story in the same atmospheric, immersive, and heartfelt style. Write 2-3 engaging storytelling paragraphs ready for audiobook narration:

Context:
${text}

Continue the tale naturally.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      result: response.text || "",
    });
  } catch (error: any) {
    console.error("Story Polish Error:", error);
    res.status(500).json({ error: error?.message || "Failed to polish story text." });
  }
});

/**
 * Story Idea / Script Generator for Audiobooks and Personal Projects
 */
app.post("/api/story/generate-script", async (req, res) => {
  try {
    const { genre, theme, protagonist, targetMood } = req.body;
    const ai = getGenAI();

    const prompt = `Write an evocative, immersive storytelling opening and chapter (approx 250-400 words) crafted specifically for an audiobook read in a soft, warm, intimate female voice.

Genre: ${genre || "Cozy Fiction / Memoir"}
Theme: ${theme || "A nostalgic memory of autumn in a quiet bookstore"}
Protagonist / Character: ${protagonist || "A reflective narrator"}
Mood: ${targetMood || "Soft, soothing, warm, comforting, engaging"}

Write with rich sensory details, soothing rhythm, and poetic depth that brings peace and wonder to the listener.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a master fiction author and audiobook scriptwriter.",
        temperature: 0.8,
      },
    });

    res.json({
      success: true,
      script: response.text || "",
    });
  } catch (error: any) {
    console.error("Script Gen Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate script." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StoryVoice Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
