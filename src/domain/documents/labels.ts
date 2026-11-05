import type { DocumentType } from "./types";

export const documentTypeLabels: Record<DocumentType, string> = {
  TRANSFER_ACT: "Акт передачи",
  RETURN_ACT: "Акт возврата",
  WRITE_OFF_DRAFT: "Черновик акта списания",
  PAYOUT_ACT: "Акт выплаты",
};
