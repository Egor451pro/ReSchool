import { formatByn } from "@/domain/economy/money";

export type PriceOfferSide = "SCHOOL" | "FREELANCER";

/** Маркер системных сообщений о цене в чате заказа. */
export const PRICE_CHAT_MARKER = "⟦цена⟧";

export function maxRepairFeeKop(input: {
  repairBudgetKop: number;
  newUnitPriceKop: number;
  quantity: number;
}): number {
  return Math.max(input.repairBudgetKop, input.newUnitPriceKop * input.quantity);
}

export function assertOfferAmountKop(
  amountKop: number,
  ceiling: number,
): void {
  if (!Number.isInteger(amountKop) || amountKop <= 0) {
    throw new Error("Укажите цену больше нуля");
  }
  if (amountKop > ceiling) {
    throw new Error("Цена ремонта не может быть выше стоимости новых вещей");
  }
}

export function canNegotiatePrice(input: {
  orderStatus: string;
  schoolAcceptedAt: Date | string | null;
}): boolean {
  return input.orderStatus === "ASSIGNED" && !input.schoolAcceptedAt;
}

export function canProposePrice(input: {
  role: string;
  isMaster: boolean;
  isSchoolStaff: boolean;
  orderStatus: string;
  schoolAcceptedAt: Date | string | null;
}): boolean {
  if (!canNegotiatePrice(input)) return false;
  if (input.role === "PLATFORM_ADMIN") return true;
  if (input.role === "FREELANCER") return input.isMaster;
  if (input.role === "DONOR_STAFF") return input.isSchoolStaff;
  return false;
}

export function canConfirmPrice(input: {
  role: string;
  isSchoolStaff: boolean;
  orderStatus: string;
  schoolAcceptedAt: Date | string | null;
  openOfferKop: number;
}): boolean {
  if (!canNegotiatePrice(input)) return false;
  if (!Number.isInteger(input.openOfferKop) || input.openOfferKop <= 0) return false;
  if (input.role === "PLATFORM_ADMIN") return true;
  return input.role === "DONOR_STAFF" && input.isSchoolStaff;
}

export function sideLabel(side: PriceOfferSide): string {
  return side === "SCHOOL" ? "Завхоз" : "Фрилансер";
}

export function priceOfferChatBody(side: PriceOfferSide, amountKop: number): string {
  return `${PRICE_CHAT_MARKER} ${sideLabel(side)} предложил ${formatByn(amountKop)}`;
}

export function priceAcceptedChatBody(amountKop: number): string {
  return `${PRICE_CHAT_MARKER} Завхоз подтвердил цену ${formatByn(amountKop)} — ремонт в работе`;
}

export function isPriceSystemMessage(body: string): boolean {
  return body.startsWith(PRICE_CHAT_MARKER);
}

export function stripPriceMarker(body: string): string {
  if (!isPriceSystemMessage(body)) return body;
  return body.slice(PRICE_CHAT_MARKER.length).trimStart();
}
