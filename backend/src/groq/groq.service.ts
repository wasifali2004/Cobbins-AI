import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly apiKey: string | undefined;
  private readonly model: string;

  constructor(config: ConfigService) {
    // The .env key is literally named GROK_API_KEY (as typed), even though
    // the key itself (gsk_...) is a Groq key, not xAI's Grok.
    this.apiKey = config.get<string>("GROK_API_KEY") ?? config.get<string>("GROQ_API_KEY");
    this.model = config.get<string>("GROQ_TEXT_MODEL", "openai/gpt-oss-120b");
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  private async chat(prompt: string, jsonMode: boolean): Promise<string> {
    if (!this.apiKey) throw new Error("GROQ_API_KEY is not set");

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Groq request failed (${response.status}): ${body.slice(0, 300)}`);
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty response from Groq");
    return text;
  }

  async generateText(prompt: string): Promise<string> {
    this.logger.warn("Falling back to Groq for text generation (Gemini quota exhausted)");
    return this.chat(prompt, false);
  }

  async generateJson<T>(prompt: string): Promise<T> {
    this.logger.warn("Falling back to Groq for JSON generation (Gemini quota exhausted)");
    const text = await this.chat(
      `${prompt}\n\nRespond with ONLY a single valid JSON object matching the shape described above. No markdown, no code fences, no commentary.`,
      true,
    );
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error("Groq returned invalid JSON");
    }
  }
}
