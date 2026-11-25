// ─── Auth Persistence via localStorage ───────────────────────────────────────
// Stores session so user stays logged in across browser refreshes.

export interface AuthSession {
  role: "patient" | "doctor";
  userId: string;
  name: string;
  email: string;
  rememberMe: boolean;
  loginTime: number;
}

const SESSION_KEY = "easyhealth_session";
const ACCOUNTS_KEY = "easyhealth_accounts";
const PROFILE_KEY = "easyhealth_profile";

// ── Session Management ────────────────────────────────────────────────────────
export function saveSession(session: AuthSession): void {
  const storage = session.rememberMe ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): AuthSession | null {
  const fromLocal = localStorage.getItem(SESSION_KEY);
  if (fromLocal) {
    try { return JSON.parse(fromLocal); } catch { localStorage.removeItem(SESSION_KEY); }
  }
  const fromSession = sessionStorage.getItem(SESSION_KEY);
  if (fromSession) {
    try { return JSON.parse(fromSession); } catch { sessionStorage.removeItem(SESSION_KEY); }
  }
  return null;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

// ── Account Registry (simulates a backend user DB in localStorage) ────────────
export interface StoredAccount {
  id: string;
  role: "patient" | "doctor";
  name: string;
  email: string;
  phone: string;
  passwordHash: string; // simple btoa hash (not prod-secure, fine for demo)
  profileData: any;
  createdAt: number;
}

function hashPassword(password: string): string {
  // Simple reversible hash for demo purposes
  return btoa(unescape(encodeURIComponent(password + "_eh2024")));
}

export function getAccounts(): StoredAccount[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
  } catch { return []; }
}

function saveAccounts(accounts: StoredAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function registerAccount(
  role: "patient" | "doctor",
  name: string,
  email: string,
  phone: string,
  password: string,
  profileData: any
): StoredAccount {
  const accounts = getAccounts();
  const existing = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (existing) throw new Error("An account with this email already exists.");

  const account: StoredAccount = {
    id: `${role[0]}-${Date.now()}`,
    role,
    name,
    email: email.toLowerCase(),
    phone,
    passwordHash: hashPassword(password),
    profileData,
    createdAt: Date.now(),
  };
  saveAccounts([...accounts, account]);
  return account;
}

export function loginAccount(
  email: string,
  password: string
): StoredAccount {
  const accounts = getAccounts();
  const account = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (!account) throw new Error("No account found with this email address.");
  if (account.passwordHash !== hashPassword(password)) throw new Error("Incorrect password.");
  return account;
}

export function accountExists(email: string): boolean {
  return getAccounts().some(a => a.email.toLowerCase() === email.toLowerCase());
}

// Seed demo accounts so the user can log in immediately with known credentials
export function seedDemoAccounts(): void {
  const accounts = getAccounts();
  if (accounts.length > 0) return; // already seeded

  const demoPatientProfile = {
    id: "p1", name: "Ananya Krishnan", age: 28, gender: "Female",
    dob: "1996-03-15", phone: "+91 98765 43210", email: "patient@demo.com",
    bloodGroup: "B+", height: 164, weight: 58,
    allergies: ["Penicillin", "Dust Mites"],
    chronicConditions: ["Mild Bronchial Asthma"],
    emergencyContact: "+91 98765 00000 (Rohan Krishnan - Brother)",
    address: "Flat 402, Green Glen Layout, Bellandur, Bangalore 560103",
    pastSurgeries: ["Appendectomy (2019)"],
    vaccinations: ["COVID-19 (3 doses)", "Hepatitis B"],
  };

  const demoDoctorProfile = {
    id: "d-demo", name: "Dr. Priya Sharma", specialty: "Cardiologist",
    qualifications: ["MBBS", "MD", "DM (Cardiology)", "FACC"],
    experience: 18, hospital: "Apollo Hospitals", hospitalId: "h1",
    rating: 4.9, reviewCount: 1240, consultFee: 1200, emergencyFee: 2500,
    availableToday: true, nextSlot: "11:30 AM",
    languages: ["English", "Hindi", "Tamil"],
    about: "Senior interventional cardiologist with 18 years of expertise.",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80",
    verified: true, online: true, patientsCount: 4800, successRate: 98,
  };

  registerAccount("patient", "Ananya Krishnan", "patient@demo.com", "+91 98765 43210", "demo1234", demoPatientProfile);
  registerAccount("doctor", "Dr. Priya Sharma", "doctor@demo.com", "+91 98765 11111", "demo1234", demoDoctorProfile);
}
