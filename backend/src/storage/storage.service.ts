import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as WebSocket from "ws";

const BUCKET = "user-uploads";

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: SupabaseClient;
  private bucketReady = false;

  constructor(config: ConfigService) {
    const url = config.get<string>("SUPABASE_URL");
    const key = config.get<string>("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    this.client = createClient(url, key, {
      auth: { persistSession: false },
      // Node 20 has no native WebSocket; ws is the documented stand-in for realtime's constructor.
      realtime: { transport: WebSocket } as unknown as Parameters<typeof createClient>[2],
    });
  }

  private async ensureBucket(): Promise<void> {
    if (this.bucketReady) return;
    const { error } = await this.client.storage.getBucket(BUCKET);
    if (error) {
      const { error: createError } = await this.client.storage.createBucket(BUCKET, { public: true });
      if (createError && !createError.message.toLowerCase().includes("already exists")) {
        this.logger.error(`Failed to create storage bucket: ${createError.message}`);
        throw new InternalServerErrorException("File storage is temporarily unavailable.");
      }
    }
    this.bucketReady = true;
  }

  async uploadPublicImage(pathPrefix: string, filename: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.ensureBucket();
    const path = `${pathPrefix}/${filename}`;
    const { error } = await this.client.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: true });
    if (error) {
      this.logger.error(`Upload failed for ${path}: ${error.message}`);
      throw new InternalServerErrorException("Could not upload the file.");
    }
    return this.client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
}
