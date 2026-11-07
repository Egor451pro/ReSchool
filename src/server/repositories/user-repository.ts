import "server-only";

import type { UserRole } from "@/domain/access/roles";
import type { InstitutionType } from "@prisma/client";
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
  institutionId?: string | null;
}) {
  return prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      institutionId: input.institutionId ?? null,
    },
    select: userSelect,
  });
}

export async function createDonorWithInstitution(input: {
  fullName: string;
  email: string;
  passwordHash: string;
  consentAt: Date;
  consentVersion: string;
  institution: {
    name: string;
    type: InstitutionType;
    district: string;
    address: string;
    phone: string;
    email: string;
  };
}) {
  return prisma.$transaction(async (tx) => {
    const institution = await tx.institution.create({
      data: {
        name: input.institution.name,
        type: input.institution.type,
        district: input.institution.district,
        address: input.institution.address,
        phone: input.institution.phone,
        email: input.institution.email,
      },
      select: { id: true },
    });

    const user = await tx.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        passwordHash: input.passwordHash,
        role: "DONOR_STAFF",
        institutionId: institution.id,
        consentAt: input.consentAt,
        consentVersion: input.consentVersion,
      },
      select: userSelect,
    });

    await tx.wallet.create({
      data: { userId: user.id, balanceKop: 0 },
    });

    return user;
  });
}

export async function createFreelancer(input: {
  fullName: string;
  email: string;
  passwordHash: string;
  specialtyIds: string[];
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  consentAt: Date;
  consentVersion: string;
}) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        passwordHash: input.passwordHash,
        role: "FREELANCER",
        institutionId: null,
        address: input.address ?? null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        consentAt: input.consentAt,
        consentVersion: input.consentVersion,
      },
      select: userSelect,
    });

    if (input.specialtyIds.length > 0) {
      await tx.freelancerSkill.createMany({
        data: input.specialtyIds.map((specialtyId) => ({
          userId: user.id,
          specialtyId,
        })),
      });
    }

    await tx.wallet.create({
      data: { userId: user.id, balanceKop: 0 },
    });

    return user;
  });
}

export function listUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
    select: userSelect,
  });
}

/**
 * Учётки для быстрого входа по роли:
 * саморегистрации (не *.demo) + сидовый аналитик района.
 */
export function listRegisteredAccounts() {
  return prisma.user.findMany({
    where: {
      OR: [
        { NOT: { email: { endsWith: ".demo" } } },
        { role: "DISTRICT_ANALYST" },
      ],
    },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      role: true,
      email: true,
      institution: { select: { name: true } },
    },
  });
}

export function listSpecialties() {
  return prisma.specialty.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export function countInstitutionItems(institutionId: string) {
  return prisma.item.count({ where: { institutionId } });
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
