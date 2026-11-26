/**
 * EasyHealth API Client
 * All frontend → backend communication goes through this module.
 * Falls back gracefully when backend is unreachable (Vercel static demo).
 */

const BACKEND_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/api";

// ── Token management ──────────────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem("eh_jwt") || sessionStorage.getItem("eh_jwt");
}

export function setToken(token: string, persist: boolean): void {
  if (persist) localStorage.setItem("eh_jwt", token);
  else sessionStorage.setItem("eh_jwt", token);
}

export function removeToken(): void {
  localStorage.removeItem("eh_jwt");
  sessionStorage.removeItem("eh_jwt");
}

// ── Base fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { data: null, error: json.error || `HTTP ${res.status}`, status: res.status };
    }

    return { data: json as T, error: null, status: res.status };
  } catch {
    // Backend not reachable — caller handles fallback
    return { data: null, error: "Backend unavailable", status: 0 };
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  async login(email: string, password: string) {
    return apiFetch<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async register(data: { email: string; password: string; name: string; role: string; phone?: string }) {
    return apiFetch<{ token: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getMe() {
    return apiFetch<{ user: any }>("/auth/me");
  },

  async logout() {
    return apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
  },
};

// ── Patients ──────────────────────────────────────────────────────────────────
export const patientApi = {
  async getProfile() {
    return apiFetch<any>("/patients/profile");
  },

  async updateProfile(data: any) {
    return apiFetch<any>("/patients/profile", { method: "PUT", body: JSON.stringify(data) });
  },

  async getDashboard() {
    return apiFetch<any>("/patients/dashboard");
  },

  async getMedications() {
    return apiFetch<any[]>("/patients/medications");
  },

  async getHealthStats() {
    return apiFetch<any>("/patients/health-stats");
  },
};

// ── Doctors ───────────────────────────────────────────────────────────────────
export const doctorApi = {
  async getAll(params?: { specialty?: string; available?: boolean; search?: string }) {
    const qs = new URLSearchParams();
    if (params?.specialty) qs.set("specialty", params.specialty);
    if (params?.available) qs.set("available", "true");
    if (params?.search) qs.set("search", params.search);
    return apiFetch<{ data: any[]; count: number }>(`/doctors?${qs.toString()}`);
  },

  async getById(id: string) {
    return apiFetch<any>(`/doctors/${id}`);
  },

  async getAnalytics() {
    return apiFetch<any>("/doctors/analytics");
  },

  async getSpecialties() {
    return apiFetch<string[]>("/doctors/specialties");
  },
};

// ── Appointments ──────────────────────────────────────────────────────────────
export const appointmentApi = {
  async getAll(status?: string) {
    const qs = status ? `?status=${status}` : "";
    return apiFetch<{ data: any[]; count: number }>(`/appointments${qs}`);
  },

  async getById(id: string) {
    return apiFetch<any>(`/appointments/${id}`);
  },

  async create(data: {
    doctorId: string; doctorName: string; doctorSpecialty: string; doctorImage: string;
    date: string; time: string; mode: string; hospital: string; fee: number; symptoms?: string;
  }) {
    return apiFetch<any>("/appointments", { method: "POST", body: JSON.stringify(data) });
  },

  async updateStatus(id: string, status: string, notes?: string, cancellationReason?: string) {
    return apiFetch<any>(`/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes, cancellationReason }),
    });
  },

  async cancel(id: string, reason?: string) {
    return apiFetch<any>(`/appointments/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    });
  },
};

// ── Medical Records ───────────────────────────────────────────────────────────
export const recordApi = {
  async getAll() {
    return apiFetch<{ data: any[]; count: number }>("/records");
  },

  async getById(id: string) {
    return apiFetch<any>(`/records/${id}`);
  },

  async create(data: {
    name: string; type: string; date: string; uploadedBy: string;
    fileName?: string; aiSummary?: string; tags?: string[]; biomarkers?: any[];
  }) {
    return apiFetch<any>("/records", { method: "POST", body: JSON.stringify(data) });
  },

  async addAiSummary(id: string, aiSummary: string, biomarkers?: any[]) {
    return apiFetch<any>(`/records/${id}/ai-summary`, {
      method: "PATCH",
      body: JSON.stringify({ aiSummary, biomarkers }),
    });
  },

  async delete(id: string) {
    return apiFetch<any>(`/records/${id}`, { method: "DELETE" });
  },

  async grantConsent(doctorId: string, doctorName: string, specialty: string) {
    return apiFetch<any>("/records/consent/grant", {
      method: "POST",
      body: JSON.stringify({ doctorId, doctorName, specialty }),
    });
  },

  async revokeConsent(doctorId: string) {
    return apiFetch<any>(`/records/consent/revoke/${doctorId}`, { method: "DELETE" });
  },

  async getConsentList() {
    return apiFetch<any[]>("/records/consent/list");
  },
};

// ── Pharmacy ──────────────────────────────────────────────────────────────────
export const pharmacyApi = {
  async getMedicines(params?: { category?: string; search?: string }) {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.search) qs.set("search", params.search);
    return apiFetch<{ data: any[]; count: number }>(`/pharmacy/medicines?${qs.toString()}`);
  },

  async placeOrder(data: { items: any[]; address: string; couponCode?: string }) {
    return apiFetch<any>("/pharmacy/order", { method: "POST", body: JSON.stringify(data) });
  },

  async getOrders() {
    return apiFetch<{ data: any[] }>("/pharmacy/orders");
  },

  async getOrderById(id: string) {
    return apiFetch<any>(`/pharmacy/orders/${id}`);
  },
};

// ── Lab Tests ─────────────────────────────────────────────────────────────────
export const labApi = {
  async getTests(category?: string) {
    const qs = category ? `?category=${category}` : "";
    return apiFetch<{ data: any[]; count: number }>(`/labs${qs}`);
  },

  async bookTest(data: { packageId: string; packageName: string; sampleType: string; date: string; timeSlot: string; address: string; fee: number }) {
    return apiFetch<any>("/labs/book", { method: "POST", body: JSON.stringify(data) });
  },

  async getBookings() {
    return apiFetch<{ data: any[] }>("/labs/bookings");
  },
};

// ── Emergency ─────────────────────────────────────────────────────────────────
export const emergencyApi = {
  async getNearbyHospitals() {
    return apiFetch<{ data: any[] }>("/emergency/hospitals");
  },

  async admitPatient(data: { hospitalId: string; bedType: string; patientName: string; patientPhone: string; symptoms?: string[] }) {
    return apiFetch<any>("/emergency/admit", { method: "POST", body: JSON.stringify(data) });
  },

  async bookBed(data: { hospitalId: string; bedType: string; patientName: string; patientPhone: string; patientAge: string; reason?: string }) {
    return apiFetch<any>("/emergency/book-bed", { method: "POST", body: JSON.stringify(data) });
  },
};

// ── Backend health check ──────────────────────────────────────────────────────
export async function checkBackendHealth(): Promise<boolean> {
  const result = await apiFetch<{ status: string }>("/health");
  return result.data?.status === "ok";
}
