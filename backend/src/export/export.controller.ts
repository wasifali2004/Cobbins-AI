import { Controller, Get, Param, ParseUUIDPipe, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";

import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ExportService } from "./export.service";

@Controller("export")
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get(":id")
  async export(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer } = await this.exportService.buildZip(id, req.user.id);

    // No Content-Disposition here: some browser extensions intercept/reset
    // responses carrying "attachment" (mistaking XHR/fetch downloads for a
    // navigation-triggered file save). The client already fetches this as a
    // blob and forces the save itself via an <a download> element, so the
    // header isn't needed and only risks getting the response hijacked.
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Length", buffer.length);
    res.end(buffer);
  }
}
