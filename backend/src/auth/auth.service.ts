import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { createHash, randomBytes } from "crypto";

import { SIGNUP_WELCOME_CREDITS } from "../credits/credits.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { OAuthLoginDto } from "./dto/oauth-login.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { SignupDto } from "./dto/signup.dto";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  // ─── Sign up ────────────────────────────────────────────────────────────────

  async signup(input: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException("An account with that email already exists.");
    }

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hash(input.password, 12),
        credits: {
          create: {
            balance: SIGNUP_WELCOME_CREDITS,
          },
        },
        transactions: {
          create: {
            amount: SIGNUP_WELCOME_CREDITS,
            description: "Welcome bonus — 1 free credit",
          },
        },
      },
    });

    return this.issueSession(user);
  }

  // ─── Log in ─────────────────────────────────────────────────────────────────

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("The email or password is incorrect.");
    }

    const valid = await compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("The email or password is incorrect.");
    }

    return this.issueSession(user);
  }

  // ─── Forgot / reset password ─────────────────────────────────────────────────
  // The response is identical whether or not the email belongs to an account,
  // so this endpoint can't be used to check who has a Cobbins account.

  async forgotPassword(input: ForgotPasswordDto): Promise<{ success: true }> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });

    if (user && user.passwordHash) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");

      await this.prisma.$transaction([
        this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
        this.prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
          },
        }),
      ]);

      const frontendUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:3100");
      const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
      await this.mail.sendPasswordResetEmail(user.email, resetUrl);
    }

    return { success: true };
  }

  async resetPassword(input: ResetPasswordDto): Promise<{ success: true }> {
    const tokenHash = createHash("sha256").update(input.token).digest("hex");
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException("This reset link is invalid or has expired.");
    }

    const passwordHash = await hash(input.password, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);

    return { success: true };
  }

  // ─── OAuth sign-in (Google / GitHub) ─────────────────────────────────────────
  // The identity is already verified by the OAuth provider before this runs;
  // find-or-create by email and issue the same kind of backend session as a
  // password login would get.

  async oauthLogin(input: OAuthLoginDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return this.issueSession(existing);
    }

    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        image: input.image,
        credits: { create: { balance: SIGNUP_WELCOME_CREDITS } },
        transactions: { create: { amount: SIGNUP_WELCOME_CREDITS, description: "Welcome bonus — 1 free credit" } },
      },
    });

    return this.issueSession(user);
  }

  // ─── Find by ID ─────────────────────────────────────────────────────────────

  async findPublicUser(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new UnauthorizedException("This session is no longer valid.");
    return this.toPublicUser(user);
  }

  // ─── Get profile with credits ────────────────────────────────────────────────

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        credits: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    if (!user) throw new NotFoundException("User not found.");
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      credits: user.credits?.balance ?? 0,
      transactions: user.transactions,
    };
  }

  // ─── Delete account ──────────────────────────────────────────────────────────

  async deleteAccount(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async issueSession(user: { id: string; email: string }) {
    const publicUser = await this.findPublicUser(user.id);
    return {
      accessToken: await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
      }),
      user: publicUser,
    };
  }

  private toPublicUser(user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  }): PublicUser {
    return { id: user.id, name: user.name, email: user.email, image: user.image };
  }
}
