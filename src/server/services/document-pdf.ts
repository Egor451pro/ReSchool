import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { documentTypeLabels, type ActRenderInput, type TransferActPayload } from "@/domain/documents";
import { formatByn } from "@/domain/economy/money";
import { parseDocumentPayload } from "@/lib/validators/document";

const FONT_DIR = path.join(process.cwd(), "src", "server", "assets", "fonts");

function isTransferPayload(payload: ActRenderInput["payload"]): payload is TransferActPayload {
  return "quantity" in payload && "materialsKop" in payload;
}

function wrapLines(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function drawWrapped(
  page: PDFPage,
  font: PDFFont,
  text: string,
  opts: { x: number; y: number; size: number; maxWidth: number; color?: ReturnType<typeof rgb> },
): number {
  const lines = wrapLines(font, text, opts.size, opts.maxWidth);
  let y = opts.y;
  for (const line of lines) {
    page.drawText(line, {
      x: opts.x,
      y,
      size: opts.size,
      font,
      color: opts.color ?? rgb(0.09, 0.29, 0.25),
    });
    y -= opts.size + 4;
  }
  return y;
}

export async function renderActPdf(input: {
  number: string;
  type: ActRenderInput["type"];
  createdAt: Date;
  payloadRaw: string;
}): Promise<Uint8Array> {
  const payload = parseDocumentPayload(input.payloadRaw);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const [regularBytes, boldBytes] = await Promise.all([
    readFile(path.join(FONT_DIR, "OpenSans-Regular.ttf")),
    readFile(path.join(FONT_DIR, "OpenSans-Bold.ttf")),
  ]);
  const regular = await pdf.embedFont(regularBytes);
  const bold = await pdf.embedFont(boldBytes);

  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 48;
  const maxWidth = width - margin * 2;
  let y = height - margin;

  page.drawRectangle({
    x: margin,
    y: height - margin - 36,
    width: maxWidth,
    height: 36,
    color: rgb(0.99, 0.7, 0.29),
  });
  page.drawText("ЧЕРНОВИК", {
    x: margin + 12,
    y: height - margin - 24,
    size: 16,
    font: bold,
    color: rgb(0.09, 0.29, 0.25),
  });

  y = height - margin - 64;
  y = drawWrapped(page, bold, documentTypeLabels[input.type], {
    x: margin,
    y,
    size: 18,
    maxWidth,
  });
  y -= 8;
  y = drawWrapped(page, regular, `№ ${input.number}`, {
    x: margin,
    y,
    size: 12,
    maxWidth,
  });
  y = drawWrapped(
    page,
    regular,
    `Дата снимка реквизитов: ${input.createdAt.toLocaleString("ru-BY", {
      timeZone: "Europe/Minsk",
    })}`,
    { x: margin, y, size: 11, maxWidth },
  );
  y -= 12;

  y = drawWrapped(page, regular, payload.watermark, {
    x: margin,
    y,
    size: 10,
    maxWidth,
    color: rgb(0.3, 0.47, 0.31),
  });
  y -= 16;

  y = drawWrapped(page, bold, "Предмет", { x: margin, y, size: 12, maxWidth });
  y = drawWrapped(page, regular, payload.title, { x: margin, y, size: 12, maxWidth });
  y -= 10;

  if (isTransferPayload(payload)) {
    y = drawWrapped(page, bold, "Откуда", { x: margin, y, size: 12, maxWidth });
    y = drawWrapped(page, regular, payload.fromName, { x: margin, y, size: 11, maxWidth });
    y -= 6;
    y = drawWrapped(page, bold, "Куда", { x: margin, y, size: 12, maxWidth });
    y = drawWrapped(page, regular, payload.toName, { x: margin, y, size: 11, maxWidth });
    y -= 6;
    y = drawWrapped(page, regular, `Количество: ${payload.quantity} шт.`, {
      x: margin,
      y,
      size: 11,
      maxWidth,
    });
    y = drawWrapped(page, regular, `Материалы ремонта: ${formatByn(payload.materialsKop)}`, {
      x: margin,
      y,
      size: 11,
      maxWidth,
    });
    y = drawWrapped(page, regular, `Транспорт: ${formatByn(payload.transportKop)}`, {
      x: margin,
      y,
      size: 11,
      maxWidth,
    });
  } else {
    y = drawWrapped(page, bold, "Основание", { x: margin, y, size: 12, maxWidth });
    y = drawWrapped(page, regular, payload.reason, { x: margin, y, size: 11, maxWidth });
  }

  y -= 24;
  y = drawWrapped(
    page,
    regular,
    "Документ сформирован платформой ReSchool как черновик для внутреннего учёта пилота. PDF рисуется из JSON-снимка реквизитов и не является юридически значимым актом.",
    { x: margin, y, size: 9, maxWidth, color: rgb(0.3, 0.47, 0.31) },
  );

  if (payload.synthetic) {
    y -= 8;
    drawWrapped(page, regular, "Синтетические демо-данные.", {
      x: margin,
      y,
      size: 9,
      maxWidth,
      color: rgb(0.3, 0.47, 0.31),
    });
  }

  return pdf.save();
}
