import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

interface MaybeAuthedRequest {
  user?: { id: string };
  ip: string;
}

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: MaybeAuthedRequest): Promise<string> {
    return req.user?.id ?? req.ip;
  }
}
