import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

export const GENERATION_CREDIT_COST = 1;
export const SIGNUP_WELCOME_CREDITS = 1;

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string): Promise<number> {
    const credit = await this.prisma.credit.findUnique({ where: { userId } });
    return credit?.balance ?? 0;
  }

  async assertSufficientCredits(userId: string, amount = GENERATION_CREDIT_COST): Promise<void> {
    const balance = await this.getBalance(userId);
    if (balance < amount) {
      throw new HttpException(
        "You don't have enough credits for this. Purchase more to continue.",
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  // Race-safe: the conditional WHERE means concurrent requests can't both
  // succeed and push balance negative. The transaction log only gets written
  // when the balance update actually applied.
  async deductCredits(userId: string, amount: number, description: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.credit.updateMany({
        where: { userId, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (count === 0) {
        this.logger.warn(`Credit deduction skipped: user=${userId} had insufficient balance at charge time`);
        return;
      }
      await tx.creditTransaction.create({
        data: { userId, amount: -amount, description },
      });
    });
  }
}
