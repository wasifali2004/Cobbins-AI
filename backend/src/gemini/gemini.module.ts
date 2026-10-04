import { Module } from "@nestjs/common";

import { GroqModule } from "../groq/groq.module";
import { GeminiService } from "./gemini.service";

@Module({
  imports: [GroqModule],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GeminiModule {}
