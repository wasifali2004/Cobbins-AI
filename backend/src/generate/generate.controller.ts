import { Body, Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";

import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UserThrottlerGuard } from "../common/user-throttler.guard";
import { MAX_REFERENCE_IMAGE_BYTES } from "../storage/image-validation";
import { GenerateRequestDto } from "./dto/generate-request.dto";
import { GenerateResult, GenerateService } from "./generate.service";

@Controller("generate")
@UseGuards(JwtAuthGuard, UserThrottlerGuard)
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor("referenceImage", { limits: { fileSize: MAX_REFERENCE_IMAGE_BYTES } }))
  async generate(
    @Body() body: GenerateRequestDto,
    @UploadedFile() referenceImage: Express.Multer.File | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<GenerateResult> {
    return this.generateService.generate(body.prompt, req.user.id, referenceImage);
  }
}
