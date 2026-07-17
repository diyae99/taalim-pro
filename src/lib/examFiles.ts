const DATABASE_NAME = "taalimpro_exam_files";
const STORE_NAME = "pdfs";
const DATABASE_VERSION = 1;

const openDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
      request.result.createObjectStore(STORE_NAME);
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error("Impossible d'ouvrir le stockage des fichiers."));
});

const runRequest = async <T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) => {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const request = action(transaction.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("L'opération sur le fichier a échoué."));
      transaction.onabort = () => reject(transaction.error ?? new Error("L'opération sur le fichier a été annulée."));
    });
  } finally {
    database.close();
  }
};

export const saveExamFile = (path: string, file: File) => runRequest("readwrite", (store) => store.put(file, path));
export const getExamFile = (path: string) => runRequest<Blob | undefined>("readonly", (store) => store.get(path));
export const deleteExamFile = (path: string) => runRequest("readwrite", (store) => store.delete(path));

export const sanitizeFileName = (fileName: string) => {
  const baseName = fileName.replace(/\.pdf$/i, "");
  const safeName = baseName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${safeName || "examen"}.pdf`;
};

export const createExamFilePath = (examId: string, fileName: string) =>
  `exams/${examId}/${Date.now()}-${sanitizeFileName(fileName)}`;

export const downloadExamFile = async (path: string, fileName: string) => {
  const file = await getExamFile(path);
  if (!file) throw new Error("Le fichier PDF est introuvable.");
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
};
