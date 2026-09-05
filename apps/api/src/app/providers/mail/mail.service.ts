import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "@songkeys/nestjs-redis";
import * as crypto from "crypto";
import { sslEnabled } from "../../shared/cookies";

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService
  ) {}

  /**
   * Sends an email confirmation to verify an address
   *
   * @param email Email address to send the verification to
   *
   * @returns Whether the email successfully sent
   */
  async sendEmailConfirmation(email: string): Promise<boolean> {
    if (
      !this.configService.get<boolean>("SMTP_USERNAME") ||
      !this.configService.get<boolean>("SMTP_PASSWORD")
    ) return false;

    const token = this.jwtService.sign({ email }, { expiresIn: "10m" });

    await this.mailerService.sendMail({
      to: email,
      from: "noreply@scholarsome.com",
      subject: "Confirm your email address",
      text: `Hey there,\n\nWelcome to Scholarsome! We're glad to have you here. Before getting started, we need to confirm your email address.\n\nTo confirm your email, please click this link:\n\nThis link will expire in 10 minutes.\n\nhttp${this.configService.get<string>("SSL_KEY_PATH") ? "s" : ""}://${this.configService.get<string>("HOST")}/api/auth/verify/email/${token}`
    });

    return true;
  }

  /**
   * Sends a password reset email
   *
   * @param email Email address to send the reset to
   *
   * @returns Whether the email successfully sent
   */
  async sendPasswordReset(email: string) {
    if (
      !this.configService.get<boolean>("SMTP_USERNAME") ||
      !this.configService.get<boolean>("SMTP_PASSWORD")
    ) {
      return;
    }

    const token = this.jwtService.sign({ email, forPasswordReset: true }, { expiresIn: "10m" });

    // the signed jwt must never appear in a URL, where it would leak into server
    // logs and browser history: it is stored server-side and the email carries a
    // random, single-use token that the API exchanges for the jwt
    const opaqueToken = crypto.randomBytes(48).toString("base64url");
    await this.redisService.getClient("default").set(`password-reset:${opaqueToken}`, token, "EX", 600);

    await this.mailerService.sendMail({
      to: email,
      from: "noreply@scholarsome.com",
      subject: "Reset your password",
      text: `Hey there,\n\nIf you did not request a password change, you can ignore this email.\n\nYou're receiving this because you requested a password reset. Follow the link below to choose a new password.\n\nThis link will expire in 10 minutes.\n\nhttp${sslEnabled(this.configService.get<string>("SSL_KEY_BASE64"), this.configService.get<string>("SSL_CERT_BASE64")) ? "s" : ""}://${this.configService.get<string>("HOST")}/api/auth/reset/password/verify/${opaqueToken}`
    });
  }
}
