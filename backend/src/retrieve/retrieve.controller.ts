import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { UserThrottlerGuard } from "../common/user-throttler.guard";
import { RetrieveRequestDto } from "./dto/retrieve-request.dto";
import { RetrieveResult, RetrieveService } from "./retrieve.service";

@Controller("retrieve")
@UseGuards(UserThrottlerGuard)
export class RetrieveController {
  constructor(private readonly retrieveService: RetrieveService) {}

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async retrieve(@Body() body: RetrieveRequestDto): Promise<RetrieveResult> {
    return this.retrieveService.retrieve(body.category, body.styleQuery);
  }
}
