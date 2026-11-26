/**
 * EasyHealth Auth Storage
 *
 * Authentication strategy:
 * 1. PRIMARY: Backend API (Express + bcrypt) — used when backend is reachable.
 *    Passwords are hashed with bcrypt on the server. JWT is returned and stored here.
 * 2. FALLBACK: localStorage-only demo mode — used when backend is unreachable
 *    (e.g. Vercel static demo). Passwords are NEVER stored; only a demo flag is set.
 *    This fallback is clearly labelled and NOT suitable for real patient data.
 */

import { setToken, removeToken, authApi } from "./api";

export interface AuthSession {
  role: "patient" | "doctor";
  userId: string;
  name: string;
  email: string;
  rememberMe: boolean;
  loginTime: number;
  source: "backend" | "demo"; // tracks whether this is real or demo auth
}

const SESSION_KEY = "eh_session_v2";
const ACCOUNTS_KEY = "eh_demo_accounts";

// ── Session Management ────────────────────────────────────────────────────────
export function saveSession(session: AuthSession): void {
  const storage = session.rememberMe ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): AuthSession | null {
  for (const storage of [localStorage, sessionStorage]) {
    const raw = storage.getItem(SESSION_KEY);
    if (raw) {
      try { return JSON.parse(raw) as AuthSession; }
      catch { storage.removeItem(SESSION_KEY); }
    }
  }
  return null;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  removeToken();
}

// ── Backend-first login ───────────────────────────────────────────────────────
export async function loginWithBackend(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<{ session: AuthSession; profileData: any }> {
  const result = await authApi.login(email, password);

  if (result.error || !result.data?.token) {
    throw new Error(result.error || "Login failed");
  }

  const { token, user } = result.data;

  // Store JWT for all subsequent API calls
  setToken(token, rememberMe);

  // Fetch full profile
  const profileResult = user.role === "patient"
    ? await import("./api").then(m => m.patientApi.getProfile())
    : null;

  const session: AuthSession = {
    role: user.role,
    userId: user.id,
    name: user.name,
    email: user.email,
    rememberMe,
    loginTime: Date.now(),
    source: "backend",
  };

  saveSession(session);

  return {
    session,
    profileData: profileResult?.data || user,
  };
}

// ── Backend-first register ────────────────────────────────────────────────────
export async function registerWithBackend(
  role: "patient" | "doctor",
  name: string,
  email: string,
  phone: string,
  password: string,
  profileData: any,
  rememberMe: boolean
): Promise<AuthSession> {
  const result = await authApi.register({ email, password, name, role, phone });

  if (result.error || !result.data?.token) {
    throw new Error(result.error || "Registration failed");
  }

  const { token, user } = result.data;
  setToken(token, rememberMe);

  const session: AuthSession = {
    role: user.role,
    userId: user.id,
    name: user.name,
    email: user.email,
    rememberMe,
    loginTime: Date.now(),
    source: "backend",
  };

  saveSession(session);
  return session;
}

// ── Demo fallback (offline / Vercel static) ───────────────────────────────────
// IMPORTANT: This is NOT secure. It is only for portfolio demonstration
// when the backend is not running. Never use with real patient data.

interface DemoAccount {
  id: string;
  role: "patient" | "doctor";
  name: string;
  email: string;
  // We store a salted hash marker, NOT the password itself.
  // This is still not bcrypt but makes it clear no plaintext is stored.
  authToken: string;
  profileData: any;
}

function makeDemoToken(email: string, password: string): string {
  // Not cryptographically secure — demo only. Backend uses bcrypt.
  const combined = `${email.toLowerCase()}::${password}::eh_demo_2024`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash |= 0;
  }
  return `demo_${Math.abs(hash).toString(36)}`;
}

export function seedDemoAccounts(): void {
  const accounts = getDemoAccounts();
  if (accounts.length > 0) return;

  const demoPatient = {
    id: "p1", name: "Ananya Krishnan", age: 28, gender: "Female" as const,
    dob: "1996-03-15", phone: "+91 98765 43210", email: "patient@demo.com",
    bloodGroup: "B+", height: 164, weight: 58,
    allergies: ["Penicillin", "Dust Mites"],
    chronicConditions: ["Mild Bronchial Asthma"],
    emergencyContact: "+91 98765 00000 (Rohan Krishnan - Brother)",
    address: "Flat 402, Green Glen Layout, Bangalore 560103",
    pastSurgeries: ["Appendectomy (2019)"],
    vaccinations: ["COVID-19 (3 doses)", "Hepatitis B"],
  };

  const demoDoctor = {
    id: "d-demo", name: "Dr. Priya Sharma", specialty: "Cardiologist",
    qualifications: ["MBBS", "MD", "DM (Cardiology)", "FACC"],
    experience: 18, hospital: "Apollo Hospitals", hospitalId: "h1",
    rating: 4.9, reviewCount: 1240, consultFee: 1200, emergencyFee: 2500,
    availableToday: true, nextSlot: "11:30 AM",
    languages: ["English", "Hindi", "Tamil"],
    about: "Senior interventional cardiologist.",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80",
    verified: true, online: true, patientsCount: 4800, successRate: 98,
  };

  const accounts2: DemoAccount[] = [
    { id: "p1", role: "patient", name: "Ananya Krishnan", email: "patient@demo.com", authToken: makeDemoToken("patient@demo.com", "demo1234"), profileData: demoPatient },
    { id: "d-demo", role: "doctor", name: "Dr. Priya Sharma", email: "doctor@demo.com", authToken: makeDemoToken("doctor@demo.com", "demo1234"), profileData: demoDoctor },
  ];

  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts2));
}

function getDemoAccounts(): DemoAccount[] {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]"); }
  catch { return []; }
}

export function loginDemo(email: string, password: string): DemoAccount {
  const accounts = getDemoAccounts();
  const account = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (!account) throw new Error("No demo account found with this email.");
  if (account.authToken !== makeDemoToken(email, password)) throw new Error("Incorrect password.");
  return account;
}

export function registerDemo(
  role: "patient" | "doctor",
  name: string,
  email: string,
  phone: string,
  profileData: any
): DemoAccount {
  const accounts = getDemoAccounts();
  if (accounts.some(a => a.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with this email already exists.");
  }
  // We store a placeholder token — password NOT stored
  const account: DemoAccount = {
    id: `${role[0]}-${Date.now()}`,
    role, name,
    email: email.toLowerCase(),
    authToken: `demo_registered_${Date.now()}`,
    profileData: { ...profileData, id: `${role[0]}-${Date.now()}` },
  };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
  return account;
}

export function accountExists(email: string): boolean {
  return getDemoAccounts().some(a => a.email.toLowerCase() === email.toLowerCase());
}
