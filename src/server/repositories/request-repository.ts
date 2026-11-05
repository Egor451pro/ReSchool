import "server-only";

import { prisma } from "@/server/db";

const requestSelect = {
  id: true,
  title: true,
  description: true,
  quantity: true,
  status: true,
  createdAt: true,
  category: { select: { name: true } },
  institution: { select: { name: true } },
} as const;

export function listInstitutionRequests(institutionId: string) {
  return prisma.request.findMany({
    where: { institutionId },
    orderBy: { createdAt: "desc" },
    select: requestSelect,
  });
}

export function listOpenRequests() {
  return prisma.request.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    select: requestSelect,
  });
}

export function createOpenRequest(input: {
  institutionId: string;
  categoryId: string;
  title: string;
  description: string;
  quantity: number;
}) {
  return prisma.request.create({
    data: { ...input, status: "OPEN" },
    select: { id: true },
  });
}
