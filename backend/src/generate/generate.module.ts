import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { CreditsModule } from "../credits/credits.module";
import { GeminiModule } from "../gemini/gemini.module";
import { PlanModule } from "../plan/plan.module";
import { RetrieveModule } from "../retrieve/retrieve.module";
import { StorageModule } from "../storage/storage.module";
import { GenerateController } from "./generate.controller";
import { GenerateService } from "./generate.service";

@Module({
  imports: [AuthModule, CreditsModule, GeminiModule, PlanModule, RetrieveModule, StorageModule],
  controllers: [GenerateController],
  providers: [GenerateService],
  exports: [GenerateService],
})
export class GenerateModule {}
