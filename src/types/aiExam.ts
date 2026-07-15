export type ExamLanguage = "fr" | "ar" | "en";
export type ExamDifficulty = "facile" | "moyen" | "difficile";
export type GeneratedQuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "long_answer"
  | "exercise"
  | "fill_blank"
  | "matching";

export interface GenerateExamRequest {
  subject: string;
  level: string;
  language: ExamLanguage;
  difficulty: ExamDifficulty;
  examType: string;
  numberOfQuestions: number;
  durationMinutes: number;
  totalScore?: number;
  topics?: string[];
  questionTypes?: string[];
  additionalInstructions?: string;
}

export interface GeneratedQuestion {
  id: string;
  type: GeneratedQuestionType;
  statement: string;
  options: string[];
  score: number;
}

export interface GeneratedSection {
  id: string;
  title: string;
  instructions: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedExam {
  title: string;
  subject: string;
  level: string;
  language: ExamLanguage;
  durationMinutes: number;
  totalScore: number;
  generalInstructions: string[];
  sections: GeneratedSection[];
}

export interface GeneratedAnswer {
  questionId: string;
  expectedAnswer: string;
  explanation: string;
}

export interface GeneratedExamResponse {
  exam: GeneratedExam;
  answerKey: GeneratedAnswer[];
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
  };
}
