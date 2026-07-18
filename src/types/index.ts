export type Role = "teacher" | "platform_admin";
export type UserStatus = "pending" | "active" | "suspended" | "rejected";
export type Level = "PS" | "MS" | "GS" | "CP" | "CE1" | "CE2" | "CM1" | "CM2" | "CE6";
export type Semester = "Premier semestre" | "Deuxième semestre";
export type Subject = "Français" | "Arabe" | "Mathématiques" | "Activité scientifique" | "Éducation islamique";
export type ExamLanguage = "fr" | "ar" | "en";

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
  role: Role;
  status: UserStatus;
  mustChangePassword?: boolean;
  createdAt: string;
}

export type TrustedProfileRole = Role;

export interface TrustedAuthProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: TrustedProfileRole;
  accountStatus: UserStatus;
  mustChangePassword: boolean;
}

export interface Exam {
  id: string;
  title: string;
  level: Level;
  semester: Semester;
  subject: Subject;
  type: string;
  language?: ExamLanguage;
  themes?: string[];
  instructions?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: "application/pdf";
  replaceLegacyHeader?: boolean;
  headerHeightRatio?: number;
  applyHeaderToAllPages?: boolean;
  createdBy?: string;
  duration?: string;
  bareme?: string;
  content?: string;
  correction?: string;
  active: boolean;
  createdAt: string;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}
