import { Suspense } from "react";
import { HomeStartClient } from "@/components/home-start-client";
import {
  listSchoolStaffProfiles,
  listWorkshopStaffProfiles,
} from "@/server/repositories/user-repository";

async function DemoLoginProfiles({ next }: { next?: string }) {
  const [schools, workshops] = await Promise.all([
    listSchoolStaffProfiles(),
    listWorkshopStaffProfiles(),
  ]);

  return (
    <HomeStartClient
      title="Выберите профиль"
      next={next}
      schools={schools.map((row) => ({
        email: row.email,
        fullName: row.fullName,
        institution: {
          id: row.institution!.id,
          name: row.institution!.name,
          type: row.institution!.type,
          address: row.institution!.address,
        },
      }))}
      workshops={workshops.map((row) => ({
        email: row.email,
        fullName: row.fullName,
        institution: {
          id: row.institution!.id,
          name: row.institution!.name,
          type: row.institution!.type,
          address: row.institution!.address,
        },
      }))}
    />
  );
}

export function DemoLogins({ next }: { next?: string }) {
  return (
    <Suspense
      fallback={<p className="text-sm text-leaf">Загружаем профили…</p>}
    >
      <DemoLoginProfiles next={next} />
    </Suspense>
  );
}
