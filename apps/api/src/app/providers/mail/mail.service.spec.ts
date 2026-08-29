import { MailService } from "./mail.service";
import { createMock } from "@golevelup/ts-jest";
import { MailerService } from "@nestjs-modules/mailer";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

describe("MailService", () => {
  let mailService: MailService;
  let mailerService: MailerService;
  let sign: jest.Mock;
  let configGet: jest.Mock;

  beforeEach(() => {
    mailerService = createMock<MailerService>();
    sign = jest.fn();
    configGet = jest.fn();

    const jwtService = { sign } as unknown as JwtService;
    const configService = { get: configGet } as unknown as ConfigService;

    mailService = new MailService(mailerService, jwtService, configService);
  });

  it("signs the email confirmation token to expire after 10 minutes, like a password reset token", async () => {
    configGet.mockReturnValue("value");

    await mailService.sendEmailConfirmation("john@smith.com");

    expect(sign).toHaveBeenCalledWith({ email: "john@smith.com" }, { expiresIn: "10m" });
  });

  it("includes the expiry notice in the confirmation email", async () => {
    configGet.mockReturnValue("value");

    await mailService.sendEmailConfirmation("john@smith.com");

    expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining("This link will expire in 10 minutes.")
        })
    );
  });

  it("signs the password reset token to expire after 10 minutes", async () => {
    configGet.mockReturnValue("value");

    await mailService.sendPasswordReset("john@smith.com");

    expect(sign).toHaveBeenCalledWith({ email: "john@smith.com", forPasswordReset: true }, { expiresIn: "10m" });
  });
});
