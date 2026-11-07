import "server-only";

import type { DisposalMode, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

const pointSelect = {
  id: true,
  name: true,
  address: true,
  lat: true,
  lng: true,
  phone: true,
  hours: true,
  acceptsCategories: true,
} satisfies Prisma.RecyclingPointSelect;

const jobSelect = {
  id: true,
  itemId: true,
  pointId: true,
  mode: true,
  status: true,
  feeKop: true,
  freelancerId: true,
  note: true,
  deliveredAt: true,
  confirmedAt: true,
  point: { select: pointSelect },
  freelancer: { select: { id: true, fullName: true } },
} satisfies Prisma.DisposalJobSelect;

export function listRecyclingPoints() {
  return prisma.recyclingPoint.findMany({
    orderBy: { name: "asc" },
    select: pointSelect,
  });
}

export function findDisposalJobByItemId(itemId: string) {
  return prisma.disposalJob.findUnique({
    where: { itemId },
    select: jobSelect,
  });
}

export function listDisposalJobsForFreelancer(freelancerId: string) {
  return prisma.disposalJob.findMany({
    where: {
      freelancerId,
      mode: "FREELANCER",
      status: "PENDING",
    },
    orderBy: { updatedAt: "desc" },
    select: {
      ...jobSelect,
      item: {
        select: {
          id: true,
          title: true,
          status: true,
          institution: { select: { name: true, address: true } },
        },
      },
    },
  });
}

export function countDisposedItems(district?: string) {
  return prisma.item.count({
    where: {
      status: "DISPOSED",
      ...(district ? { institution: { district } } : {}),
    },
  });
}

/** Подтверждённые сдачи фрилансером — плата школы за утиль. */
export function listInstitutionDisposalExpenses(
  institutionId: string,
  options?: { take?: number },
) {
  return prisma.disposalJob.findMany({
    where: {
      mode: "FREELANCER",
      status: "CONFIRMED",
      feeKop: { gt: 0 },
      item: { institutionId },
    },
    orderBy: [{ confirmedAt: "desc" }, { updatedAt: "desc" }],
    take: Math.min(Math.max(options?.take ?? 200, 1), 500),
    select: {
      id: true,
      feeKop: true,
      confirmedAt: true,
      updatedAt: true,
      freelancer: { select: { fullName: true } },
      item: {
        select: {
          id: true,
          title: true,
          quantity: true,
          newUnitPriceKop: true,
        },
      },
    },
  });
}

export async function chooseDisposalMode(input: {
  itemId: string;
  mode: DisposalMode;
  pointId: string;
  feeKop: number;
  freelancerId: string | null;
  actorId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({
      where: { id: input.itemId },
      select: { id: true, status: true },
    });
    if (!item || item.status !== "DISPOSAL_PENDING") {
      return { ok: false as const, error: "Предмет не ждёт сдачи в утиль" };
    }

    const point = await tx.recyclingPoint.findUnique({
      where: { id: input.pointId },
      select: { id: true },
    });
    if (!point) return { ok: false as const, error: "Пункт приёма не найден" };

    const job = await tx.disposalJob.findUnique({ where: { itemId: input.itemId } });
    if (!job) return { ok: false as const, error: "Заявка на утиль не найдена" };
    if (job.status !== "PENDING") {
      return { ok: false as const, error: "Способ сдачи уже выбран" };
    }

    await tx.disposalJob.update({
      where: { id: job.id },
      data: {
        mode: input.mode,
        pointId: input.pointId,
        feeKop: input.mode === "FREELANCER" ? input.feeKop : 0,
        freelancerId: input.mode === "FREELANCER" ? input.freelancerId : null,
        note:
          input.mode === "SELF"
            ? "Завхоз сдаёт сам"
            : "Поручено фрилансеру за отдельную плату",
      },
    });

    await tx.statusEvent.create({
      data: {
        itemId: input.itemId,
        fromStatus: "DISPOSAL_PENDING",
        toStatus: "DISPOSAL_PENDING",
        actorId: input.actorId,
        comment:
          input.mode === "SELF"
            ? "Выбран способ: сдать самостоятельно"
            : `Выбран способ: поручить фрилансеру за ${(input.feeKop / 100).toFixed(2)} BYN`,
      },
    });

    return { ok: true as const };
  });
}

export async function markDisposalDelivered(input: {
  itemId: string;
  actorId: string;
  asFreelancer: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.disposalJob.findUnique({
      where: { itemId: input.itemId },
      include: { item: { select: { status: true } } },
    });
    if (!job || job.item.status !== "DISPOSAL_PENDING") {
      return { ok: false as const, error: "Заявка на утиль не найдена" };
    }
    if (!job.pointId) {
      return { ok: false as const, error: "Сначала выберите пункт приёма" };
    }
    if (job.status !== "PENDING") {
      return { ok: false as const, error: "Уже отмечено как сданное" };
    }
    if (input.asFreelancer) {
      if (job.mode !== "FREELANCER" || job.freelancerId !== input.actorId) {
        return { ok: false as const, error: "Это не ваша заявка на сдачу" };
      }
    } else if (job.mode !== "SELF") {
      return { ok: false as const, error: "Сдачу отмечает фрилансер" };
    }

    // Фрилансер сам сдал — сразу закрываем утиль и начисляем плату, без ожидания завхоза.
    if (input.asFreelancer) {
      const now = new Date();
      const itemUpdate = await tx.item.updateMany({
        where: { id: input.itemId, status: "DISPOSAL_PENDING" },
        data: { status: "DISPOSED", closeReason: "UNREPAIRABLE" },
      });
      if (itemUpdate.count !== 1) {
        return { ok: false as const, error: "Статус предмета уже изменился" };
      }

      await tx.disposalJob.update({
        where: { id: job.id },
        data: { status: "CONFIRMED", deliveredAt: now, confirmedAt: now },
      });

      if (job.freelancerId && job.feeKop > 0) {
        const wallet = await tx.wallet.upsert({
          where: { userId: job.freelancerId },
          create: { userId: job.freelancerId, balanceKop: job.feeKop },
          update: { balanceKop: { increment: job.feeKop } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            kind: "DISPOSAL_FEE",
            amountKop: job.feeKop,
            note: "Плата за сдачу в пункт приёма",
          },
        });
      }

      await tx.statusEvent.create({
        data: {
          itemId: input.itemId,
          fromStatus: "DISPOSAL_PENDING",
          toStatus: "DISPOSED",
          actorId: input.actorId,
          comment: "Фрилансер сдал вещь в пункт приёма — утиль закрыт",
        },
      });

      return { ok: true as const };
    }

    await tx.disposalJob.update({
      where: { id: job.id },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });

    await tx.statusEvent.create({
      data: {
        itemId: input.itemId,
        fromStatus: "DISPOSAL_PENDING",
        toStatus: "DISPOSAL_PENDING",
        actorId: input.actorId,
        comment: "Вещь сдана в пункт приёма, ждём подтверждения завхоза",
      },
    });

    return { ok: true as const };
  });
}

export async function confirmDisposal(input: {
  itemId: string;
  actorId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.disposalJob.findUnique({
      where: { itemId: input.itemId },
      include: { item: { select: { status: true } } },
    });
    if (!job || job.item.status !== "DISPOSAL_PENDING") {
      return { ok: false as const, error: "Заявка на утиль не найдена" };
    }
    if (job.status !== "DELIVERED" && !(job.mode === "SELF" && job.status === "PENDING" && job.pointId)) {
      return { ok: false as const, error: "Сначала отметьте сдачу в пункт" };
    }

    const itemUpdate = await tx.item.updateMany({
      where: { id: input.itemId, status: "DISPOSAL_PENDING" },
      data: { status: "DISPOSED", closeReason: "UNREPAIRABLE" },
    });
    if (itemUpdate.count !== 1) {
      return { ok: false as const, error: "Статус предмета уже изменился" };
    }

    await tx.disposalJob.update({
      where: { id: job.id },
      data: {
        status: "CONFIRMED",
        deliveredAt: job.deliveredAt ?? new Date(),
        confirmedAt: new Date(),
      },
    });

    if (job.mode === "FREELANCER" && job.freelancerId && job.feeKop > 0) {
      const wallet = await tx.wallet.upsert({
        where: { userId: job.freelancerId },
        create: { userId: job.freelancerId, balanceKop: job.feeKop },
        update: { balanceKop: { increment: job.feeKop } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          kind: "DISPOSAL_FEE",
          amountKop: job.feeKop,
          note: "Плата за сдачу в пункт приёма",
        },
      });
    }

    await tx.statusEvent.create({
      data: {
        itemId: input.itemId,
        fromStatus: "DISPOSAL_PENDING",
        toStatus: "DISPOSED",
        actorId: input.actorId,
        comment: "Сдача в пункт приёма подтверждена",
      },
    });

    return { ok: true as const };
  });
}
