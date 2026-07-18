import type { Exam } from "../types";

const now = new Date().toISOString();

export const sampleExams: Exam[] = [
  {
    id: "exam-1",
    title: "Évaluation de mathématiques CP",
    level: "CP",
    semester: "Premier semestre",
    subject: "Mathématiques",
    type: "Contrôle continu",
    duration: "45 min",
    bareme: "20 points",
    content: "1. Complète la suite : 2, 4, 6, __, __.\n2. Calcule : 7 + 5 = __ ; 12 - 4 = __.\n3. Dessine 3 groupes de 4 étoiles puis écris le total.\n4. Compare avec <, > ou = : 9 __ 6 ; 10 __ 10.",
    correction: "8, 10. 12 et 8. 12 étoiles. 9 > 6 ; 10 = 10.",
    active: true,
    createdAt: now
  },
  {
    id: "exam-2",
    title: "Évaluation de français CP",
    level: "CP",
    semester: "Premier semestre",
    subject: "Français",
    type: "Lecture et langue",
    duration: "40 min",
    bareme: "20 points",
    content: "Lis le texte court : Lina va à l'école avec Sami.\n1. Entoure les mots avec le son [a].\n2. Recopie la phrase : Lina lit.\n3. Remets les mots en ordre : école / à / va / Sami.\n4. Écris deux mots qui commencent par la lettre M.",
    correction: "Lina, va, avec, Sami. Sami va à l'école. Réponses libres correctes.",
    active: true,
    createdAt: now
  },
  {
    id: "exam-3",
    title: "Contrôle de mathématiques CE1",
    level: "CE1",
    semester: "Premier semestre",
    subject: "Mathématiques",
    type: "Contrôle",
    duration: "50 min",
    bareme: "20 points",
    content: "1. Pose et calcule : 34 + 27 ; 58 - 19.\n2. Range les nombres du plus petit au plus grand : 42, 24, 60, 36.\n3. Un cahier coûte 6 dh. Combien coûtent 4 cahiers ?\n4. Trace un rectangle et nomme ses sommets.",
    correction: "61 ; 39. 24, 36, 42, 60. 24 dh. Rectangle correctement tracé.",
    active: true,
    createdAt: now
  },
  {
    id: "exam-4",
    title: "Bilan de français CE1",
    level: "CE1",
    semester: "Deuxième semestre",
    subject: "Français",
    type: "Bilan",
    duration: "55 min",
    bareme: "20 points",
    content: "Lis le paragraphe sur le printemps.\n1. Réponds : quelle saison est décrite ?\n2. Souligne le verbe dans : Les fleurs poussent.\n3. Transforme au pluriel : un joli jardin.\n4. Écris trois phrases sur ton école.",
    correction: "Le printemps. Verbe : poussent. De jolis jardins. Production selon critères.",
    active: true,
    createdAt: now
  },
  {
    id: "exam-5",
    title: "فرض في اللغة العربية CE2",
    level: "CE2",
    semester: "Premier semestre",
    subject: "Arabe",
    type: "فرض كتابي",
    duration: "45 min",
    bareme: "20 points",
    content: "اقرأ النص ثم أجب:\n1. استخرج من النص اسما وفعلا.\n2. رتب الكلمات لتكوين جملة مفيدة.\n3. اكتب ضد كلمة: كبير.\n4. اكتب فقرة قصيرة عن المدرسة.",
    correction: "تقبل الإجابات الصحيحة حسب النص. ضد كبير: صغير.",
    active: true,
    createdAt: now
  },
  {
    id: "exam-6",
    title: "Évaluation d'activité scientifique CM1",
    level: "CM1",
    semester: "Deuxième semestre",
    subject: "Activité scientifique",
    type: "Évaluation",
    duration: "60 min",
    bareme: "20 points",
    content: "1. Cite trois besoins essentiels d'une plante.\n2. Explique le rôle des racines.\n3. Complète : l'eau passe de l'état liquide à l'état gazeux par ____.\n4. Classe : verre, bois, fer selon leur matière.",
    correction: "Eau, lumière, air/sol. Absorber l'eau et fixer la plante. Évaporation. Classement correct.",
    active: true,
    createdAt: now
  },
  {
    id: "exam-7",
    title: "Bilan de mathématiques CM2",
    level: "CM2",
    semester: "Deuxième semestre",
    subject: "Mathématiques",
    type: "Bilan semestriel",
    duration: "75 min",
    bareme: "20 points",
    content: "1. Calcule : 245 x 13 ; 864 ÷ 6.\n2. Convertis : 3,5 m = __ cm ; 2 kg = __ g.\n3. Résous : une classe achète 18 livres à 35 dh chacun.\n4. Construis un triangle isocèle ABC.",
    correction: "3185 ; 144. 350 cm ; 2000 g. 630 dh. Construction conforme.",
    active: true,
    createdAt: now
  },
  {
    id: "exam-8",
    title: "Épreuve de français CE6",
    level: "CE6",
    semester: "Premier semestre",
    subject: "Français",
    type: "Examen blanc",
    duration: "90 min",
    bareme: "20 points",
    content: "Texte : un élève prépare un exposé sur l'eau.\n1. Donne un titre au texte.\n2. Relève deux informations importantes.\n3. Conjugue au présent : nous (choisir), ils (finir).\n4. Rédige un court texte argumentatif sur l'économie de l'eau.",
    correction: "Titre pertinent. Informations du texte. Nous choisissons, ils finissent. Production évaluée selon grille.",
    active: true,
    createdAt: now
  }
];
