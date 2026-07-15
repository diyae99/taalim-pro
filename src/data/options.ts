import type { Level, Semester, Subject } from "../types";

export const levelGroups: { title: string; levels: Level[] }[] = [
  { title: "Maternelle", levels: ["PS", "MS", "GS"] },
  { title: "Primaire", levels: ["CP", "CE1", "CE2", "CM1", "CM2", "CE6"] }
];

export const allLevels = levelGroups.flatMap((group) => group.levels);
export const semesters: Semester[] = ["Premier semestre", "Deuxième semestre"];
export const subjects: Subject[] = ["Français", "Arabe", "Mathématiques", "Activité scientifique", "Éducation islamique"];

export const registrationLevels = [
  "CP",
  "CE1",
  "CE2",
  "CM1",
  "CM2",
  "6ème",
  "1AC",
  "2AC",
  "3AC",
  "Tronc commun",
  "1ère Bac",
  "2ème Bac"
];

export const registrationSubjects = [
  "Mathématiques",
  "Français",
  "Arabe",
  "Anglais",
  "Sciences",
  "Physique-Chimie",
  "SVT",
  "Histoire-Géographie",
  "Informatique"
];
