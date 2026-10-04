import { Module } from "@nestjs/common";

import { GeminiModule } from "../gemini/gemini.module";
import { RetrieveController } from "./retrieve.controller";
import { RetrieveService } from "./retrieve.service";

@Module({
  imports: [GeminiModule],
  controllers: [RetrieveController],
  providers: [RetrieveService],
  exports: [RetrieveService],
})
export class RetrieveModule {}
