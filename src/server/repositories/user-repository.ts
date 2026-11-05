import "server-only";

import type { UserRole } from "@/domain/access/roles";
import { prisma } from "@/server/db";

const userSelect = {
  id: true,
  fullName: true,
  role: true,
  email: true,
  institutionId: true,
  institution: { select: { name: true, type: true, district: true } },
} as const;

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { ...userSelect, passwordHash: true },
  });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: userSelect });
}

export function createUser(input: {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  institutionId: string;
}) {
  return prisma.user.create({ data: input, select: userSelect });
}

export function listUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
    select: userSelect,
  });
}

export function countInstitutionItems(institutionId: string) {
  return prisma.item.count({ where: { institutionId } });
}

export function countWorkshopOrders(institutionId: string) {
  return prisma.repairOrder.count({
    where: { workshopInstitutionId: institutionId },
  });
}

export function listLedGroups(masterId: string) {
  return prisma.studyGroup.findMany({
    where: { masterId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      specialty: { select: { name: true } },
      students: { select: { id: true, fullName: true }, orderBy: { fullName: "asc" } },
    },
  });
}

export function countDistrict(district: string | null) {
  const institutionWhere = district ? { district } : {};
  return Promise.all([
    prisma.institution.count({ where: institutionWhere }),
    prisma.item.count({ where: { institution: institutionWhere } }),
    prisma.economySnapshot.count({
      where: district
        ? { order: { item: { institution: { district } } } }
        : {},
    }),
  ]);
}
