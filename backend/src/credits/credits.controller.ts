import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UserThrottlerGuard } from "../common/user-throttler.guard";
import { CreditsService } from "./credits.service";

@Controller("credits")
@UseGuards(JwtAuthGuard, UserThrottlerGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async getCredits(@Req() req: AuthenticatedRequest): Promise<{ credits: number }> {
    const credits = await this.creditsService.getBalance(req.user.id);
    return { credits };
  }
}
