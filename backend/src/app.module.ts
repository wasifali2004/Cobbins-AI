import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";

import { AuthModule } from "./auth/auth.module";
import { CreditsModule } from "./credits/credits.module";
import { ExportModule } from "./export/export.module";
import { GeminiModule } from "./gemini/gemini.module";
import { GenerateModule } from "./generate/generate.module";
import { HealthController } from "./health/health.controller";
import { PlanModule } from "./plan/plan.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProfileModule } from "./profile/profile.module";
import { RetrieveModule } from "./retrieve/retrieve.module";
import { StorageModule } from "./storage/storage.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 30 }]),
    PrismaModule,
    AuthModule,
    CreditsModule,
    StorageModule,
    ProfileModule,
    GeminiModule,
    PlanModule,
    RetrieveModule,
    GenerateModule,
    ExportModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
