import type { ApiErrorPayload, GenerateExamRequest, GeneratedExamResponse } from "../types/aiExam";

const CLIENT_TIMEOUT_MS = 55000;

const readJsonSafely = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const isApiError = (value: unknown): value is ApiErrorPayload =>
  Boolean(value && typeof value === "object" && "error" in value);

export const generateExamWithAi = async (payload: GenerateExamRequest): Promise<GeneratedExamResponse> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    const response = await fetch("/api/generate-exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await readJsonSafely(response);
    if (!response.ok) {
      if (isApiError(data)) throw new Error(data.error.message);
      throw new Error("La génération a échoué. Veuillez réessayer.");
    }

    if (!data || typeof data !== "object" || !("exam" in data) || !("answerKey" in data)) {
      throw new Error("Réponse de génération invalide.");
    }

    return data as GeneratedExamResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("La génération prend trop de temps. Veuillez réessayer.");
    }
    if (error instanceof Error) throw error;
    throw new Error("Erreur inattendue pendant la génération.");
  } finally {
    window.clearTimeout(timeout);
  }
};
