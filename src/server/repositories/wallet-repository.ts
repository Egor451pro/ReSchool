import "server-only";

import type { Prisma, WalletTxnKind } from "@prisma/client";
import { prisma } from "@/server/db";

export async function getOrCreateWallet(
  userId: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  const existing = await tx.wallet.findUnique({
    where: { userId },
    select: { id: true, userId: true, balanceKop: true },
  });
  if (existing) return existing;
  return tx.wallet.create({
    data: { userId, balanceKop: 0 },
    select: { id: true, userId: true, balanceKop: true },
  });
}

export async function creditWallet(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    kind: WalletTxnKind;
    amountKop: number;
    orderId?: string | null;
    note?: string;
  },
) {
  if (input.amountKop <= 0) {
    throw new Error("Сумма начисления должна быть положительной");
  }
  const wallet = await getOrCreateWallet(input.userId, tx);
  const updated = await tx.wallet.update({
    where: { id: wallet.id },
    data: { balanceKop: { increment: input.amountKop } },
    select: { id: true, balanceKop: true },
  });
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      kind: input.kind,
      amountKop: input.amountKop,
      orderId: input.orderId ?? null,
      note: input.note ?? "",
    },
  });
  return updated;
}

export function findWalletByUserId(userId: string) {
  return prisma.wallet.findUnique({
    where: { userId },
    select: {
      id: true,
      balanceKop: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          kind: true,
          amountKop: true,
          note: true,
          orderId: true,
          createdAt: true,
        },
      },
    },
  });
}
