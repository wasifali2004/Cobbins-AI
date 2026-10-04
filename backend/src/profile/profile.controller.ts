import { Body, Controller, Patch, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";

import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UserThrottlerGuard } from "../common/user-throttler.guard";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { MAX_AVATAR_BYTES, ProfileResult, ProfileService } from "./profile.service";

@Controller("profile")
@UseGuards(JwtAuthGuard, UserThrottlerGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Patch()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor("avatar", { limits: { fileSize: MAX_AVATAR_BYTES } }))
  async updateProfile(
    @Body() body: UpdateProfileDto,
    @UploadedFile() avatar: Express.Multer.File | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<ProfileResult> {
    return this.profileService.updateProfile(req.user.id, body.name, avatar);
  }
}
