const cities = ["Tanger", "Tétouan", "Casablanca", "Rabat", "Kénitra", "Fès", "Marrakech", "Agadir"];
const levels = ["CP", "CE1", "CE2", "CM1", "CM2", "6ème", "1AC", "2AC", "3AC", "Tronc commun", "1ère Bac", "2ème Bac"];
const subjects = ["Mathématiques", "Français", "Arabe", "Anglais", "Sciences", "Physique-Chimie", "SVT", "Histoire-Géographie", "Informatique"];

export const createRunId = () => new Date().toISOString().replace(/\D/g, "").slice(0, 14);

export const generateUsers = (runId, domain, count = 100) => Array.from({ length: count }, (_, offset) => {
  const index = offset + 1;
  const serial = String(index).padStart(3, "0");
  return {
    index,
    fullName: `Compte Test Charge ${serial}`,
    email: `taalimloadtest${runId.slice(0, 8)}-${serial}@${domain}`,
    phone: `06${String(10000000 + index).slice(-8)}`,
    city: cities[offset % cities.length],
    schoolName: `Établissement Test ${String((offset % 20) + 1).padStart(2, "0")}`,
    schoolLevel: levels[offset % levels.length],
    schoolSubject: subjects[offset % subjects.length],
    password: `Tp!${runId}Aa${serial}#`,
    logoType: index <= 70 ? null : index <= 90 ? "image/jpeg" : "image/png",
  };
});

export const publicUser = ({ password: _password, ...user }) => user;
