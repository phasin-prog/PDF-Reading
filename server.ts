import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parser for base64 image OCR payloads (increase limit for image uploads)
  app.use(express.json({ limit: '25mb' }));

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ttsModel: 'gemini-2.5-flash-preview-tts',
      ocrModel: 'gemini-2.5-flash',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Professional AI Vision OCR Endpoint
  app.post('/api/ocr', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/png' } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Missing imageBase64 field' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on server',
          useFallback: true,
        });
      }

      // Clean base64 string if data URL prefix exists
      const cleanedBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanedBase64,
                },
              },
              {
                text: `You are an expert OCR system for English academic literature, philosophy, and scanned books. Extract all English text from this scanned page image with 100% accuracy.

Guidelines:
1. Preserve original paragraph structure and sentence punctuation.
2. Keep paragraph numbers or bracket markers like [1], [2], [145], or [§12] if present in the margin/text.
3. Ignore noise, scan blur, or dark margins. Strip running headers and standalone page numbers at page bottom.
4. Output ONLY the clean extracted text. Do not wrap in markdown code block ticks or add chatter.`,
              },
            ],
          },
        ],
      });

      let extractedText = response.text || '';
      // Clean accidental markdown wrapper backticks
      extractedText = extractedText.replace(/^```(?:\w+)?\n?/, '').replace(/\n?```$/, '').trim();

      return res.json({
        success: true,
        text: extractedText,
        engine: 'Gemini 3.8 Flash AI Vision',
      });
    } catch (error: any) {
      console.error('Server OCR error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to process OCR on server',
        useFallback: true,
      });
    }
  });

  // Helper to convert 16-bit 24kHz Mono PCM to standard WAV buffer
  function pcmToWavBuffer(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);

    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM format
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
  }

  // In-memory Server-Side LRU cache for ultra-low latency TTS responses (<5ms)
  const ttsServerCache = new Map<string, { audioBase64: string; mimeType: string; timestamp: number }>();
  const MAX_SERVER_CACHE_ENTRIES = 500;

  // Built-in Google Gemini Voice Pack HD Speech Generation Endpoint
  app.post('/api/tts/generate', async (req, res) => {
    try {
      const { text, voiceName = 'Puck', speed, rate } = req.body;
      // Client sends `rate`, older payloads send `speed` — accept both
      const targetSpeed = Number(speed ?? rate ?? 1.0) || 1.0;

      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Text is required for TTS generation' });
      }
      if (text.trim().length > 4000) {
        return res.status(413).json({ error: 'Text too long (max 4000 chars per request)', useFallback: true });
      }

      // Valid prebuilt voice names in Gemini TTS: Puck, Charon, Fenrir, Zephyr, Kore, Aoede
      const validVoices = ['Puck', 'Charon', 'Fenrir', 'Zephyr', 'Kore', 'Aoede'];
      const targetVoice = validVoices.includes(voiceName) ? voiceName : 'Puck';
      const cleanText = text.trim();
      const cacheKey = `${targetVoice}:s${targetSpeed}:${cleanText}`;

      // Check server-side memory cache first
      if (ttsServerCache.has(cacheKey)) {
        const cached = ttsServerCache.get(cacheKey)!;
        return res.json({
          success: true,
          audioBase64: cached.audioBase64,
          mimeType: cached.mimeType,
          voiceName: targetVoice,
          cached: true,
          engine: 'Google Gemini 2.5 Flash TTS (Server Cache)',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on server',
          useFallback: true,
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [
          {
            parts: [
              {
                text: cleanText,
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: targetVoice,
              },
            },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);

      if (!audioPart || !audioPart.inlineData?.data) {
        throw new Error('No audio content returned from Gemini TTS engine');
      }

      const rawBase64 = audioPart.inlineData.data;
      const returnedMimeType = audioPart.inlineData.mimeType || 'audio/wav';

      let finalAudioBase64 = rawBase64;
      let finalMimeType = 'audio/wav';

      // Gemini returns raw PCM as audio/L16;rate=24000. Wrap only header-less PCM.
      // Pass through already-decodable containers (wav/mp3/mpeg/ogg) untouched.
      const lowerMime = returnedMimeType.toLowerCase();
      const isRawPcm =
        lowerMime.includes('pcm') || lowerMime.includes('raw') || lowerMime.includes('audio/l16');
      const isDecodable =
        lowerMime.includes('audio/wav') || lowerMime.includes('audio/x-wav') ||
        lowerMime.includes('audio/mp3') || lowerMime.includes('audio/mpeg') ||
        lowerMime.includes('audio/ogg');
      if (isRawPcm && !isDecodable) {
        const pcmBuffer = Buffer.from(rawBase64, 'base64');
        const wavBuffer = pcmToWavBuffer(pcmBuffer, 24000, 1, 16);
        finalAudioBase64 = wavBuffer.toString('base64');
        finalMimeType = 'audio/wav';
      } else {
        finalMimeType = returnedMimeType;
      }

      // Store in LRU server cache
      if (ttsServerCache.size >= MAX_SERVER_CACHE_ENTRIES) {
        const oldestKey = ttsServerCache.keys().next().value;
        if (oldestKey) ttsServerCache.delete(oldestKey);
      }
      ttsServerCache.set(cacheKey, {
        audioBase64: finalAudioBase64,
        mimeType: finalMimeType,
        timestamp: Date.now(),
      });

      return res.json({
        success: true,
        audioBase64: finalAudioBase64,
        mimeType: finalMimeType,
        voiceName: targetVoice,
        cached: false,
        engine: 'Google Gemini 2.5 Flash TTS',
      });
    } catch (error: any) {
      console.error('Server TTS Generation error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to generate speech on server',
        useFallback: true,
      });
    }
  });

  // Batch TTS Generation endpoint for fast chapter pre-caching
  app.post('/api/tts/batch', async (req, res) => {
    try {
      const { items, voiceName = 'Puck' } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'items array is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const validVoices = ['Puck', 'Charon', 'Fenrir', 'Zephyr', 'Kore', 'Aoede'];
      const targetVoice = validVoices.includes(voiceName) ? voiceName : 'Puck';

      // Process max 8 items per request
      const batchSlice = items.slice(0, 8);
      const results = await Promise.allSettled(
        batchSlice.map(async (text: string) => {
          const cleanText = text.trim();
          const cacheKey = `${targetVoice}:${cleanText}`;

          if (ttsServerCache.has(cacheKey)) {
            const cached = ttsServerCache.get(cacheKey)!;
            return {
              text: cleanText,
              audioBase64: cached.audioBase64,
              mimeType: cached.mimeType,
              cached: true,
            };
          }

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: cleanText }] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: targetVoice,
                  },
                },
              },
            },
          });

          const audioPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
          if (!audioPart || !audioPart.inlineData?.data) {
            throw new Error('No audio in response');
          }

          const rawBase64 = audioPart.inlineData.data;
          const returnedMime = audioPart.inlineData.mimeType || 'audio/wav';
          let finalBase64 = rawBase64;
          let finalMime = 'audio/wav';

          const lowerBatchMime = (returnedMime || '').toLowerCase();
          const isBatchPcm =
            lowerBatchMime.includes('pcm') || lowerBatchMime.includes('raw') || lowerBatchMime.includes('audio/l16');
          const isBatchDecodable =
            lowerBatchMime.includes('audio/wav') || lowerBatchMime.includes('audio/x-wav') ||
            lowerBatchMime.includes('audio/mp3') || lowerBatchMime.includes('audio/mpeg') ||
            lowerBatchMime.includes('audio/ogg');
          if (isBatchPcm && !isBatchDecodable) {
            const pcmBuffer = Buffer.from(rawBase64, 'base64');
            const wavBuffer = pcmToWavBuffer(pcmBuffer, 24000, 1, 16);
            finalBase64 = wavBuffer.toString('base64');
          } else {
            finalMime = returnedMime;
          }

          ttsServerCache.set(cacheKey, {
            audioBase64: finalBase64,
            mimeType: finalMime,
            timestamp: Date.now(),
          });

          return {
            text: cleanText,
            audioBase64: finalBase64,
            mimeType: finalMime,
            cached: false,
          };
        })
      );

      const payload = results.map((r, i) =>
        r.status === 'fulfilled'
          ? { ...r.value, success: true }
          : { text: batchSlice[i], success: false, error: r.reason?.message }
      );

      return res.json({ success: true, voiceName: targetVoice, results: payload });
    } catch (error: any) {
      console.error('Batch TTS error:', error);
      return res.status(500).json({ error: error.message || 'Failed to process batch TTS' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Professional Reader Server with AI OCR running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
