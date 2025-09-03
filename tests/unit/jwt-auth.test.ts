import { beforeEach, describe, expect, it, vitest } from "vitest";
import { createJwtAuthService } from "../../server/security/jwt-auth";

describe("JWT Auth Service", () => {
  const TEST_ACCESS_SECRET = "test-access-secret-that-is-at-least-32-chars-long";
  const TEST_REFRESH_SECRET = "test-refresh-secret-that-is-at-least-32-chars-long";

  interface TestPayload {
    userId: string;
    email: string;
    roles: string[];
  }

  const testPayload: TestPayload = {
    userId: "test-user-id",
    email: "test@example.com",
    roles: ["user"],
  };

  let jwtAuthService!: ReturnType<typeof createJwtAuthService<TestPayload>>;

  beforeEach(() => {
    jwtAuthService = createJwtAuthService<TestPayload>({
      accessTokenSecret: TEST_ACCESS_SECRET,
      refreshTokenSecret: TEST_REFRESH_SECRET,
      accessTokenExpiry: "1h",
    });
  });

  it("should generate a valid access token", () => {
    const token = jwtAuthService.signAccessToken(testPayload.userId, testPayload);
    expect(token).toBeTypeOf("string");
    expect(token.split(".")).toHaveLength(3); // Valid JWT structure

    const decoded = jwtAuthService.validateAccessToken(token);
    expect(decoded?.sub).toEqual(testPayload.userId);
    expect(decoded?.type).toEqual("access");
    expect(decoded?.payload).toEqual(testPayload);
  });

  it("should generate a valid refresh token", () => {
    const token = jwtAuthService.signRefreshToken(testPayload.userId, testPayload);
    expect(token).toBeTypeOf("string");
    expect(token.split(".")).toHaveLength(3); // Valid JWT structure

    const decoded = jwtAuthService.validateRefreshToken(token);
    expect(decoded?.sub).toEqual(testPayload.userId);
    expect(decoded?.type).toEqual("refresh");
    expect(decoded?.payload).toEqual(testPayload);
  });

  it("should generate different tokens for different payloads", () => {
    const token1 = jwtAuthService.signAccessToken(testPayload.userId, testPayload);
    const token2 = jwtAuthService.signAccessToken(testPayload.userId, {
      ...testPayload,
      email: "test2@example.com",
    });

    expect(token1).not.toEqual(token2);
  });

  it("should fail to decode an invalid access token", () => {
    const token = "invalid-token";
    const decoded = jwtAuthService.validateAccessToken(token);
    expect(decoded).toBeNull();
  });

  it("should fail to decode an invalid refresh token", () => {
    const token = "invalid-token";
    const decoded = jwtAuthService.validateRefreshToken(token);
    expect(decoded).toBeNull();
  });

  it("should reject token with invalid signature", () => {
    const token = jwtAuthService.signAccessToken(testPayload.userId, testPayload);
    const tamperedToken = token.slice(0, -5) + "XXXXX"; // Tamper with signature

    const result = jwtAuthService.validateAccessToken(tamperedToken);
    expect(result).toBeNull();
  });

  it("should reject an expired token", () => {
    vitest.useFakeTimers();
    const token = jwtAuthService.signAccessToken(testPayload.userId, testPayload);
    vitest.advanceTimersByTime(1000 * 60 * 60); // Fast-forward 1 hour
    const result = jwtAuthService.validateAccessToken(token);
    vitest.useRealTimers();
    expect(result).toBeNull();
  });

  it("should reject an empty access token", () => {
    const result = jwtAuthService.validateAccessToken("");
    expect(result).toBeNull();
  });

  it("should reject an empty refresh token", () => {
    const result = jwtAuthService.validateRefreshToken("");
    expect(result).toBeNull();
  });
});
