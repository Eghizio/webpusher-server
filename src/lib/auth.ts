import type { CookieOptions, Request, Response } from "express";

const COOKIE_NAME = "u";
const YEAR = 365 * 24 * 60 * 60 * 1_000; // Cookie expiration in milliseconds.
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "none",
  maxAge: YEAR,
  signed: true,
  secure: true,
} as const;

export class UserCookie {
  static getUserId = (request: Request): string | null =>
    request.signedCookies[COOKIE_NAME] ??
    withAuthorizationHeaderFallback(request) ??
    null;

  static setUserId = (response: Response, userId: string): void => {
    response.cookie(COOKIE_NAME, userId, COOKIE_OPTIONS);
  };
}

/* fixing demo for IOS asap hehe xd */
const withAuthorizationHeaderFallback = (request: Request) => {
  const token = request.headers["authorization"];

  console.log("auth header", { token });

  return token;
};
