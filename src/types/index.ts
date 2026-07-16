import type { GeneratedExamResponse } from "./aiExam";

export type Role = "admin" | "client";
export type UserStatus = "pending" | "active" | "suspended";
export type Level = "PS" | "MS" | "GS" | "CP" | "CE1" | "CE2" | "CM1" | "CM2" | "CE6";
export type Semester = "Premier semestre" | "Deuxième semestre";
export type Subject = "Français" | "Arabe" | "Mathématiques" | "Activité scientifique" | "Éducation islamique";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  schoolName: string;
  city: string;
  schoolLevel?: string;
  schoolSubject?: string;
  logo?: string;
  password: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export interface Exam {
  id: string;
  title: string;
  level: Level;
  semester: Semester;
  subject: Subject;
  type: string;
  duration: string;
  bareme: string;
  content: string;
  correction?: string;
  aiGenerated?: GeneratedExamResponse;
  active: boolean;
  createdAt: string;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}
