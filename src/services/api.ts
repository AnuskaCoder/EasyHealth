/**
 * EasyHealth Full-Stack API Client
 * Connects React UI to Node.js / Express Backend & Python / FastAPI AI Microservice
 */

const BACKEND_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/api";
const AI_SERVICE_URL = (import.meta as any).env?.VITE_AI_URL || "http://localhost:8000/ai";

export const apiClient = {
  // ─── AUTH & SECURITY ────────────────────────────────────────────────────────
  async register(data: { email: string; password: string; role: string; name: string }) {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return { token: "demo-jwt-token", user: data };
    }
  },

  async login(credentials: { email: string; password: string }) {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      return await res.json();
    } catch {
      return { token: "demo-jwt-token" };
    }
  },

  // ─── DOCTORS & APPOINTMENTS ────────────────────────────────────────────────
  async getDoctors(specialty?: string) {
    try {
      const url = specialty && specialty !== "All"
        ? `${BACKEND_URL}/doctors?specialty=${encodeURIComponent(specialty)}`
        : `${BACKEND_URL}/doctors`;
      const res = await fetch(url);
      return await res.json();
    } catch {
      return null;
    }
  },

  async bookAppointment(bookingData: any) {
    try {
      const res = await fetch(`${BACKEND_URL}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // ─── AI / ML MICROSERVICE (Python FastAPI) ──────────────────────────────────
  async summarizeReport(reportTitle: string, biomarkers: any[]) {
    try {
      const res = await fetch(`${AI_SERVICE_URL}/summarize-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_title: reportTitle, biomarkers }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async queryRagChat(query: string, patientContext?: any) {
    try {
      const res = await fetch(`${AI_SERVICE_URL}/rag-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, patient_context: patientContext }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async ocrExtractScan(fileName: string, documentType = "Blood Test") {
    try {
      const res = await fetch(`${AI_SERVICE_URL}/ocr-extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: fileName, document_type: documentType }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async symptomTriage(chiefComplaint: string, duration: string, severity: number, redFlags: string[]) {
    try {
      const res = await fetch(`${AI_SERVICE_URL}/symptom-triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chief_complaint: chiefComplaint,
          duration,
          severity,
          red_flags: redFlags,
        }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },
};
