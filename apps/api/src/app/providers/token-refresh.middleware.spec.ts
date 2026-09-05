import * as jwt from "jsonwebtoken";
import { TokenRefreshMiddleware } from "./token-refresh.middleware";
import { createMock } from "@golevelup/ts-jest";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "../auth/auth.service";
import { RedisService } from "@songkeys/nestjs-redis";
import type Redis from "ioredis";
import { Request, Response } from "express";

jest.mock("jsonwebtoken", () => ({ verify: jest.fn() }));

describe("TokenRefreshMiddleware", () => {
  const jwtVerify = jwt.verify as unknown as jest.Mock;

  let middleware: TokenRefreshMiddleware;
  let sign: jest.Mock;
  let redisGet: jest.Mock;
  let authService: AuthService;

  const session = {
    id: "user-1",
    sessionId: "session-1",
    email: "john@smith.com",
    type: "refresh"
  };

  const setup = (cookies: Record<string, string>) => {
    const req = { cookies } as unknown as Request;
    const res = createMock<Response>();
    const next = jest.fn();
    return { req, res, next };
  };

  beforeEach(() => {
    jwtVerify.mockReset();

    sign = jest.fn();
    redisGet = jest.fn();

    authService = createMock<AuthService>();
    const configService = createMock<ConfigService>();
    const jwtService = { sign } as unknown as JwtService;
    const redisService = {
      getClient: jest.fn().mockReturnValue({ get: redisGet } as unknown as Redis)
    } as unknown as RedisService;

    middleware = new TokenRefreshMiddleware(configService, jwtService, authService, redisService);
  });

  it("renews the access token and preserves the session id when the access token is missing and the refresh token is valid", async () => {
    jwtVerify.mockReturnValue(session);
    redisGet.mockResolvedValue("refresh.jwt");
    sign.mockReturnValue("new-access-jwt");

    const { req, res, next } = setup({
      authenticated: "true",
      "refresh_token": "refresh.jwt"
    });
    await middleware.use(req, res, next);

    expect(sign).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "session-1", type: "access" }),
        expect.objectContaining({ expiresIn: "15m" })
    );
    expect(req.cookies["access_token"]).toBe("new-access-jwt");
    expect(res.cookie).toHaveBeenCalledWith("access_token", "new-access-jwt", expect.objectContaining({ httpOnly: true }));
    expect(authService.logout).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("renews the access token when the access token is expired", async () => {
    jwtVerify
        .mockImplementationOnce(() => {
          throw new Error("jwt expired");
        })
        .mockReturnValueOnce(session);
    redisGet.mockResolvedValue("refresh.jwt");
    sign.mockReturnValue("new-access-jwt");

    const { req, res, next } = setup({
      authenticated: "true",
      "access_token": "expired.jwt",
      "refresh_token": "refresh.jwt"
    });
    await middleware.use(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith("access_token", "new-access-jwt", expect.objectContaining({ httpOnly: true }));
    expect(authService.logout).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("logs the user out when the refresh token references a revoked session", async () => {
    jwtVerify.mockReturnValue(session);
    redisGet.mockResolvedValue(null);

    const { req, res, next } = setup({
      authenticated: "true",
      "refresh_token": "refresh.jwt"
    });
    await middleware.use(req, res, next);

    expect(authService.logout).toHaveBeenCalledWith(req, res);
    expect(sign).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("logs the user out when the refresh token cannot be verified", async () => {
    jwtVerify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const { req, res, next } = setup({
      authenticated: "true",
      "refresh_token": "garbage"
    });
    await middleware.use(req, res, next);

    expect(authService.logout).toHaveBeenCalled();
    expect(sign).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
