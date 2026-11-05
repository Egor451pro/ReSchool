export const documentTypes = [
  "TRANSFER_ACT",
  "RETURN_ACT",
  "WRITE_OFF_DRAFT",
  "PAYOUT_ACT",
] as const;
export type DocumentType = (typeof documentTypes)[number];

export const DRAFT_WATERMARK =
  "ЧЕРНОВИК. Не заменяет решение комиссии по списанию.";

export type TransferActPayload = {
  watermark: string;
  title: string;
  quantity: number;
  materialsKop: number;
  transportKop: number;
  fromName: string;
  toName: string;
  synthetic: boolean;
};

export type WriteOffPayload = {
  watermark: string;
  title: string;
  reason: string;
  synthetic: boolean;
};

export type ActPayload = TransferActPayload | WriteOffPayload;

export type ActRenderInput = {
  number: string;
  type: DocumentType;
  createdAtIso: string;
  payload: ActPayload;
};
