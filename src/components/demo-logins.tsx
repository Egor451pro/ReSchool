import { Suspense } from "react";
import { HomeStartClient } from "@/components/home-start-client";
import { listInstitutionLoginProfiles } from "@/server/repositories/user-repository";

async function DemoLoginProfiles({ next }: { next?: string }) {
  const institutions = await listInstitutionLoginProfiles();

  return (
    <HomeStartClient
      title="Выберите роль"
      next={next}
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

export function DemoLogins({ next }: { next?: string }) {
  return (
    <Suspense fallback={<p className="text-sm text-leaf">Загружаем профили…</p>}>
      <DemoLoginProfiles next={next} />
    </Suspense>
  );
}
