import { Module } from "@nestjs/common";

import { GeminiModule } from "../gemini/gemini.module";
import { PlanController } from "./plan.controller";
import { PlanService } from "./plan.service";

@Module({
  imports: [GeminiModule],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
