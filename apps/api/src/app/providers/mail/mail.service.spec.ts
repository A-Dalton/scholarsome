import { MailService } from "./mail.service";
import { createMock } from "@golevelup/ts-jest";
import { MailerService } from "@nestjs-modules/mailer";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "@songkeys/nestjs-redis";

describe("MailService", () => {
  let mailService: MailService;
  let mailerService: MailerService;
  let sign: jest.Mock;
  let configGet: jest.Mock;
  let redisService: RedisService;

  beforeEach(() => {
    mailerService = createMock<MailerService>();
    sign = jest.fn();
    configGet = jest.fn();
    redisService = createMock<RedisService>();

    const jwtService = { sign } as unknown as JwtService;
    const configService = { get: configGet } as unknown as ConfigService;

    mailService = new MailService(mailerService, jwtService, configService, redisService);
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

  it("signs the password reset token to expire after 10 minutes and stores it server-side", async () => {
    configGet.mockReturnValue("value");
    sign.mockReturnValue("token");

    await mailService.sendPasswordReset("john@smith.com");

    expect(sign).toHaveBeenCalledWith({ email: "john@smith.com", forPasswordReset: true }, { expiresIn: "10m" });
    expect(redisService.getClient("default").set).toHaveBeenCalledWith(
        expect.stringMatching(/^password-reset:/),
        "token",
        "EX",
        600
    );
  });

  it("emails a link carrying the single-use token instead of the signed jwt", async () => {
    configGet.mockReturnValue("value");
    sign.mockReturnValue("token");

    await mailService.sendPasswordReset("john@smith.com");

    const [key] = (redisService.getClient("default").set as jest.Mock).mock.calls[0];
    const opaqueToken = (key as string).replace("password-reset:", "");

    expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(`/api/auth/reset/password/verify/${opaqueToken}`)
        })
    );
    expect(mailerService.sendMail).not.toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining("verify/token")
        })
    );
  });
});
