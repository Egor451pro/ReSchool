"use client";

import { useState } from "react";
import { demoLoginAction } from "@/app/actions/auth";
import { DEMO_PASSWORD } from "@/domain/access/demo-accounts";
import { institutionTypeLabels, type InstitutionType } from "@/domain/access/roles";

export type DemoProfile = {
  email: string;
  fullName: string;
  institution: {
    id: string;
    name: string;
    type: InstitutionType;
    address: string;
  };
};

type Step = "choose" | "schools" | "workshops";

export function HomeStartClient({
  schools,
  workshops,
  next,
  title = "С чего начать",
}: {
  schools: DemoProfile[];
  workshops: DemoProfile[];
  next?: string;
  title?: string;
}) {
  const [step, setStep] = useState<Step>("choose");

  if (step === "schools") {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Выберите школу</h2>
            <p className="text-sm text-leaf">Войдёте как сотрудник выбранного учреждения.</p>
          </div>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setStep("choose")}>
            Назад
          </button>
        </div>
        <ProfileList profiles={schools} empty="В базе пока нет школ." next={next} />
      </section>
    );
  }

  if (step === "workshops") {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Выберите мастерскую</h2>
            <p className="text-sm text-leaf">Войдёте как мастер учебной группы.</p>
          </div>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setStep("choose")}>
            Назад
          </button>
        </div>
        <ProfileList profiles={workshops} empty="В базе пока нет мастерских." next={next} />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setStep("schools")}
          className="flex w-full flex-col gap-2 rounded-xl bg-ink px-5 py-5 text-left text-white hover:bg-leaf"
        >
          <span className="text-lg font-semibold">Я из школы</span>
          <span className="text-sm text-mint">
            Выберите учреждение и опубликуйте вещи для ремонта
          </span>
        </button>
        <button
          type="button"
          onClick={() => setStep("workshops")}
          className="flex w-full flex-col gap-2 rounded-xl border border-ink px-5 py-5 text-left text-ink hover:bg-mint/30"
        >
          <span className="text-lg font-semibold">Я из мастерской</span>
          <span className="text-sm text-leaf">
            Выберите профиль мастера и возьмите учебное задание
          </span>
        </button>
      </div>
      <form action={demoLoginAction} className="text-sm text-leaf">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <input type="hidden" name="email" value="admin@reschool.demo" />
        <input type="hidden" name="password" value={DEMO_PASSWORD} />
        Нужен обзор всего?{" "}
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
                {institutionTypeLabels[profile.institution.type]} · {profile.fullName}
              </span>
              <span className="text-xs text-leaf">{profile.institution.address}</span>
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
