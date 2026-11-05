import { DRAFT_WATERMARK, type TransferActPayload, type WriteOffPayload } from "./types";

export function formatActNumber(serial: number, year = 2026): string {
  if (!Number.isInteger(serial) || serial < 1) {
    throw new Error("Номер акта — целое число от 1");
  }
  return `РС-${year}-${String(serial).padStart(4, "0")}`;
}

export function parseActSerial(number: string, year = 2026): number | null {
  const match = new RegExp(`^РС-${year}-(\\d{4})$`).exec(number);
  if (!match) return null;
  return Number(match[1]);
}

export function buildTransferActPayload(input: {
  title: string;
  quantity: number;
  materialsKop: number;
  transportKop: number;
  fromName: string;
  toName: string;
  synthetic?: boolean;
}): TransferActPayload {
  if (!input.title.trim()) throw new Error("Название предмета обязательно");
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new Error("Количество должно быть целым и положительным");
  }
  if (!Number.isInteger(input.materialsKop) || input.materialsKop < 0) {
    throw new Error("Материалы — целые копейки");
  }
  if (!Number.isInteger(input.transportKop) || input.transportKop < 0) {
    throw new Error("Транспорт — целые копейки");
  }

  return {
    watermark: DRAFT_WATERMARK,
    title: input.title.trim(),
    quantity: input.quantity,
    materialsKop: input.materialsKop,
    transportKop: input.transportKop,
    fromName: input.fromName.trim(),
    toName: input.toName.trim(),
    synthetic: input.synthetic ?? false,
  };
}

export function buildWriteOffPayload(input: {
  title: string;
  reason?: string;
  synthetic?: boolean;
}): WriteOffPayload {
  if (!input.title.trim()) throw new Error("Название предмета обязательно");
  return {
    watermark: DRAFT_WATERMARK,
    title: input.title.trim(),
    reason: (input.reason ?? "Ремонт в рамках практики признан нецелесообразным.").trim(),
    synthetic: input.synthetic ?? false,
  };
}

export function isReturnAct(fromInstitutionId: string, toInstitutionId: string): boolean {
  return fromInstitutionId === toInstitutionId;
}
