import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI, Schema } from "@google/genai";

import { GroqService } from "../groq/groq.service";

export const EMBEDDING_DIMENSIONS = 1536;

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 800;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Gemini's SDK surfaces quota/rate-limit failures as a 429 with this reason
// somewhere in the thrown error — either as a `.status`/`.code` property or
// just embedded in the message, depending on which layer raised it.
function isQuotaError(err: unknown): boolean {
  const status = (err as { status?: number; code?: number })?.status ?? (err as { code?: number })?.code;
  if (status === 429) return true;
  const message = err instanceof Error ? err.message : String(err);
  return /RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(message);
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly ai: GoogleGenAI;
  private readonly textModel: string;

  constructor(
    config: ConfigService,
    private readonly groq: GroqService,
  ) {
    const apiKey = config.get<string>("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    this.ai = new GoogleGenAI({ apiKey });
    this.textModel = config.get<string>("GEMINI_TEXT_MODEL", "gemini-2.5-flash");
  }

  private async withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    let attemptsMade = 0;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      attemptsMade++;
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        // Retrying a quota error with the same backoff loop just burns time
        // for no benefit — the quota won't reset in seconds. Bail out
        // immediately so the caller can fall back to Groq right away.
        if (isQuotaError(err)) {
          this.logger.warn(`${label} hit a Gemini quota/rate-limit error, not retrying`);
          break;
        }
        if (attempt === MAX_RETRIES) break;
        const backoff = BASE_BACKOFF_MS * 2 ** attempt;
        this.logger.warn(`${label} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${backoff}ms`);
        await sleep(backoff);
      }
    }
    this.logger.error(`${label} failed after ${attemptsMade} attempt(s)`, lastError as Error);
    if (isQuotaError(lastError)) {
      const quotaError = new Error("GEMINI_QUOTA_EXCEEDED");
      quotaError.cause = lastError;
      throw quotaError;
    }
    throw new InternalServerErrorException("The AI service is temporarily unavailable. Please try again.");
  }

  async embed(text: string, taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"): Promise<number[]> {
    // No Groq fallback — Groq doesn't offer an embeddings endpoint.
    try {
      return await this.withRetry("embedContent", async () => {
        const response = await this.ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: text,
          config: { outputDimensionality: EMBEDDING_DIMENSIONS, taskType },
        });
        const values = response.embeddings?.[0]?.values;
        if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
          throw new Error(`Unexpected embedding shape (${values?.length ?? "none"} values)`);
        }
        return values;
      });
    } catch (err) {
      if (this.isGeminiQuotaExceeded(err)) {
        throw new InternalServerErrorException("The AI service is temporarily unavailable. Please try again.");
      }
      throw err;
    }
  }

  async generateJson<T>(prompt: string, schema: Schema): Promise<T> {
    try {
      return await this.withRetry("generateContent(json)", async () => {
        const response = await this.ai.models.generateContent({
          model: this.textModel,
          contents: prompt,
          config: { responseMimeType: "application/json", responseSchema: schema },
        });
        const text = response.text;
        if (!text) throw new Error("Empty response from model");
        try {
          return JSON.parse(text) as T;
        } catch {
          throw new Error("Model returned invalid JSON");
        }
      });
    } catch (err) {
      if (this.isGeminiQuotaExceeded(err) && this.groq.isConfigured) {
        try {
          return await this.groq.generateJson<T>(prompt);
        } catch (groqErr) {
          this.logger.error("Groq fallback also failed", groqErr as Error);
          throw new InternalServerErrorException("The AI service is temporarily unavailable. Please try again.");
        }
      }
      // Quota-exceeded with no Groq fallback configured still needs to
      // surface as the same friendly message, not the internal sentinel
      // error withRetry() throws to signal this catch block.
      if (this.isGeminiQuotaExceeded(err)) {
        throw new InternalServerErrorException("The AI service is temporarily unavailable. Please try again.");
      }
      throw err;
    }
  }

  async generateText(prompt: string): Promise<string> {
    try {
      return await this.withRetry("generateContent(text)", async () => {
        const response = await this.ai.models.generateContent({
          model: this.textModel,
          contents: prompt,
        });
        const text = response.text;
        if (!text) throw new Error("Empty response from model");
        return text;
      });
    } catch (err) {
      if (this.isGeminiQuotaExceeded(err) && this.groq.isConfigured) {
        try {
          return await this.groq.generateText(prompt);
        } catch (groqErr) {
          this.logger.error("Groq fallback also failed", groqErr as Error);
          throw new InternalServerErrorException("The AI service is temporarily unavailable. Please try again.");
        }
      }
      // Quota-exceeded with no Groq fallback configured still needs to
      // surface as the same friendly message, not the internal sentinel
      // error withRetry() throws to signal this catch block.
      if (this.isGeminiQuotaExceeded(err)) {
        throw new InternalServerErrorException("The AI service is temporarily unavailable. Please try again.");
      }
      throw err;
    }
  }

  private isGeminiQuotaExceeded(err: unknown): boolean {
    return err instanceof Error && err.message === "GEMINI_QUOTA_EXCEEDED";
  }

  async describeImageStyle(imageBuffer: Buffer, mimeType: string): Promise<string> {
    // No Groq fallback here — Groq's text models don't take image input, and
    // asserting a specific vision-capable model on Groq without verifying
    // its current availability would just trade one failure for another.
    try {
      return await this.withRetry("generateContent(vision)", async () => {
        const response = await this.ai.models.generateContent({
          model: this.textModel,
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType, data: imageBuffer.toString("base64") } },
                {
                  text: "Describe this image's visual style for a landing page designer in 2-3 short sentences: its color palette, mood/tone, and layout style. Do not describe the literal subject matter, only the style someone should carry into a new design.",
                },
              ],
            },
          ],
        });
        const text = response.text;
        if (!text) throw new Error("Empty response from model");
        return text.trim();
      });
    } catch (err) {
      if (this.isGeminiQuotaExceeded(err)) {
        throw new InternalServerErrorException("The AI service is temporarily unavailable. Please try again.");
      }
      throw err;
    }
  }
}
