import { hashPassword, comparePasswords } from "../../server/security/password";
import { describe, expect, it } from "vitest";

describe("Bcrypt Password Hashing", () => {
  it("can hash a password", async () => {
    const password = "HelloWorld";
    const hashed = await hashPassword(password);
    expect(hashed).not.toBe(password);
  });

  it("can compare a password", async () => {
    const password = "HelloWorld";
    const hashed = await hashPassword(password);
    const isMatch = await comparePasswords(password, hashed);
    expect(isMatch).toBe(true);
  });

  it("returns false on a wrong password", async () => {
    const password = "HelloWorld";
    const hashed = await hashPassword(password);
    const isMatch = await comparePasswords("WrongPassword", hashed);
    expect(isMatch).toBe(false);
  });
});
