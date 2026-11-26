import { describe, it, expect, beforeEach } from "vitest";
import {
  saveSession, loadSession, clearSession,
  seedDemoAccounts, loginDemo, registerDemo, accountExists,
} from "../services/authStorage";

describe("authStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("seeds demo accounts without throwing", () => {
    expect(() => seedDemoAccounts()).not.toThrow();
  });

  it("logs in demo patient", () => {
    seedDemoAccounts();
    const acc = loginDemo("patient@demo.com", "demo1234");
    expect(acc.role).toBe("patient");
    expect(acc.email).toBe("patient@demo.com");
  });

  it("logs in demo doctor", () => {
    seedDemoAccounts();
    const acc = loginDemo("doctor@demo.com", "demo1234");
    expect(acc.role).toBe("doctor");
  });

  it("throws on wrong password", () => {
    seedDemoAccounts();
    expect(() => loginDemo("patient@demo.com", "wrongpassword")).toThrow();
  });

  it("throws on unknown email", () => {
    seedDemoAccounts();
    expect(() => loginDemo("unknown@test.com", "demo1234")).toThrow();
  });

  it("registers new demo account", () => {
    const acc = registerDemo("patient", "Test User", "test@test.com", "9876543210", { name: "Test User" });
    expect(acc.email).toBe("test@test.com");
    expect(acc.role).toBe("patient");
  });

  it("prevents duplicate registration in demo mode", () => {
    registerDemo("patient", "User A", "dup@test.com", "", {});
    expect(() => registerDemo("patient", "User B", "dup@test.com", "", {})).toThrow();
  });

  it("accountExists returns true after register", () => {
    registerDemo("patient", "Exists", "exists@test.com", "", {});
    expect(accountExists("exists@test.com")).toBe(true);
  });

  it("accountExists returns false for unknown email", () => {
    expect(accountExists("nobody@test.com")).toBe(false);
  });

  it("saves and loads session with rememberMe=true", () => {
    const session = {
      role: "patient" as const, userId: "p1", name: "Test", email: "t@t.com",
      rememberMe: true, loginTime: Date.now(), source: "demo" as const,
    };
    saveSession(session);
    expect(loadSession()?.email).toBe("t@t.com");
  });

  it("clearSession removes stored session", () => {
    const session = {
      role: "patient" as const, userId: "p1", name: "Test", email: "t@t.com",
      rememberMe: true, loginTime: Date.now(), source: "demo" as const,
    };
    saveSession(session);
    clearSession();
    expect(loadSession()).toBeNull();
  });
});
