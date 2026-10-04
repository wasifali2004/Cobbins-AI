import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { MailModule } from "../mail/mail.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { InternalAuthGuard } from "./internal-auth.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";

const jwtModule = JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const secret = config.get<string>("JWT_SECRET");
    if (!secret) {
      // Fail fast rather than silently signing tokens with a predictable,
      // publicly-known fallback secret that would let anyone forge a valid
      // session for any user.
      throw new Error("JWT_SECRET is not set. Refusing to start without it.");
    }
    return {
      secret,
      signOptions: { expiresIn: "7d" },
    };
  },
});

@Module({
  imports: [jwtModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, InternalAuthGuard],
  exports: [JwtAuthGuard, jwtModule],
})
export class AuthModule {}
