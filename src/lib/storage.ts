import { sampleExams } from "../data/seed";
import type { Exam } from "../types";

const EXAMS_KEY = "taalimpro_exams";
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

export const getExams = () => read<Exam[]>(EXAMS_KEY, sampleExams);
export const saveExams = (exams: Exam[]) => write(EXAMS_KEY, exams);
export const getDownloadCount = () => read<number>(DOWNLOADS_KEY, 0);
export const incrementDownloadCount = () => write(DOWNLOADS_KEY, getDownloadCount() + 1);

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
