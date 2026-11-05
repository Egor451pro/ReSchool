import { Suspense } from "react";
import { HomeStartClient } from "@/components/home-start-client";
import {
  listSchoolStaffProfiles,
  listWorkshopStaffProfiles,
} from "@/server/repositories/user-repository";

async function HomeStartProfiles() {
  const [schools, workshops] = await Promise.all([
    listSchoolStaffProfiles(),
    listWorkshopStaffProfiles(),
  ]);

  return (
    <HomeStartClient
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

export function HomeStart() {
  return (
    <Suspense
      fallback={
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">С чего начать</h2>
          <p className="text-sm text-leaf">Загружаем профили…</p>
        </section>
      }
    >
      <HomeStartProfiles />
    </Suspense>
  );
}
