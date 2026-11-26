import { RAGSource } from "../types";

const AI_SERVICE_URL = ((import.meta as any).env?.VITE_AI_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");

interface OnlineClinicalAnswer {
  answer: string;
  provider: string;
  retrieved_sources?: RAGSource[];
}

/** Sends only the user's question after explicit opt-in; no profile or report data is included. */
export async function askOnlineClinicalAi(query: string): Promise<OnlineClinicalAnswer | null> {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/ai/rag-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, patient_context: null, use_online_ai: true }),
      signal: AbortSignal.timeout(18_000),
    });
    if (!response.ok) return null;
    const result = await response.json() as OnlineClinicalAnswer;
    return typeof result.answer === "string" && result.answer.trim() ? result : null;
  } catch {
    return null;
  }
}
