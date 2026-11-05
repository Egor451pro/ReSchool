"use client";

import { useState } from "react";
import { demoLoginAction } from "@/app/actions/auth";
import { DEMO_PASSWORD } from "@/domain/access/demo-accounts";
import { institutionTypeLabels, type InstitutionType } from "@/domain/access/roles";

export type DemoProfile = {
  email: string;
  institution: {
    id: string;
    name: string;
    type: InstitutionType;
    address: string;
  };
};

const MASTER_EMAIL = "master.wood@college.demo";

type Step = "choose" | "institutions";

export function HomeStartClient({
  institutions,
  next,
  title = "С чего начать",
}: {
  institutions: DemoProfile[];
  next?: string;
  title?: string;
}) {
  const [step, setStep] = useState<Step>("choose");

  if (step === "institutions") {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Выберите учреждение</h2>
            <p className="text-sm text-leaf">Войдёте как завхоз — можно публиковать заявки на ремонт.</p>
          </div>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setStep("choose")}>
            Назад
          </button>
        </div>
        <ProfileList
          profiles={institutions}
          empty="В базе пока нет учреждений."
          next={next}
        />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setStep("institutions")}
          className="flex w-full flex-col gap-2 rounded-xl bg-ink px-5 py-5 text-left text-white hover:bg-leaf"
        >
          <span className="text-lg font-semibold">Я завхоз</span>
          <span className="text-sm text-mint">Опубликовать вещи своей школы или учреждения</span>
        </button>
        <form action={demoLoginAction} className="h-full">
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <input type="hidden" name="email" value={MASTER_EMAIL} />
          <input type="hidden" name="password" value={DEMO_PASSWORD} />
          <button
            type="submit"
            className="flex h-full w-full flex-col gap-2 rounded-xl border border-ink px-5 py-5 text-left text-ink hover:bg-mint/30"
          >
            <span className="text-lg font-semibold">Я исполнитель</span>
            <span className="text-sm text-leaf">Взять ремонт в работу на бирже заказов</span>
          </button>
        </form>
      </div>
      <form action={demoLoginAction} className="text-sm text-leaf">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <input type="hidden" name="email" value="admin@reschool.demo" />
        <input type="hidden" name="password" value={DEMO_PASSWORD} />
        Нужна сводка по району?{" "}
        <button type="submit" className="font-medium text-leaf underline hover:text-ink">
          Войти как администратор
        </button>
      </form>
    </section>
  );
}

function ProfileList({
  profiles,
  empty,
  next,
}: {
  profiles: DemoProfile[];
  empty: string;
  next?: string;
}) {
  if (profiles.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-mint/70 px-4 py-5 text-sm text-leaf">
        {empty}
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {profiles.map((profile) => (
        <li key={profile.email}>
          <form action={demoLoginAction}>
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <input type="hidden" name="email" value={profile.email} />
            <input type="hidden" name="password" value={DEMO_PASSWORD} />
            <button
              type="submit"
              className="flex h-full w-full flex-col gap-1 rounded-xl border border-mint/70 bg-paper px-4 py-4 text-left hover:border-leaf hover:bg-mint/20"
            >
              <span className="font-semibold text-ink">{profile.institution.name}</span>
              <span className="text-xs text-leaf">
                Завхоз · {institutionTypeLabels[profile.institution.type]}
              </span>
              <span className="text-xs text-leaf">{profile.institution.address}</span>
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
