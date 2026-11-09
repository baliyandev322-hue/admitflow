import fs from 'fs';
import path from 'path';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiGenerateOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  systemInstruction?: string;
}

/**
 * Helper to safely extract and concatenate all text parts from Gemini API candidates.
 * Handles single part, multiple parts, empty parts, missing text fields, and empty responses.
 */
export function extractTextFromGeminiResponse(data: any): string {
  if (!data || typeof data !== 'object') {
    throw new Error('Empty response from Gemini API: invalid data object');
  }
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error('Empty response from Gemini API: no candidate returned');
  }
  const parts = candidate.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error('Empty response from Gemini API: no parts found');
  }

  // Combine all text parts without losing content
  const text = parts
    .map((p: any) => (p && typeof p.text === 'string' ? p.text : ''))
    .join('')
    .trim();

  if (!text) {
    throw new Error('Empty response from Gemini API: text parts are empty');
  }
  return text;
}

export class GeminiService {
  private static instance: GeminiService;
  private apiKey: string;
  private defaultModel: string;

  private constructor() {
    let key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    if (!key) {
      try {
        const rootKeyPath = path.join(process.cwd(), '..', 'api_key.txt');
        if (fs.existsSync(rootKeyPath)) {
          key = fs.readFileSync(rootKeyPath, 'utf-8').trim();
        } else {
          const localKeyPath = path.join(process.cwd(), 'api_key.txt');
          if (fs.existsSync(localKeyPath)) {
            key = fs.readFileSync(localKeyPath, 'utf-8').trim();
          }
        }
      } catch (e) {
        // Ignored
      }
    }
    this.apiKey = key;
    this.defaultModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }

  public async generateText(
    prompt: string, 
    options: GeminiGenerateOptions = {}
  ): Promise<{ text: string; modelUsed: string; fallbackUsed: boolean }> {
    if (!this.isAvailable()) {
      return {
        text: 'Live Gemini API key is not configured. Falling back to local grounded response.',
        modelUsed: 'local-fallback',
        fallbackUsed: true
      };
    }

    const model = options.model || this.defaultModel;
    const timeoutMs = options.timeoutMs || 8000;
    const temperature = options.temperature ?? 0.3; // Low temperature for high factual accuracy

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const contents: any[] = [];
    if (options.systemInstruction) {
      contents.push({
        role: 'user',
        parts: [{ text: `SYSTEM DIRECTIVE: ${options.systemInstruction}` }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will strictly obey these directives and knowledge boundaries.' }]
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens: options.maxOutputTokens || 600
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gemini API returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const generatedText = extractTextFromGeminiResponse(data);

      return {
        text: generatedText,
        modelUsed: model,
        fallbackUsed: false
      };
    } catch (e: any) {
      clearTimeout(timer);
      console.warn(`[Gemini API Warning] ${e.message}. Activating deterministic fallback.`);
      return {
        text: '',
        modelUsed: model,
        fallbackUsed: true
      };
    }
  }

  /**
   * Real-time streaming generator for LLM responses using Gemini Server-Sent Events (SSE).
   */
  public async *streamText(
    prompt: string,
    options: GeminiGenerateOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    if (!this.isAvailable()) {
      yield 'Live Gemini API key is not configured. Operating in deterministic offline mode.';
      return;
    }

    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? 0.3;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const contents: any[] = [];
    if (options.systemInstruction) {
      contents.push({
        role: 'user',
        parts: [{ text: `SYSTEM DIRECTIVE: ${options.systemInstruction}` }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will strictly obey these directives.' }]
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens: options.maxOutputTokens || 600
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Gemini Stream API returned HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('No readable stream body returned');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep last incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.substring(6).trim();
            if (jsonStr === '[DONE]') return;
            try {
              const data = JSON.parse(jsonStr);
              const parts = data.candidates?.[0]?.content?.parts;
              if (Array.isArray(parts)) {
                for (const part of parts) {
                  if (part && typeof part.text === 'string' && part.text) {
                    yield part.text;
                  }
                }
              }
            } catch {
              // Incomplete or non-JSON chunk
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Gemini Stream Warning] ${err.message}. Streaming fallback.`);
      yield 'Maaf kijiye, temporary connection error aaya hai. Kripya punah prayas karein.';
    }
  }
}

export const gemini = GeminiService.getInstance();
