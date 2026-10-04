import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

// Guards server-to-server routes (called only from the Next.js backend, never
// the browser) with a shared secret, since these routes log a user in by
// email alone with no password check.
@Injectable()
export class InternalAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers["x-internal-secret"];
    const expected = this.config.get<string>("OAUTH_BRIDGE_SECRET");

    if (!expected || provided !== expected) {
      throw new UnauthorizedException("Not authorized.");
    }
    return true;
  }
}

