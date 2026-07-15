import { adminUser, sampleExams } from "../data/seed";
import type { Exam, User } from "../types";

type StoredUser = Omit<User, "status"> & { status: User["status"] | "blocked" };

const USERS_KEY = "taalimpro_users";
const EXAMS_KEY = "taalimpro_exams";
const SESSION_KEY = "taalimpro_session";
const DOWNLOADS_KEY = "taalimpro_pdf_downloads";

const read = <T,>(key: string, fallback: T): T => {
  const value = localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const write = <T,>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));

export const ensureSeedData = () => {
  const users = read<StoredUser[]>(USERS_KEY, []);
  const migratedUsers = users.map((user) => ({
    ...user,
    status: user.status === "blocked" ? "suspended" : user.status
  })) as User[];
  if (!migratedUsers.some((user) => user.email === adminUser.email)) {
    write(USERS_KEY, [adminUser, ...migratedUsers]);
  } else if (JSON.stringify(users) !== JSON.stringify(migratedUsers)) {
    write(USERS_KEY, migratedUsers);
  }
  const exams = read<Exam[]>(EXAMS_KEY, []);
  if (exams.length === 0) write(EXAMS_KEY, sampleExams);
  if (!localStorage.getItem(DOWNLOADS_KEY)) write(DOWNLOADS_KEY, 0);
};

export const getUsers = () => read<User[]>(USERS_KEY, []);
export const saveUsers = (users: User[]) => write(USERS_KEY, users);
export const getExams = () => read<Exam[]>(EXAMS_KEY, []);
export const saveExams = (exams: Exam[]) => write(EXAMS_KEY, exams);
export const getSessionId = () => localStorage.getItem(SESSION_KEY);
export const setSessionId = (id: string) => localStorage.setItem(SESSION_KEY, id);
export const clearSession = () => localStorage.removeItem(SESSION_KEY);
export const getDownloadCount = () => read<number>(DOWNLOADS_KEY, 0);
export const incrementDownloadCount = () => write(DOWNLOADS_KEY, getDownloadCount() + 1);

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const downloadDataUrl = (dataUrl: string, fileName: string) => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
