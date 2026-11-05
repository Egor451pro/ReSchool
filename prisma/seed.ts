import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assumptionSetSchema } from "../src/lib/validators/assumption";
import {
  DEMO_PASSWORD,
  DISTRICT,
  assumptionSets,
  categories,
  categorySpecialtyLinks,
  disposalKop,
  groups,
  institutions,
  specialties,
  staff,
  students,
} from "./seed-data";

const prisma = new PrismaClient();

function must<T>(map: Map<string, T>, key: string): T {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`В сиде нет ключа «${key}»`);
  }
  return value;
}

async function clearDatabase(): Promise<void> {
  await prisma.portfolioEntry.deleteMany();
  await prisma.economySnapshot.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.document.deleteMany();
  await prisma.orderParticipant.deleteMany();
  await prisma.statusEvent.deleteMany();
  await prisma.repairOrder.deleteMany();
  await prisma.request.deleteMany();
  await prisma.itemPhoto.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.updateMany({ data: { groupId: null } });
  await prisma.studyGroup.deleteMany();
  await prisma.disposalRate.deleteMany();
  await prisma.assumptionSet.deleteMany();
  await prisma.categorySpecialty.deleteMany();
  await prisma.category.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();
}

async function main(): Promise<void> {
  const avgDisposalKop = Math.round(
    Object.values(disposalKop).reduce((sum, value) => sum + value, 0) /
      Object.values(disposalKop).length,
  );

  await clearDatabase();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const institutionId = new Map<string, string>();
  for (const institution of institutions) {
    const created = await prisma.institution.create({
      data: {
        name: institution.name,
        type: institution.type,
        district: DISTRICT,
        address: institution.address,
        lat: institution.lat,
        lng: institution.lng,
        phone: institution.phone,
        email: institution.email,
      },
    });
    institutionId.set(institution.key, created.id);
  }

  const userId = new Map<string, string>();
  for (const person of staff) {
    const created = await prisma.user.create({
      data: {
        fullName: person.fullName,
        role: person.role,
        email: person.email,
        passwordHash,
        institutionId: person.institution ? must(institutionId, person.institution) : null,
      },
    });
    userId.set(person.key, created.id);
  }

  const specialtyId = new Map<string, string>();
  for (const specialty of specialties) {
    const created = await prisma.specialty.create({
      data: { name: specialty.name, slug: specialty.slug },
    });
    specialtyId.set(specialty.slug, created.id);
  }

  const categoryId = new Map<string, string>();
  for (const category of categories) {
    const created = await prisma.category.create({
      data: { name: category.name, slug: category.slug },
    });
    categoryId.set(category.slug, created.id);
  }

  for (const link of categorySpecialtyLinks) {
    await prisma.categorySpecialty.create({
      data: {
        categoryId: must(categoryId, link.category),
        specialtyId: must(specialtyId, link.specialty),
      },
    });
  }

  const assumptionId = new Map<string, string>();
  for (const set of assumptionSets) {
    const parsed = assumptionSetSchema.parse({ ...set, avgDisposalKop });
    const created = await prisma.assumptionSet.create({ data: parsed });
    assumptionId.set(parsed.kind, created.id);
    for (const [slug, perUnitKop] of Object.entries(disposalKop)) {
      await prisma.disposalRate.create({
        data: {
          assumptionId: created.id,
          categoryId: must(categoryId, slug),
          perUnitKop,
        },
      });
    }
  }
  void assumptionId;

  const groupId = new Map<string, string>();
  for (const group of groups) {
    const created = await prisma.studyGroup.create({
      data: {
        name: group.name,
        institutionId: must(institutionId, group.institution),
        specialtyId: must(specialtyId, group.specialty),
        masterId: must(userId, group.master),
      },
    });
    groupId.set(group.key, created.id);
  }

  for (const student of students) {
    const created = await prisma.user.create({
      data: {
        fullName: student.fullName,
        role: "STUDENT",
        email: student.email,
        passwordHash,
        institutionId: must(institutionId, student.institution),
        groupId: must(groupId, student.group),
      },
    });
    userId.set(student.key, created.id);
  }

  const itemCount = await prisma.item.count();
  if (itemCount !== 0) {
    throw new Error(`Каталог должен быть пустым, сейчас предметов: ${itemCount}`);
  }

  console.log(
    `Сид готов: ${institutions.length} учреждений, каталог пустой. Демо начинается с публикации.`,
  );
  console.log(`Демо-пароль всех учёток: ${DEMO_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
