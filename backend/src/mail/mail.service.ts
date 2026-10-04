import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>("RESEND_API");
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = config.get<string>("MAIL_FROM", "Cobbins AI <onboarding@resend.dev>");

    if (!this.resend) {
      this.logger.warn("RESEND_API is not set — emails will be logged instead of sent.");
    }
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const subject = "Reset your Cobbins AI password";
    const html = `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #121315;">
        <h2 style="margin: 0 0 16px;">Reset your password</h2>
        <p style="margin: 0 0 20px; line-height: 1.6;">
          We got a request to reset the password for your Cobbins AI account. This link expires in 30 minutes.
        </p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; border-radius: 8px; background: #121315; color: #ffffff; text-decoration: none; font-weight: 600;">
          Reset password
        </a>
        <p style="margin: 24px 0 0; font-size: 13px; color: #6b6d72; line-height: 1.6;">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
      </div>
    `;

    if (!this.resend) {
      this.logger.log(`[dev] Password reset link for ${to}: ${resetUrl}`);
      return;
    }

    try {
      // The Resend SDK resolves normally even when the send is rejected —
      // the failure shows up as `result.error`, not a thrown exception. An
      // unverified sending domain (the default onboarding@resend.dev sender)
      // can only deliver to Resend's own testing address, so this is the
      // most likely error in local development.
      const result = await this.resend.emails.send({ from: this.from, to, subject, html });
      if (result.error) {
        this.logger.error(`Resend rejected the password reset email to ${to}: ${result.error.message}`);
        this.logger.warn(`[fallback] Password reset link for ${to}: ${resetUrl}`);
      }
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${to}`, err as Error);
      this.logger.warn(`[fallback] Password reset link for ${to}: ${resetUrl}`);
    }
  }
}
