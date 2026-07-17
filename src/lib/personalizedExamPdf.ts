import type { PDFImage } from "pdf-lib";

export type PersonalizedExamHeaderData = {
  schoolName: string;
  schoolSubtitle?: string;
  academicYear?: string;
  teacherName: string;
  supervisorName?: string;
  level?: string;
  group?: string;
  logoBytes?: ArrayBuffer;
  logoMimeType?: "image/png" | "image/jpeg";
};

export type HeaderReplacementOptions = {
  replaceLegacyHeader: boolean;
  headerHeightRatio: number;
  applyHeaderToAllPages: boolean;
};

const truncate = (text: string, maxLength: number) => text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;

export const generatePersonalizedExamPdf = async (
  originalPdf: Blob,
  header: PersonalizedExamHeaderData,
  options: HeaderReplacementOptions
) => {
  try {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const document = await PDFDocument.load(await originalPdf.arrayBuffer());
    const regularFont = await document.embedFont(StandardFonts.Helvetica);
    const boldFont = await document.embedFont(StandardFonts.HelveticaBold);
    let logo: PDFImage | undefined;

    if (header.logoBytes && header.logoMimeType) {
      logo = header.logoMimeType === "image/png"
        ? await document.embedPng(header.logoBytes)
        : await document.embedJpg(header.logoBytes);
    }

    const pages = options.applyHeaderToAllPages ? document.getPages() : document.getPages().slice(0, 1);
    if (options.replaceLegacyHeader) {
      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const headerHeight = height * Math.min(0.2, Math.max(0.08, options.headerHeightRatio));
        const x = 14;
        const y = height - headerHeight + 4;
        const boxWidth = width - 28;
        const boxHeight = headerHeight - 8;
        const leftWidth = boxWidth * 0.41;
        const centerWidth = boxWidth * 0.18;
        const rightWidth = boxWidth - leftWidth - centerWidth;
        const padding = 7;

        page.drawRectangle({ x: 0, y: height - headerHeight, width, height: headerHeight, color: rgb(1, 1, 1) });
        page.drawRectangle({ x, y, width: boxWidth, height: boxHeight, borderColor: rgb(0.12, 0.18, 0.25), borderWidth: 0.8, color: rgb(1, 1, 1) });
        page.drawLine({ start: { x: x + leftWidth, y }, end: { x: x + leftWidth, y: y + boxHeight }, thickness: 0.65, color: rgb(0.12, 0.18, 0.25) });
        page.drawLine({ start: { x: x + leftWidth + centerWidth, y }, end: { x: x + leftWidth + centerWidth, y: y + boxHeight }, thickness: 0.65, color: rgb(0.12, 0.18, 0.25) });

        let leftY = y + boxHeight - 14;
        const drawLeft = (label: string, value: string | undefined) => {
          if (!value) return;
          page.drawText(label, { x: x + padding, y: leftY, size: 6.8, font: boldFont, color: rgb(0.1, 0.12, 0.16) });
          const labelWidth = boldFont.widthOfTextAtSize(label, 6.8);
          page.drawText(truncate(value, 35), { x: x + padding + labelWidth + 2, y: leftY, size: 6.8, font: regularFont, color: rgb(0.1, 0.12, 0.16) });
          leftY -= 11;
        };
        page.drawText(truncate(header.schoolName, 38), { x: x + padding, y: leftY, size: 9, font: boldFont, color: rgb(0.05, 0.22, 0.35) });
        leftY -= 11;
        if (header.schoolSubtitle) {
          page.drawText(truncate(header.schoolSubtitle, 42), { x: x + padding, y: leftY, size: 6.2, font: regularFont, color: rgb(0.25, 0.28, 0.32) });
          leftY -= 10;
        }
        drawLeft("Année scolaire :", header.academicYear);
        drawLeft("Professeur :", header.teacherName);
        drawLeft("Surveillant :", header.supervisorName);

        const centerX = x + leftWidth;
        if (logo) {
          const dimensions = logo.scale(1);
          const maxWidth = centerWidth - padding * 2;
          const maxHeight = boxHeight - padding * 2;
          const scale = Math.min(maxWidth / dimensions.width, maxHeight / dimensions.height, 1);
          const logoWidth = dimensions.width * scale;
          const logoHeight = dimensions.height * scale;
          page.drawImage(logo, { x: centerX + (centerWidth - logoWidth) / 2, y: y + (boxHeight - logoHeight) / 2, width: logoWidth, height: logoHeight });
        } else {
          const initials = header.schoolName.split(/\s+/).filter(Boolean).slice(0, 3).map((part) => part[0]?.toUpperCase()).join("");
          const initialsWidth = boldFont.widthOfTextAtSize(initials, 15);
          page.drawText(initials, { x: centerX + (centerWidth - initialsWidth) / 2, y: y + boxHeight / 2 - 5, size: 15, font: boldFont, color: rgb(0.18, 0.42, 0.52) });
        }

        const rightX = x + leftWidth + centerWidth + padding;
        let rightY = y + boxHeight - 15;
        const drawRight = (label: string, value: string) => {
          page.drawText(label, { x: rightX, y: rightY, size: 7.2, font: boldFont, color: rgb(0.1, 0.12, 0.16) });
          const labelWidth = boldFont.widthOfTextAtSize(label, 7.2);
          page.drawText(truncate(value, 24), { x: rightX + labelWidth + 2, y: rightY, size: 7.2, font: regularFont, color: rgb(0.1, 0.12, 0.16) });
          rightY -= 13;
        };
        drawRight("Niveau :", header.level || "");
        drawRight("Nom :", "................................");
        drawRight("Prénom :", "...........................");
        drawRight("Groupe :", header.group || "........................");
        void rightWidth;
      });
    }

    const bytes = await document.save();
    return new Blob([bytes as BlobPart], { type: "application/pdf" });
  } catch (error) {
    if (error instanceof Error && /png|jpeg|jpg|image/i.test(error.message)) {
      throw new Error("Impossible de générer l'en-tête personnalisé.");
    }
    throw new Error("Une erreur est survenue pendant la génération du PDF.");
  }
};

export const sanitizePdfFilename = (...parts: string[]) => {
  const name = parts.join("-").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return `${name || "examen-personnalise"}.pdf`;
};

export const downloadPersonalizedExamPdf = (pdf: Blob, fileName: string) => {
  const url = URL.createObjectURL(pdf);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const createPersonalizedExamPreviewUrl = (pdf: Blob) => URL.createObjectURL(pdf);
