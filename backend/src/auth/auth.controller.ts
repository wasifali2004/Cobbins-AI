import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { AuthService } from "./auth.service";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { OAuthLoginDto } from "./dto/oauth-login.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { SignupDto } from "./dto/signup.dto";
import { InternalAuthGuard } from "./internal-auth.guard";
import { JwtAuthGuard, type AuthenticatedRequest } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  signup(@Body() input: SignupDto) {
    return this.authService.signup(input);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() input: LoginDto) {
    return this.authService.login(input);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  forgotPassword(@Body() input: ForgotPasswordDto) {
    return this.authService.forgotPassword(input);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  resetPassword(@Body() input: ResetPasswordDto) {
    return this.authService.resetPassword(input);
  }

  @Post("oauth-login")
  @HttpCode(HttpStatus.OK)
  @UseGuards(InternalAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  oauthLogin(@Body() input: OAuthLoginDto) {
    return this.authService.oauthLogin(input);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.findPublicUser(request.user.id);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  profile(@Req() request: AuthenticatedRequest) {
    return this.authService.getProfile(request.user.id);
  }

  @Delete("account")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  deleteAccount(@Req() request: AuthenticatedRequest) {
    return this.authService.deleteAccount(request.user.id);
  }
}
