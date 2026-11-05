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

const loginProfileSelect = {
  email: true,
  fullName: true,
  role: true,
  institution: {
    select: { id: true, name: true, type: true, address: true },
  },
} as const;

/**
 * Один вход на учреждение: школы и колледжи/ПТУ.
 * Если есть сотрудник школы — берём его, иначе мастера колледжа.
 */
export async function listInstitutionLoginProfiles() {
  const rows = await prisma.user.findMany({
    where: {
      institutionId: { not: null },
      role: { in: ["DONOR_STAFF", "WORKSHOP_MASTER"] },
      institution: {
        type: { in: ["SCHOOL", "GYMNASIUM", "LYCEUM", "COLLEGE", "VOCATIONAL"] },
      },
    },
    orderBy: [{ institution: { name: "asc" } }, { fullName: "asc" }],
    select: loginProfileSelect,
  });

  const byInstitution = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!row.institution) continue;
    const current = byInstitution.get(row.institution.id);
    if (!current || (row.role === "DONOR_STAFF" && current.role !== "DONOR_STAFF")) {
      byInstitution.set(row.institution.id, row);
    }
  }

  return [...byInstitution.values()].sort((left, right) =>
    (left.institution?.name ?? "").localeCompare(right.institution?.name ?? "", "ru"),
  );
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
