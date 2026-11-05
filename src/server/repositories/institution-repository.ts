import "server-only";

import { prisma } from "@/server/db";

export function listJoinableInstitutions() {
  return prisma.institution.findMany({
    where: {
      type: { in: ["SCHOOL", "GYMNASIUM", "LYCEUM", "COLLEGE", "VOCATIONAL"] },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: { id: true, name: true, type: true },
  });
}

export function findInstitutionById(id: string) {
  return prisma.institution.findUnique({
    where: { id },
    select: { id: true, type: true },
  });
}
