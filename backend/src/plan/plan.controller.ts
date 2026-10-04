import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { UserThrottlerGuard } from "../common/user-throttler.guard";
import { PlanRequestDto } from "./dto/plan-request.dto";
import { PagePlan, PlanService } from "./plan.service";

@Controller("plan")
@UseGuards(UserThrottlerGuard)
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async plan(@Body() body: PlanRequestDto): Promise<PagePlan> {
    return this.planService.createPlan(body.prompt);
  }
}
