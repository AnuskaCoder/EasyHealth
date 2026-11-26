import { describe, it, expect, beforeEach } from "vitest";
import {
  saveSession, loadSession, clearSession,
  seedDemoAccounts, loginAccount, registerAccount, accountExists,
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
    const acc = loginAccount("patient@demo.com", "demo1234");
    expect(acc.role).toBe("patient");
    expect(acc.email).toBe("patient@demo.com");
  });

  it("logs in demo doctor", () => {
    seedDemoAccounts();
    const acc = loginAccount("doctor@demo.com", "demo1234");
    expect(acc.role).toBe("doctor");
  });

  it("throws on wrong password", () => {
    seedDemoAccounts();
    expect(() => loginAccount("patient@demo.com", "wrongpassword")).toThrow();
  });

  it("throws on unknown email", () => {
    seedDemoAccounts();
    expect(() => loginAccount("unknown@test.com", "demo1234")).toThrow();
  });

  it("registers new account", () => {
    const acc = registerAccount("patient", "Test User", "test@test.com", "9876543210", "pass123", {});
    expect(acc.email).toBe("test@test.com");
    expect(acc.role).toBe("patient");
  });

  it("prevents duplicate registration", () => {
    registerAccount("patient", "User A", "dup@test.com", "", "pass123", {});
    expect(() => registerAccount("patient", "User B", "dup@test.com", "", "pass123", {})).toThrow();
  });

  it("accountExists returns true after register", () => {
    registerAccount("patient", "Exists", "exists@test.com", "", "pass", {});
    expect(accountExists("exists@test.com")).toBe(true);
  });

  it("accountExists returns false for unknown email", () => {
    expect(accountExists("nobody@test.com")).toBe(false);
  });

  it("saves and loads session with rememberMe=true in localStorage", () => {
    const session = { role: "patient" as const, userId: "p1", name: "Test", email: "t@t.com", rememberMe: true, loginTime: Date.now() };
    saveSession(session);
    expect(loadSession()?.email).toBe("t@t.com");
  });

  it("clearSession removes stored session", () => {
    const session = { role: "patient" as const, userId: "p1", name: "Test", email: "t@t.com", rememberMe: true, loginTime: Date.now() };
    saveSession(session);
    clearSession();
    expect(loadSession()).toBeNull();
  });
});
