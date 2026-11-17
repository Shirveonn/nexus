import { describe, expect, it } from "vitest";
import {
  friendlyError, passwordStrength, validateCode, validateDisplayName, validateEmail, validatePassword, validateUsername
} from "@/features/auth/validation";

describe("username rules", () => {
  it("accepts good names (case-insensitive)", () => {
    expect(validateUsername("kenji_99")).toBeNull();
    expect(validateUsername("Kenji_99")).toBeNull();
  });
  it.each([["ab", /at least 3/], ["a".repeat(21), /at most 20/], ["no spaces", /letters, numbers/], ["héllo", /letters, numbers/], ["Admin", /reserved/]])(
    "rejects %s", (name, message) => expect(validateUsername(name)).toMatch(message)
  );
});

describe("other fields", () => {
  it("validates emails", () => {
    expect(validateEmail("a@b.co")).toBeNull();
    expect(validateEmail("")).toMatch(/enter/i);
    expect(validateEmail("nope")).toMatch(/doesn't look/);
  });
  it("validates passwords", () => {
    expect(validatePassword("hunter22!")).toBeNull();
    expect(validatePassword("short")).toMatch(/at least 8/);
    expect(validatePassword("aaaaaaaaaa")).toMatch(/easy/);
  });
  it("validates display names and codes", () => {
    expect(validateDisplayName("  ")).not.toBeNull();
    expect(validateDisplayName("Kenji ✨")).toBeNull();
    expect(validateCode("123456")).toBeNull();
    expect(validateCode("12a456")).not.toBeNull();
  });
  it("rates password strength", () => {
    expect(passwordStrength("")).toBe(0);
    expect(passwordStrength("abc")).toBe(1);
    expect(passwordStrength("Abcdefgh1234!")).toBe(4);
  });
});

describe("friendlyError", () => {
  it("maps Supabase error codes", () => {
    expect(friendlyError({ code: "invalid_credentials", message: "Invalid login credentials" })).toBe("Wrong email or password.");
    expect(friendlyError({ code: "23505", message: "duplicate key" })).toMatch(/taken/);
    expect(friendlyError({ message: "Database error saving new user" })).toMatch(/username/);
    expect(friendlyError({ name: "AuthRetryableFetchError", message: "Failed to fetch" })).toMatch(/internet/);
    expect(friendlyError({ message: "You can only change your username once every 7 days." })).toMatch(/7 days/);
  });
  it("falls back to the original message", () => {
    expect(friendlyError(new Error("Something odd"))).toBe("Something odd");
  });
});
