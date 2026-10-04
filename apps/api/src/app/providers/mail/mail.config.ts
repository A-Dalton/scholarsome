import { Injectable } from "@nestjs/common";
import { MailerOptions, MailerOptionsFactory } from "@nestjs-modules/mailer";
import { SendMailOptions } from "nodemailer";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MailConfig implements MailerOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMailerOptions(): MailerOptions {
    return {
      transport: {
        host: this.configService.get<string>("SMTP_HOST"),
        port: this.configService.get<number>("SMTP_PORT"),
        auth: {
          user: this.configService.get<string>("SMTP_USERNAME"),
          pass: this.configService.get<string>("SMTP_PASSWORD")
        }
      },
      // At runtime `defaults` carries message-level options, but @nestjs-modules/mailer
      // types it as the nodemailer transport options union, so it needs the cast.
      defaults: {
        from: "Scholarsome <noreply@scholarsome.com>"
      } as SendMailOptions
    };
  }
}
