import { RAGSource } from "../types";

const AI_SERVICE_URL = ((import.meta as any).env?.VITE_AI_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");

interface OnlineClinicalAnswer {
  answer: string;
  provider: string;
  retrieved_sources?: RAGSource[];
  error?: string;
}

/** Sends only the user's question after explicit opt-in; no profile or report data is included. */
export async function askOnlineClinicalAi(query: string): Promise<OnlineClinicalAnswer> {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/ai/rag-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(18_000),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        answer: "",
        provider: "Unavailable",
        error: typeof error.detail === "string" ? error.detail : "The online AI service is unavailable.",
      };
    }
    const result = await response.json() as OnlineClinicalAnswer;
    return typeof result.answer === "string" && result.answer.trim()
      ? result
      : { answer: "", provider: "Unavailable", error: "The online AI returned an empty answer." };
  } catch (error) {
    return {
      answer: "",
      provider: "Unavailable",
      error: error instanceof Error ? error.message : "Could not connect to the online AI service.",
    };
  }
}
