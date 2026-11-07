import "server-only";

import { parseBynToKop } from "@/domain/economy/money";
import { canManageDisposal, type ItemActor } from "@/domain/items/access";
import {
  chooseDisposalMode,
  confirmDisposal,
  findDisposalJobByItemId,
  listDisposalJobsForFreelancer,
  listRecyclingPoints,
  markDisposalDelivered,
} from "@/server/repositories/disposal-repository";
import { findItemCard } from "@/server/repositories/item-repository";
import { prisma } from "@/server/db";

export type DisposalResult = { ok: true } | { ok: false; error: string };

export async function loadRecyclingPointsForItem(categorySlug: string) {
  const points = await listRecyclingPoints();
  return points.filter(
    (point) =>
      point.acceptsCategories.length === 0 ||
      point.acceptsCategories.includes(categorySlug) ||
      point.acceptsCategories.includes("other"),
  );
}

export async function startDisposalSelf(
  actor: ItemActor,
  input: { itemId: string; pointId: string },
): Promise<DisposalResult> {
  const item = await findItemCard(input.itemId);
  if (!item) return { ok: false, error: "Предмет не найден" };
  if (!canManageDisposal(actor, item)) {
    return { ok: false, error: "Сдачу выбирает завхоз своей школы" };
  }

  return chooseDisposalMode({
    itemId: input.itemId,
    mode: "SELF",
    pointId: input.pointId,
    feeKop: 0,
    freelancerId: null,
    actorId: actor.id,
  });
}

export async function startDisposalFreelancer(
  actor: ItemActor,
  input: { itemId: string; pointId: string; feeByn: string },
): Promise<DisposalResult> {
  const item = await findItemCard(input.itemId);
  if (!item) return { ok: false, error: "Предмет не найден" };
  if (!canManageDisposal(actor, item)) {
    return { ok: false, error: "Сдачу выбирает завхоз своей школы" };
  }

  const lastOrder = await prisma.repairOrder.findFirst({
    where: { itemId: input.itemId },
    orderBy: { createdAt: "desc" },
    select: { masterId: true },
  });
  const freelancerId = lastOrder?.masterId ?? null;
  if (!freelancerId) {
    return { ok: false, error: "Нет фрилансера по этому предмету" };
  }

  let feeKop = 0;
  try {
    feeKop = parseBynToKop(input.feeByn);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Укажите плату в BYN",
    };
  }
  if (feeKop <= 0) return { ok: false, error: "Плата за сдачу должна быть больше нуля" };

  return chooseDisposalMode({
    itemId: input.itemId,
    mode: "FREELANCER",
    pointId: input.pointId,
    feeKop,
    freelancerId,
    actorId: actor.id,
  });
}

export async function markItemDisposedBySchool(
  actor: ItemActor,
  itemId: string,
): Promise<DisposalResult> {
  const item = await findItemCard(itemId);
  if (!item) return { ok: false, error: "Предмет не найден" };
  if (!canManageDisposal(actor, item)) {
    return { ok: false, error: "Подтверждает завхоз своей школы" };
  }

  const job = await findDisposalJobByItemId(itemId);
  if (!job) return { ok: false, error: "Заявка на утиль не найдена" };

  if (job.mode === "SELF" && job.status === "PENDING" && job.pointId) {
    const delivered = await markDisposalDelivered({
      itemId,
      actorId: actor.id,
      asFreelancer: false,
    });
    if (!delivered.ok) return delivered;
  }

  return confirmDisposal({ itemId, actorId: actor.id });
}

export async function markDisposalDeliveredByFreelancer(
  actor: ItemActor,
  itemId: string,
): Promise<DisposalResult> {
  if (actor.role !== "FREELANCER") {
    return { ok: false, error: "Отметить сдачу может фрилансер" };
  }
  return markDisposalDelivered({
    itemId,
    actorId: actor.id,
    asFreelancer: true,
  });
}

export async function loadFreelancerDisposalJobs(freelancerId: string) {
  return listDisposalJobsForFreelancer(freelancerId);
}

export async function loadDisposalJob(itemId: string) {
  return findDisposalJobByItemId(itemId);
}
