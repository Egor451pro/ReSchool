import { Suspense } from "react";
import { HomeStartClient } from "@/components/home-start-client";
import { listInstitutionLoginProfiles } from "@/server/repositories/user-repository";

async function HomeStartProfiles() {
  const institutions = await listInstitutionLoginProfiles();

  return (
    <HomeStartClient
      institutions={institutions.map((row) => ({
        email: row.email,
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
