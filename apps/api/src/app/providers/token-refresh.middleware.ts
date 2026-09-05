import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "../auth/auth.service";
import { RedisService } from "@songkeys/nestjs-redis";
import * as jwt from "jsonwebtoken";
import { cookieOptions, sslEnabled } from "../shared/cookies";

@Injectable()
export class TokenRefreshMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly redisService: RedisService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (
      req.cookies &&
      "authenticated" in req.cookies &&
      !("access_token" in req.cookies) &&
      !("refresh_token" in req.cookies)
    ) {
      this.authService.logout(req, res);
      return next();
    }

    if (
      req.cookies &&
      "authenticated" in req.cookies
    ) {
      // if you have an access token but no refresh token, we know you need a new one
      if (
        !("access_token" in req.cookies) &&
        "refresh_token" in req.cookies
      ) await this.renewAccessToken(req, res);

      // if your access token is expired
      try {
        jwt.verify(req.cookies.access_token, this.configService.get<string>("JWT_SECRET"));
      } catch {
        // and you have a refresh token
        if ("refresh_token" in req.cookies) {
          // renew your access token
          await this.renewAccessToken(req, res);
        } else {
          this.authService.logout(req, res);
        }
      }
    }

    next();
  }

  async renewAccessToken(req: Request, res: Response): Promise<void> {
    let refreshToken: { id: string; sessionId: string; email: string; type: "refresh" };

    try {
      refreshToken = jwt.verify(req.cookies["refresh_token"], this.configService.get<string>("JWT_SECRET")) as { id: string; sessionId: string; email: string; type: "refresh" };
    } catch {
      this.authService.logout(req, res);
      return;
    }

    // A refresh token is only valid while its session id exists in Redis -
    // logout revokes a token by deleting that key, so a missing key means revoked
    if (!refreshToken.sessionId || !(await this.redisService.getClient("default").get(refreshToken.sessionId))) {
      this.authService.logout(req, res);
      return;
    }

    // The session id must be carried over so that logout can still find and delete it in Redis
    const accessToken = this.jwtService.sign({ id: refreshToken.id, sessionId: refreshToken.sessionId, email: refreshToken.email, type: "access" }, { expiresIn: "15m" });

    // the route following this interceptor will not see the cookie unless if we modify the cookie object here
    // this is only for the request that this interceptor is directly in front of
    req.cookies["access_token"] = accessToken;

    // but this actually sets the cookie for future requests
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      ...cookieOptions(sslEnabled(
          this.configService.get<string>("SSL_KEY_BASE64"),
          this.configService.get<string>("SSL_CERT_BASE64")
      )),
      expires: new Date(new Date().getTime() + 15 * 60000)
    });
  }
}
