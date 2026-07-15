import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const REQUEST_TIMEOUT_MS = 50000;
const MAX_BODY_BYTES = 12000;
const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";

const requestSchema = z.object({
  subject: z.string().trim().min(1).max(100),
  level: z.string().trim().min(1).max(100),
  language: z.enum(["fr", "ar", "en"]),
  difficulty: z.enum(["facile", "moyen", "difficile"]),
  examType: z.string().trim().min(1).max(100),
  numberOfQuestions: z.number().int().min(1).max(20),
  durationMinutes: z.number().int().min(10).max(240),
  totalScore: z.number().int().min(5).max(100).default(20),
  topics: z.array(z.string().trim().min(1).max(150)).max(15).default([]),
  questionTypes: z.array(z.string().trim().min(1).max(100)).max(10).default([]),
  additionalInstructions: z.string().trim().max(1500).default("")
}).strict();

const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple_choice", "true_false", "short_answer", "long_answer", "exercise", "fill_blank", "matching"]),
  statement: z.string(),
  options: z.array(z.string()),
  score: z.number()
}).strict();

const outputSchema = z.object({
  exam: z.object({
    title: z.string(),
    subject: z.string(),
    level: z.string(),
    language: z.enum(["fr", "ar", "en"]),
    durationMinutes: z.number(),
    totalScore: z.number(),
    generalInstructions: z.array(z.string()),
    sections: z.array(z.object({
      id: z.string(),
      title: z.string(),
      instructions: z.string(),
      questions: z.array(questionSchema)
    }).strict())
  }).strict(),
  answerKey: z.array(z.object({
    questionId: z.string(),
    expectedAnswer: z.string(),
    explanation: z.string()
  }).strict())
}).strict();

type ExamRequest = z.infer<typeof requestSchema>;
type ExamResponse = z.infer<typeof outputSchema>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });

const safeError = (code: string, message: string, status: number) =>
  json({ error: { code, message } }, status);

const readBody = async (request: Request) => {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return { error: safeError("PAYLOAD_TOO_LARGE", "La demande est trop volumineuse.", 413) };
  }
  try {
    return { data: JSON.parse(raw) as unknown };
  } catch {
    return { error: safeError("INVALID_JSON", "Le corps de la requête doit être un JSON valide.", 400) };
  }
};

const validateGeneratedExam = (payload: ExamResponse, request: ExamRequest) => {
  const questions = payload.exam.sections.flatMap((section) => section.questions);
  const ids = new Set(questions.map((question) => question.id));
  const answerIds = new Set(payload.answerKey.map((answer) => answer.questionId));
  const scoreSum = questions.reduce((sum, question) => sum + question.score, 0);

  return (
    payload.exam.totalScore === request.totalScore &&
    questions.length === request.numberOfQuestions &&
    ids.size === questions.length &&
    payload.answerKey.length === questions.length &&
    questions.every((question) => answerIds.has(question.id)) &&
    Math.abs(scoreSum - request.totalScore) < 0.001
  );
};

const systemInstruction = `Act as an experienced school exam designer.
Generate content appropriate to the requested educational level.
Respect the requested subject, language, difficulty, topics, exam type, duration, question count, and score.
Use clear, correct, and age-appropriate language.
Avoid ambiguous or duplicate questions.
Ensure every question has a valid answer.
Ensure the correction corresponds exactly to each question.
Distribute the score logically.
Make the exam achievable within the selected duration.
Do not invent the school name, teacher name, student name, logo, academic year, or institution information.
School metadata will be added by the existing frontend and PDF system.
For Arabic, generate correct Arabic content and support right-to-left display.
Do not include the answer key inside the student exam.
Do not include markdown code fences.
Return only the requested structured output.
All fields must always exist. For question types that do not need options, return an empty options array.
Question IDs must be unique and stable, such as Q1, Q2, Q3.
The sum of all question scores must equal totalScore.
The number of generated questions must equal numberOfQuestions.`;

const buildPrompt = (input: ExamRequest) => `Create a school exam with these parameters:
Subject: ${input.subject}
Level: ${input.level}
Language: ${input.language}
Difficulty: ${input.difficulty}
Exam type: ${input.examType}
Number of questions: ${input.numberOfQuestions}
Duration: ${input.durationMinutes} minutes
Total score: ${input.totalScore}
Topics: ${input.topics.length ? input.topics.join(", ") : "No specific topics provided"}
Question types: ${input.questionTypes.length ? input.questionTypes.join(", ") : "Choose suitable types"}
Additional instructions: ${input.additionalInstructions || "None"}`;

const mapOpenAIError = (error: unknown) => {
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: unknown }).status) : 500;
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";

  if (status === 402 || code.includes("insufficient_quota")) return safeError("OPENAI_QUOTA", "Le service de génération est temporairement indisponible.", 503);
  if (status === 401 || status === 403) return safeError("OPENAI_AUTH_ERROR", "Configuration OpenAI invalide.", 503);
  if (status === 429) return safeError("RATE_LIMITED", "Trop de demandes. Veuillez réessayer dans quelques instants.", 429);
  if (error instanceof DOMException && error.name === "AbortError") return safeError("TIMEOUT", "La génération a pris trop de temps. Veuillez réessayer.", 504);
  return safeError("OPENAI_ERROR", "Impossible de générer l'examen pour le moment.", 502);
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Méthode non autorisée." } }, 405);
  }

  // TODO: Add production-grade rate limiting based on authenticated users and a persistent database/rate-limit store.
  // An in-memory Map is intentionally avoided because Vercel Functions can run across multiple instances.

  if (!process.env.OPENAI_API_KEY) {
    return safeError("OPENAI_NOT_CONFIGURED", "Le service de génération IA n'est pas encore configuré.", 503);
  }

  const body = await readBody(request);
  if (body.error) return body.error;

  const parsed = requestSchema.safeParse(body.data);
  if (!parsed.success) {
    return safeError("INVALID_INPUT", "Merci de vérifier les paramètres de génération.", 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.parse({
      model,
      instructions: systemInstruction,
      input: buildPrompt(parsed.data),
      max_output_tokens: 6000,
      reasoning: { effort: "low" },
      text: {
        format: zodTextFormat(outputSchema, "generated_school_exam")
      }
    }, { signal: controller.signal });

    const output = response.output_parsed;
    if (!output || !validateGeneratedExam(output, parsed.data)) {
      return safeError("INVALID_AI_OUTPUT", "La génération n'a pas produit un examen valide. Veuillez réessayer.", 502);
    }

    return json(output);
  } catch (error) {
    return mapOpenAIError(error);
  } finally {
    clearTimeout(timeout);
  }
}
