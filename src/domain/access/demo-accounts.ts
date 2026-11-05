export const DEMO_PASSWORD = "demo1234";

export type DemoAccount = {
  label: string;
  email: string;
  hint: string;
};

/** Три профиля MVP: школа, мастерская, администратор. */
export const demoAccounts: DemoAccount[] = [
  {
    label: "Школа",
    email: "zavhoz@school1.demo",
    hint: "Публикую вещи, которые можно починить",
  },
  {
    label: "Мастерская",
    email: "master.wood@college.demo",
    hint: "Беру задания и веду ремонт",
  },
  {
    label: "Администратор",
    email: "admin@reschool.demo",
    hint: "Смотрю все разделы платформы",
  },
];
